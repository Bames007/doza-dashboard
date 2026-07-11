// app/api/centers/[id]/inventory/audit/route.ts
// URL: /api/centers/[id]/inventory/audit
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

    const rateKey = `${userId}:audit:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `audit:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
    const snapshot = await get(auditRef);
    let logs: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      logs = Object.entries(data)
        .map(([key, val]) => ({ id: key, ...(val as any) }))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    }

    cache.set(cacheKey, logs, 30);
    logger.info({ centerId, count: logs.length }, "Audit logs fetched");
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleError(error);
  }
}
