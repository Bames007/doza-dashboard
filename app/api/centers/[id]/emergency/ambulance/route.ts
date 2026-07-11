// URL: /api/centers/[id]/emergency/ambulance
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

    const rateKey = `${userId}:emergency-ambulance:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyAmbulance:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const ambulanceRef = ref(
      db,
      `doza_centers/${centerId}/emergency/ambulance`,
    );
    const snapshot = await get(ambulanceRef);
    const data = snapshot.exists() ? snapshot.val() : {};

    const ambulanceData = {
      incoming: data.incoming ?? 0,
      within10: data.within10 ?? 0,
      avg: data.avg ?? 0,
      list: data.list ?? [],
    };

    cache.set(cacheKey, ambulanceData, 30);
    logger.info({ centerId, ambulanceData }, "Ambulance arrivals fetched");
    return NextResponse.json({ success: true, data: ambulanceData });
  } catch (error) {
    return handleError(error);
  }
}
