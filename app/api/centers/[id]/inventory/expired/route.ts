// app/api/centers/[id]/inventory/expired/route.ts
// URL: /api/centers/[id]/inventory/expired
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

    const rateKey = `${userId}:expired:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `expired:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const inventoryRef = ref(db, `doza_centers/${centerId}/inventory`);
    const snapshot = await get(inventoryRef);
    const expiredItems = [];
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const [itemId, item] of Object.entries(data) as [string, any][]) {
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          if (expiryDate <= thirtyDaysFromNow) {
            const daysRemaining = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
            );
            expiredItems.push({
              id: itemId,
              name: item.name || item.productName || "Unknown",
              expiryDate: item.expiryDate,
              batch: item.batchNumber || item.batch || "N/A",
              quantity: item.quantity || item.stock || 0,
              status: expiryDate < today ? "expired" : "expiring_soon",
              daysRemaining,
              location: item.location || "Unknown",
              category: item.category || "uncategorized",
            });
          }
        }
      }
    }

    expiredItems.sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
    cache.set(cacheKey, expiredItems, 30);
    logger.info(
      { centerId, count: expiredItems.length },
      "Expired items fetched",
    );
    return NextResponse.json({ success: true, data: expiredItems });
  } catch (error) {
    return handleError(error);
  }
}
