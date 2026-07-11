// app/api/centers/[id]/dental-equipment/route.ts
// URL: /api/centers/[id]/dental-equipment
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

    const rateKey = `${userId}:dental-equipment:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `dentalEquipment:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Dental equipment from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const equipmentRef = ref(db, `doza_centers/${centerId}/dentalEquipment`);
    const snapshot = await get(equipmentRef);

    let equipment = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      equipment = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
    } else if (process.env.NODE_ENV === "development") {
      logger.warn("No dental equipment data found, using sample data");
      equipment = [
        {
          id: "de1",
          name: "Dental Chair 1",
          status: "operational",
          nextMaintenance: "2023-11-01",
        },
        {
          id: "de2",
          name: "Sterilizer",
          status: "needs service",
          nextMaintenance: "2023-10-08",
        },
        {
          id: "de3",
          name: "X-Ray Unit",
          status: "operational",
          nextMaintenance: "2023-12-15",
        },
      ];
    }

    cache.set(cacheKey, equipment, 30);
    logger.info({ count: equipment.length }, "Dental equipment retrieved");
    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    return handleError(error);
  }
}
