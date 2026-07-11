// app/api/centers/[id]/visits/route.ts
// URL: /api/centers/[id]/visits
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

    const rateKey = `${userId}:visits:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `visits:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Visits stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const visitsRef = ref(db, `doza_centers/${centerId}/visits`);
    const snapshot = await get(visitsRef);
    let visitsStats = { todayVisits: 0, newPatients: 0, followUps: 0 };
    if (snapshot.exists()) {
      visitsStats = snapshot.val();
    }

    cache.set(cacheKey, visitsStats, 30);
    logger.info({ centerId }, "Visits stats fetched");
    return NextResponse.json({ success: true, data: visitsStats });
  } catch (error) {
    return handleError(error);
  }
}
