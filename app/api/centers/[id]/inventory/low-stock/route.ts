// app/api/centers/[id]/inventory/low-stock/route.ts
// URL: /api/centers/[id]/inventory/low-stock
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

    const rateKey = `${userId}:low-stock:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `low-stock:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const paths = [
      `doza_centers/${centerId}/products`,
      `doza_centers/${centerId}/inventory`,
      `doza_centers/${centerId}/stock`,
    ];
    const lowStockItems: any[] = [];

    for (const path of paths) {
      try {
        const refPath = ref(db, path);
        const snapshot = await get(refPath);
        if (snapshot.exists()) {
          const data = snapshot.val();
          for (const [itemId, item] of Object.entries(data) as [
            string,
            any,
          ][]) {
            const quantity = item.quantity || item.stock || 0;
            const reorderLevel = item.reorderLevel || item.minimumStock || 10;
            if (quantity <= reorderLevel) {
              lowStockItems.push({
                id: itemId,
                name: item.name || item.productName || "Unknown",
                quantity,
                reorderLevel,
                location: item.location || "N/A",
                category: item.category || "uncategorized",
                unit: item.unit || "units",
              });
            }
          }
        }
      } catch (err) {
        continue;
      }
    }

    lowStockItems.sort((a, b) => a.quantity - b.quantity);
    cache.set(cacheKey, lowStockItems, 30);
    logger.info(
      { centerId, count: lowStockItems.length },
      "Low stock items fetched",
    );
    return NextResponse.json({ success: true, data: lowStockItems });
  } catch (error) {
    return handleError(error);
  }
}
