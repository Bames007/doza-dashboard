// app/api/centers/[id]/equipment/route.ts
// URL: /api/centers/[id]/equipment
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { equipmentSchema } from "@/app/lib/validation";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:equipment:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `equipment:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Equipment from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const equipmentRef = ref(db, `doza_centers/${centerId}/equipment`);
    const snapshot = await get(equipmentRef);
    let equipment: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      equipment = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as any),
      }));
    }

    cache.set(cacheKey, equipment, 30);
    logger.info({ centerId, count: equipment.length }, "Equipment fetched");
    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:equipment-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = equipmentSchema.parse(body);

    const newEquipment = {
      ...validated,
      createdAt: new Date().toISOString(),
    };

    const equipmentRef = ref(db, `doza_centers/${centerId}/equipment`);
    const newRef = push(equipmentRef);
    await set(newRef, newEquipment);

    // Invalidate cache
    cache.set(`equipment:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "equipment",
      resourceId: newRef.key!,
      details: `Created equipment: ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, equipmentId: newRef.key }, "Equipment created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newEquipment },
    });
  } catch (error) {
    return handleError(error);
  }
}
