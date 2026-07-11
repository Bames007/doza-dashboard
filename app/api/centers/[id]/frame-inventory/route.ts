// app/api/centers/[id]/frame-inventory/route.ts
// URL: /api/centers/[id]/frame-inventory
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

    const rateKey = `${userId}:frame-inventory:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `frameInventory:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Frame inventory from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const frameRef = ref(db, `doza_centers/${centerId}/frameInventory`);
    const snapshot = await get(frameRef);

    let frames = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      frames = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
    } else if (process.env.NODE_ENV === "development") {
      logger.warn("No frame inventory data found, using sample data");
      frames = [
        {
          id: "f1",
          model: "Aviator Classic",
          brand: "Ray-Ban",
          quantity: 15,
          reorderLevel: 5,
        },
        {
          id: "f2",
          model: "Wayfarer",
          brand: "Oakley",
          quantity: 8,
          reorderLevel: 10,
        },
        {
          id: "f3",
          model: "Clubmaster",
          brand: "Persol",
          quantity: 3,
          reorderLevel: 5,
        },
      ];
    }

    cache.set(cacheKey, frames, 30);
    logger.info({ count: frames.length }, "Frame inventory retrieved");
    return NextResponse.json({ success: true, data: frames });
  } catch (error) {
    return handleError(error);
  }
}
