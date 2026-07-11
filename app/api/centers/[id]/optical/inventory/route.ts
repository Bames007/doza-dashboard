// app/api/centers/[id]/optical/inventory/route.ts
// URL: /api/centers/[id]/optical/inventory
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

    const rateKey = `${userId}:optical-inventory:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `opticalInventory:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Optical inventory from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const inventoryRef = ref(db, `doza_centers/${centerId}/frameInventory`);
    const snapshot = await get(inventoryRef);

    let inventory: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      inventory = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as Record<string, any>),
      }));
    }

    cache.set(cacheKey, inventory, 30);
    logger.info(
      { centerId, count: inventory.length },
      "Optical inventory fetched",
    );
    return NextResponse.json({ success: true, data: inventory });
  } catch (error) {
    return handleError(error);
  }
}
