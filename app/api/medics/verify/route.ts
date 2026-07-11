// app/api/medics/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";

// ---------- Zod Schema ----------
const verifyQuerySchema = z
  .object({
    email: z.string().email("Valid email required").optional(),
    userId: z.string().optional(),
  })
  .refine((data) => data.email || data.userId, {
    message: "Email or User ID is required",
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

function getClientIdentifier(request: NextRequest): string {
  const userId = request.headers.get("x-user-id");
  if (userId) return userId;
  const { searchParams } = new URL(request.url);
  return searchParams.get("email") || searchParams.get("userId") || "unknown";
}

// ---------- GET ----------
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || undefined;
    const userId = searchParams.get("userId") || undefined;

    // Validate query params
    try {
      verifyQuerySchema.parse({ email, userId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }
    }

    // Rate limit
    const identifier = getClientIdentifier(request);
    const rateKey = `medic-verify:${identifier}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ identifier }, "Medic verify rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache – keyed by email or userId
    const cacheKey = `medicVerify:${email || userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ email, userId }, "Medic verify from cache");
      return NextResponse.json({ success: true, ...cached });
    }

    logger.info({ email, userId }, "Verifying medic status");

    // Query Firebase
    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);

    let medicFound: any = null;
    let medicId: string | null = null;

    if (snapshot.exists()) {
      const medics = snapshot.val();
      for (const [id, medic] of Object.entries(medics) as [string, any][]) {
        const medicEmail = medic?.personalInfo?.email?.toLowerCase();
        if (email && medicEmail === email.toLowerCase()) {
          medicFound = medic;
          medicId = id;
          break;
        }
        if (userId && !medicFound && id === userId) {
          medicFound = medic;
          medicId = id;
          break;
        }
        if (userId && !medicFound && medic?.userId === userId) {
          medicFound = medic;
          medicId = id;
          break;
        }
      }
    }

    if (!medicFound) {
      const result = {
        isRegistered: false,
        isMedic: false,
        message: "Not registered as a Doza medic",
        redirectUrl: "/medic",
      };
      cache.set(cacheKey, result, 30);
      logger.info({ email, userId }, "Not a registered medic");
      return NextResponse.json({ success: true, ...result });
    }

    // Medic found
    const isApproved = medicFound.status === "approved";
    const totalPoints = medicFound?.points || 0;

    const result = {
      isRegistered: true,
      isMedic: isApproved,
      medicId,
      medicData: { ...medicFound, id: medicId },
      points: {
        totalPoints,
        level: calculateLevel(totalPoints),
        verifiedDrugs: medicFound?.verifiedDrugs || 0,
        pendingReview: medicFound?.pendingReview || 0,
      },
      status: medicFound.status,
      verified: medicFound.verified,
      message: isApproved
        ? "Registered and approved medic"
        : `Medic account is ${medicFound.status}`,
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { medicId, email, status: medicFound.status },
      "Medic verified",
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error verifying medic");
    return NextResponse.json(
      {
        success: false,
        error: msg || "Failed to verify medic status",
      },
      { status: 500 },
    );
  }
}
