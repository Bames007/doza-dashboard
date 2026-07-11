// app/api/centers/[id]/surgeries/route.ts
// URL: /api/centers/[id]/surgeries
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

    const rateKey = `${userId}:surgeries:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `surgeries:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Surgeries stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const surgeriesRef = ref(db, `doza_centers/${centerId}/surgeries`);
    const snapshot = await get(surgeriesRef);

    let surgeriesStats = { scheduled: 0, ongoing: 0, completed: 0 };
    if (snapshot.exists()) {
      surgeriesStats = snapshot.val();
    }

    cache.set(cacheKey, surgeriesStats, 30);
    logger.info({ centerId }, "Surgeries stats fetched");
    return NextResponse.json({ success: true, data: surgeriesStats });
  } catch (error) {
    return handleError(error);
  }
}
