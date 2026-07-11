// app/api/centers/[id]/procedures/route.ts
// URL: /api/centers/[id]/procedures
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

    const rateKey = `${userId}:procedures:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `procedures:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Procedures from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const proceduresRef = ref(db, `doza_centers/${centerId}/procedures`);
    const snapshot = await get(proceduresRef);

    let procedures: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      procedures = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as Record<string, any>),
      }));
    }

    cache.set(cacheKey, procedures, 30);
    logger.info({ centerId, count: procedures.length }, "Procedures fetched");
    return NextResponse.json({ success: true, data: procedures });
  } catch (error) {
    return handleError(error);
  }
}
