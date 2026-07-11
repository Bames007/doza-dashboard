// app/api/centers/[id]/inventory/[productId]/audit/route.ts
// URL: /api/centers/[id]/inventory/[productId]/audit
// Method: GET

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const { id: centerId, productId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:product-audit:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
    const snapshot = await get(auditRef);
    let logs: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      logs = Object.entries(data)
        .map(([key, val]) => ({ id: key, ...(val as any) }))
        .filter((log) => log.productId === productId)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    }

    logger.info(
      { centerId, productId, count: logs.length },
      "Product audit logs fetched",
    );
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return handleError(error);
  }
}
