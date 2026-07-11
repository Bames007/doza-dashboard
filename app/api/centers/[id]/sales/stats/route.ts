// app/api/centers/[id]/sales/stats/route.ts
// URL: /api/centers/[id]/sales/stats
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const rateKey = `${userId}:sales-stats:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `salesStats:${centerId}:${startDate || ""}:${endDate || ""}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Sales stats from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const salesRef = ref(db, `doza_centers/${centerId}/sales`);
    const snapshot = await get(salesRef);

    let salesArray: any[] = [];
    if (snapshot.exists()) {
      const salesObj = snapshot.val();
      salesArray = Object.entries(salesObj).map(([key, value]) => ({
        id: key,
        ...(value as any),
      }));
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      salesArray = salesArray.filter((sale) => {
        if (!sale.createdAt) return false;
        const saleDate = new Date(sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });
    }

    const totalSales = salesArray.length;
    const totalRevenue = salesArray.reduce(
      (sum, sale) => sum + (Number(sale.totalAmount) || 0),
      0,
    );
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const customerSet = new Set();
    salesArray.forEach((sale) => {
      if (sale.customerPhone) customerSet.add(sale.customerPhone);
      else if (sale.customerId) customerSet.add(sale.customerId);
      else if (sale.customerName) customerSet.add(sale.customerName);
    });

    let itemsSold = 0;
    salesArray.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          itemsSold += Number(item.quantity) || 0;
        });
      }
    });

    const today = new Date().toISOString().split("T")[0];
    const todaySales = salesArray.filter((sale) =>
      sale.createdAt?.startsWith(today),
    );
    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + (Number(sale.totalAmount) || 0),
      0,
    );

    const onlineSales = salesArray.filter((sale) => !sale._wasOffline).length;
    const offlineSales = salesArray.filter((sale) => sale._wasOffline).length;

    const stats = {
      totalSales,
      totalRevenue,
      averageSaleValue,
      totalCustomers: customerSet.size,
      itemsSold,
      todaySales: todaySales.length,
      todayRevenue,
      onlineSales,
      offlineSales,
    };

    cache.set(cacheKey, stats, 30);
    logger.info({ centerId }, "Sales stats fetched");
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleError(error);
  }
}
