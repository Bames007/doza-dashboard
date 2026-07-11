// app/api/centers/[id]/sales/history/route.ts
// URL: /api/centers/[id]/sales/history
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
    const limit = parseInt(searchParams.get("limit") || "100");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const paymentMethod = searchParams.get("paymentMethod");

    const rateKey = `${userId}:sales-history:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `salesHistory:${centerId}:${JSON.stringify({ limit, status, startDate, endDate, paymentMethod })}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Sales history from cache");
      return NextResponse.json({ success: true, ...cached, fromCache: true });
    }

    const salesRef = ref(db, `doza_centers/${centerId}/sales`);
    const snapshot = await get(salesRef);

    let sales: any[] = [];
    if (snapshot.exists()) {
      const salesData = snapshot.val();
      sales = Object.keys(salesData).map((key) => ({
        id: key,
        ...salesData[key],
      }));
    }

    // Apply filters
    if (status && status !== "all") {
      sales = sales.filter((sale) => sale.status === status);
    }
    if (paymentMethod && paymentMethod !== "all") {
      sales = sales.filter((sale) => sale.paymentMethod === paymentMethod);
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      sales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });
    }

    sales.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    sales = sales.slice(0, limit);

    const today = new Date().toISOString().split("T")[0];
    const todaySales = sales.filter((s) => s.createdAt?.startsWith(today));
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0,
    );
    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0,
    );

    let itemsSold = 0;
    sales.forEach((sale) => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          itemsSold += item.quantity || 0;
        });
      }
    });

    const uniqueCustomers = new Set(
      sales
        .filter((s) => s.customerPhone || s.customerId)
        .map((s) => s.customerPhone || s.customerId),
    );

    const stats = {
      totalSales: sales.length,
      totalRevenue,
      averageSaleValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      totalCustomers: uniqueCustomers.size,
      itemsSold,
      todaySales: todaySales.length,
      todayRevenue,
    };

    const result = { data: sales, stats };
    cache.set(cacheKey, result, 30);
    logger.info({ centerId, count: sales.length }, "Sales history fetched");
    return NextResponse.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    return handleError(error);
  }
}
