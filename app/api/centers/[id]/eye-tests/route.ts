// app/api/centers/[id]/eye-tests/route.ts
// URL: /api/centers/[id]/eye-tests
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

    const rateKey = `${userId}:eye-tests:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `eyeTests:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Eye tests from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const eyeTestsRef = ref(db, `doza_centers/${centerId}/eyeTests`);
    const snapshot = await get(eyeTestsRef);

    let eyeTestsStats;
    if (snapshot.exists()) {
      eyeTestsStats = snapshot.val();
    } else if (process.env.NODE_ENV === "development") {
      logger.warn("No eye tests data found, using sample data");
      eyeTestsStats = { todayTests: 15, completed: 12, pending: 3 };
    } else {
      eyeTestsStats = { todayTests: 0, completed: 0, pending: 0 };
    }

    cache.set(cacheKey, eyeTestsStats, 30);
    logger.info({ centerId }, "Eye tests stats retrieved");
    return NextResponse.json({ success: true, data: eyeTestsStats });
  } catch (error) {
    return handleError(error);
  }
}
