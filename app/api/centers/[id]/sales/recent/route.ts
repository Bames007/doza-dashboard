// app/api/centers/[id]/sales/recent/route.ts
// URL: /api/centers/[id]/sales/recent
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

    const rateKey = `${userId}:recent-sales:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `recentSales:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Recent sales from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const salesRef = ref(db, `doza_centers/${centerId}/sales`);
    const snapshot = await get(salesRef);

    let recentSales: any[] = [];
    if (snapshot.exists()) {
      const salesObj = snapshot.val();
      const salesArray = Object.entries(salesObj).map(([key, value]) => ({
        id: key,
        ...(value as any),
      }));

      salesArray.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      recentSales = salesArray.slice(0, 5).map((sale) => {
        let time = "Recently";
        if (sale.createdAt) {
          const date = new Date(sale.createdAt);
          time = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
        return {
          id: sale.id,
          amount: Number(sale.totalAmount) || 0,
          time,
          items: sale.items?.length || 1,
          customer: sale.customerName || "Walk-in Customer",
          status: sale.status || "COMPLETED",
        };
      });
    }

    cache.set(cacheKey, recentSales, 30);
    logger.info(
      { centerId, count: recentSales.length },
      "Recent sales fetched",
    );
    return NextResponse.json({ success: true, data: recentSales });
  } catch (error) {
    return handleError(error);
  }
}
