// app/api/centers/[id]/lab/samples/route.ts
// URL: /api/centers/[id]/lab/samples
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

    const rateKey = `${userId}:lab-samples:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `labSamples:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Lab samples stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const samplesRef = ref(db, `doza_centers/${centerId}/samples`);
    const snapshot = await get(samplesRef);

    let samplesStats;
    if (snapshot.exists()) {
      samplesStats = snapshot.val();
    } else if (process.env.NODE_ENV === "development") {
      samplesStats = { collected: 45, processed: 30, pending: 12, rejected: 3 };
    } else {
      samplesStats = { collected: 0, processed: 0, pending: 0, rejected: 0 };
    }

    cache.set(cacheKey, samplesStats, 30);
    logger.info({ centerId }, "Lab samples stats fetched");
    return NextResponse.json({ success: true, data: samplesStats });
  } catch (error) {
    return handleError(error);
  }
}
