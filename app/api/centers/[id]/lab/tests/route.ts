// app/api/centers/[id]/lab/tests/route.ts
// URL: /api/centers/[id]/lab/tests
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

    const rateKey = `${userId}:lab-tests:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `labTestsAll:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Lab tests from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const testsRef = ref(db, `doza_centers/${centerId}/tests`);
    const snapshot = await get(testsRef);

    let allTests: any[] = [];
    if (snapshot.exists()) {
      const tests = snapshot.val();
      allTests = Object.entries(tests).map(([id, test]) => ({
        id,
        ...(test as Record<string, any>),
      }));
    }

    cache.set(cacheKey, allTests, 30);
    logger.info({ centerId, count: allTests.length }, "All lab tests fetched");
    return NextResponse.json({ success: true, data: allTests });
  } catch (error) {
    return handleError(error);
  }
}
