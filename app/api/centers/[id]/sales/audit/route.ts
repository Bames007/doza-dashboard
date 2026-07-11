// app/api/centers/[id]/sales/audit/route.ts
// URL: /api/centers/[id]/sales/audit
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

    const { searchParams } = new URL(request.url);
    const startDate =
      searchParams.get("startDate") ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();

    const rateKey = `${userId}:sales-audit:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `salesAudit:${centerId}:${startDate}:${endDate}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Sales audit from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const salesRef = ref(db, `doza_centers/${centerId}/sales`);
    const snapshot = await get(salesRef);

    let salesArray: any[] = [];
    if (snapshot.exists()) {
      const salesData = snapshot.val();
      salesArray = Object.entries(salesData).map(([id, sale]) => ({
        id,
        ...(sale as any),
      }));
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredSales = salesArray.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= start && saleDate <= end;
    });

    filteredSales.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const stats = {
      totalSales: filteredSales.length,
      totalRevenue: filteredSales.reduce(
        (sum, sale) => sum + (sale.totalAmount || 0),
        0,
      ),
      averageSaleValue:
        filteredSales.length > 0
          ? filteredSales.reduce(
              (sum, sale) => sum + (sale.totalAmount || 0),
              0,
            ) / filteredSales.length
          : 0,
    };

    const result = {
      sales: filteredSales,
      total: filteredSales.length,
      stats,
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { centerId, count: filteredSales.length },
      "Sales audit fetched",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
