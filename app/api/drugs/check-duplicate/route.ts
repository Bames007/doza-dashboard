// app/api/drugs/check-duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";

// ---------- Zod Schema ----------
const duplicateCheckSchema = z.object({
  genericName: z.string().min(1, "Generic name required"),
  strength: z.string().min(1, "Strength required"),
  dosageForm: z.string().min(1, "Dosage form required"),
  manufacturer: z.string().optional(),
});

async function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const rateKey = `${userId}:check-duplicate`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ userId }, "Duplicate check rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = duplicateCheckSchema.parse(body);
    const { genericName, strength, dosageForm, manufacturer } = validated;

    const drugsRef = ref(db, "doza_drugsdb/drugs");
    const snapshot = await get(drugsRef);

    if (!snapshot.exists()) {
      logger.info("No drugs in database for duplicate check");
      return NextResponse.json({ duplicate: false });
    }

    const drugs = snapshot.val();
    let highestConfidence = 0;
    let duplicateId: string | undefined;
    let duplicateDetails: any = null;

    for (const [key, existingDrug] of Object.entries(drugs) as [
      string,
      any,
    ][]) {
      let confidence = 0;
      if (
        existingDrug.genericName?.toLowerCase() === genericName.toLowerCase() &&
        existingDrug.strength === strength &&
        existingDrug.dosageForm === dosageForm
      ) {
        confidence = 95;
      } else if (
        existingDrug.genericName?.toLowerCase() === genericName.toLowerCase() &&
        existingDrug.manufacturer?.toLowerCase() === manufacturer?.toLowerCase()
      ) {
        confidence = 85;
      } else if (
        existingDrug.genericName
          ?.toLowerCase()
          .includes(genericName.toLowerCase()) ||
        genericName
          .toLowerCase()
          .includes(existingDrug.genericName?.toLowerCase())
      ) {
        confidence = 70;
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        duplicateId = key;
        duplicateDetails = existingDrug;
      }
    }

    logger.info(
      { genericName, highestConfidence },
      "Duplicate check completed",
    );
    if (highestConfidence >= 70) {
      return NextResponse.json({
        duplicate: {
          drugId: duplicateId,
          confidence: highestConfidence,
          details: duplicateDetails,
          message: `Found similar drug with ${highestConfidence}% confidence`,
        },
      });
    }

    return NextResponse.json({ duplicate: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error checking duplicate");
    return NextResponse.json({ duplicate: false, error: msg }, { status: 500 });
  }
}
