// app/api/medics/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";

// ---------- Zod Schema ----------
const emailQuerySchema = z.object({
  email: z.string().email("Valid email is required"),
});

async function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");

    // Validate email with Zod
    try {
      emailQuerySchema.parse({ email: emailParam });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }
    }

    const email = emailParam as string;

    // Rate limit
    const rateKey = `${userId}:medic-check:${email}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ userId, email }, "Medic check rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `medicCheck:${email}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ email }, "Medic check from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    logger.info({ email }, "Checking medic registration status");

    // Query Firebase
    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);

    let existingMedic = null;
    let medicId = null;

    if (snapshot.exists()) {
      const medics = snapshot.val();
      for (const [id, medic] of Object.entries(medics) as [string, any][]) {
        if (medic?.personalInfo?.email === email) {
          existingMedic = medic;
          medicId = id;
          break;
        }
      }
    }

    const result = {
      isRegistered: !!existingMedic,
      medicId,
      medicData: existingMedic,
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { email, isRegistered: result.isRegistered },
      "Medic check completed",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error checking medic status");
    return NextResponse.json(
      { success: false, error: "Failed to check medic status" },
      { status: 500 },
    );
  }
}
