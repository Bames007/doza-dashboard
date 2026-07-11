// app/api/centers/[id]/optical/orders/route.ts
// URL: /api/centers/[id]/optical/orders
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

    const rateKey = `${userId}:optical-orders:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `opticalOrders:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Optical orders from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const ordersRef = ref(db, `doza_centers/${centerId}/orders`);
    const snapshot = await get(ordersRef);

    let orders: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      orders = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as Record<string, any>),
      }));
    }

    cache.set(cacheKey, orders, 30);
    logger.info({ centerId, count: orders.length }, "Optical orders fetched");
    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    return handleError(error);
  }
}
