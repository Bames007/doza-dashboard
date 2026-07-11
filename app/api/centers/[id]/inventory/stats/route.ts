// app/api/centers/[id]/inventory/stats/route.ts
// URL: /api/centers/[id]/inventory/stats
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

    const rateKey = `${userId}:stats:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `stats:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);
    let totalProducts = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let expiredCount = 0;
    const categories = new Set<string>();
    let equipmentCount = 0;
    let prescriptionCount = 0;
    const categoriesBreakdown: {
      name: string;
      count: number;
      value: number;
    }[] = [];

    if (snapshot.exists()) {
      const products = snapshot.val();
      const now = new Date();
      const categoryMap = new Map<string, { count: number; value: number }>();

      for (const [key, product] of Object.entries(products) as [
        string,
        any,
      ][]) {
        if (product.isActive !== false) {
          totalProducts++;
          const value =
            (product.quantity || 0) *
            (product.sellingPrice || product.unitPrice || 0);
          totalValue += value;

          if (product.category) {
            categories.add(product.category);
            if (!categoryMap.has(product.category)) {
              categoryMap.set(product.category, { count: 0, value: 0 });
            }
            const catData = categoryMap.get(product.category)!;
            catData.count++;
            catData.value += value;
          }

          if (product.quantity <= (product.reorderLevel || 10) * 1.2) {
            lowStockCount++;
          }

          if (product.expiryDate) {
            const expiryDate = new Date(product.expiryDate);
            if (expiryDate < now) expiredCount++;
          }

          if (product.isMedicalEquipment) equipmentCount++;
          if (product.prescriptionRequired) prescriptionCount++;
        }
      }

      categoryMap.forEach((data, name) => {
        categoriesBreakdown.push({
          name,
          count: data.count,
          value: data.value,
        });
      });
    }

    const stats = {
      totalProducts,
      totalValue,
      lowStockCount,
      expiredCount,
      categories: Array.from(categories),
      equipmentCount,
      prescriptionCount,
      categoriesBreakdown,
    };

    cache.set(cacheKey, stats, 30);
    logger.info({ centerId }, "Inventory stats fetched");
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleError(error);
  }
}
