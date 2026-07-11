// app/api/medics/check-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";

// ---------- Zod Schema ----------
const checkStatusSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email("Valid email required"),
  centerId: z.string().optional(),
});

// ---------- Helpers ----------
function calculateLevel(points: number): string {
  if (points >= 10000) return "Legendary Medic";
  if (points >= 5000) return "Master Pharmacist";
  if (points >= 2500) return "Senior Pharmacist";
  if (points >= 1000) return "Drug Expert";
  if (points >= 500) return "Advanced Medic";
  if (points >= 100) return "Verified Medic";
  if (points >= 10) return "Beginner Medic";
  return "New Medic";
}

// ---------- POST ----------
export async function POST(request: NextRequest) {
  try {
    // 1) Extract headers and body
    const userIdHeader = request.headers.get("x-user-id");
    const body = await request.json();
    const validated = checkStatusSchema.parse(body);
    const { userId, email, centerId } = validated;

    // 2) Rate limiting – use userId header if available, else email
    const rateKey = userIdHeader || email || "unknown";
    if (!rateLimiter.check(`medic-check-status:${rateKey}`, 30, 60)) {
      logger.warn({ email, rateKey }, "Medic check-status rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // 3) Cache – keyed by email (since it's the primary identifier)
    const cacheKey = `medicCheckStatus:${email}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ email }, "Medic check-status from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    logger.info({ email, userId, centerId }, "Checking medic status");

    // 4) Query Firebase
    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);

    let medicFound = false;
    let medicData: any = null;
    let medicId: string | null = null;

    if (snapshot.exists()) {
      const medics = snapshot.val();
      for (const [id, medic] of Object.entries(medics) as [string, any][]) {
        if (medic?.personalInfo?.email?.toLowerCase() === email.toLowerCase()) {
          medicFound = true;
          medicData = medic;
          medicId = id;
          break;
        }
      }
    }

    // 5) Not a medic
    if (!medicFound) {
      const result = {
        isMedic: false,
        message: "Not registered as a Doza medic",
        redirectUrl: "/medic",
      };
      cache.set(cacheKey, result, 30);
      logger.info({ email }, "Not a registered medic");
      return NextResponse.json({ success: true, data: result });
    }

    // 6) Medic found, check status
    if (medicData.status !== "approved") {
      const result = {
        isMedic: false,
        message: `Medic account is ${medicData.status}. Please wait for approval.`,
        medicData: {
          id: medicId,
          status: medicData.status,
          verified: medicData.verified,
          name: `${medicData.personalInfo?.firstName || ""} ${medicData.personalInfo?.lastName || ""}`.trim(),
        },
      };
      cache.set(cacheKey, result, 30);
      logger.info({ email, status: medicData.status }, "Medic not approved");
      return NextResponse.json({ success: true, data: result });
    }

    // 7) Approved – return full data
    const totalPoints = medicData?.points || 0;
    const result = {
      isMedic: true,
      data: {
        totalPoints,
        verifiedDrugs: medicData?.verifiedDrugs || 0,
        pendingReview: medicData?.pendingReview || 0,
        level: calculateLevel(totalPoints),
        achievements: medicData?.achievements || [],
        averagePoints: medicData?.averagePoints || 0,
        completionRate: medicData?.completionRate || 0,
        lastUpdated: medicData?.lastUpdated || new Date().toISOString(),
        medicInfo: {
          id: medicId,
          name: `${medicData?.personalInfo?.firstName || ""} ${medicData?.personalInfo?.lastName || ""}`.trim(),
          email: medicData?.personalInfo?.email,
          role: medicData?.professionalInfo?.role,
          status: medicData?.status || "pending",
          verified: medicData?.verified || false,
        },
      },
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { email, medicId, status: medicData.status },
      "Medic check completed",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error checking medic status");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
