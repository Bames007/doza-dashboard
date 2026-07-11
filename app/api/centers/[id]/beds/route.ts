// app/api/centers/[id]/beds/route.ts
// URL: /api/centers/[id]/beds
// Method: GET

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:beds:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `beds:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Beds stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const bedsRef = ref(db, `doza_centers/${centerId}/beds`);
    const snapshot = await get(bedsRef);
    let bedsStats;
    if (snapshot.exists()) {
      bedsStats = snapshot.val();
    } else if (process.env.NODE_ENV === "development") {
      bedsStats = {
        totalBeds: 150,
        occupied: 98,
        available: 52,
        icuAvailable: 5,
        emergencyAvailable: 8,
      };
    } else {
      bedsStats = {
        totalBeds: 0,
        occupied: 0,
        available: 0,
        icuAvailable: 0,
        emergencyAvailable: 0,
      };
    }

    cache.set(cacheKey, bedsStats, 30);
    logger.info({ centerId }, "Beds stats retrieved");
    return NextResponse.json({ success: true, data: bedsStats });
  } catch (error) {
    return handleError(error);
  }
}
