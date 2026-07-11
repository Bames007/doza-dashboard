// app/api/centers/[id]/admission/route.ts
// URL: /api/centers/[id]/admission
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

    const rateKey = `${userId}:admission:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `admission:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Admission stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const admissionsRef = ref(db, `doza_centers/${centerId}/admissions`);
    const snapshot = await get(admissionsRef);

    let admissionsStats;
    if (snapshot.exists()) {
      admissionsStats = snapshot.val();
    } else if (process.env.NODE_ENV === "development") {
      admissionsStats = {
        todayAdmissions: 12,
        todayDischarges: 8,
        pendingDischarges: 3,
      };
    } else {
      admissionsStats = {
        todayAdmissions: 0,
        todayDischarges: 0,
        pendingDischarges: 0,
      };
    }

    cache.set(cacheKey, admissionsStats, 30);
    logger.info(
      { centerId, stats: admissionsStats },
      "Admissions stats fetched",
    );
    return NextResponse.json({ success: true, data: admissionsStats });
  } catch (error) {
    return handleError(error);
  }
}
