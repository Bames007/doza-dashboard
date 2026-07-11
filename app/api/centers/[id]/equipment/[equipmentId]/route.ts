// app/api/centers/[id]/equipment/[equipmentId]/route.ts
// URL: /api/centers/[id]/equipment/[equipmentId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
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
  { params }: { params: Promise<{ id: string; equipmentId: string }> },
) {
  const { id: centerId, equipmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:equipment:${centerId}:${equipmentId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const equipmentRef = ref(
      db,
      `doza_centers/${centerId}/equipment/${equipmentId}`,
    );
    const snapshot = await get(equipmentRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, equipmentId }, "Equipment not found");
      return NextResponse.json(
        { success: false, error: "Equipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: equipmentId, ...snapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; equipmentId: string }> },
) {
  const { id: centerId, equipmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:equipment-put:${centerId}:${equipmentId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = equipmentSchema.partial().parse(body);

    const equipmentRef = ref(
      db,
      `doza_centers/${centerId}/equipment/${equipmentId}`,
    );
    const snapshot = await get(equipmentRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, equipmentId }, "Equipment not found for update");
      return NextResponse.json(
        { success: false, error: "Equipment not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(equipmentRef, updates);

    const updatedSnapshot = await get(equipmentRef);

    // Invalidate cache
    cache.set(`equipment:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "equipment",
      resourceId: equipmentId,
      details: `Updated equipment: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, equipmentId }, "Equipment updated");
    return NextResponse.json({
      success: true,
      data: { id: equipmentId, ...updatedSnapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; equipmentId: string }> },
) {
  const { id: centerId, equipmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:equipment-delete:${centerId}:${equipmentId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const equipmentRef = ref(
      db,
      `doza_centers/${centerId}/equipment/${equipmentId}`,
    );
    const snapshot = await get(equipmentRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, equipmentId },
        "Equipment not found for deletion",
      );
      return NextResponse.json(
        { success: false, error: "Equipment not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(equipmentRef);

    // Invalidate cache
    cache.set(`equipment:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "equipment",
      resourceId: equipmentId,
      details: `Deleted equipment: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, equipmentId }, "Equipment deleted");
    return NextResponse.json({ success: true, message: "Equipment deleted" });
  } catch (error) {
    return handleError(error);
  }
}
