// app/api/centers/[id]/samples/route.ts
// URL: /api/centers/[id]/samples
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

    const rateKey = `${userId}:samples:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `samples:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Samples stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const samplesRef = ref(db, `doza_centers/${centerId}/samples`);
    const snapshot = await get(samplesRef);

    let samplesStats = { collected: 0, processed: 0, pending: 0, rejected: 0 };
    if (snapshot.exists()) {
      samplesStats = snapshot.val();
    }

    cache.set(cacheKey, samplesStats, 30);
    logger.info({ centerId }, "Samples stats fetched");
    return NextResponse.json({ success: true, data: samplesStats });
  } catch (error) {
    return handleError(error);
  }
}
