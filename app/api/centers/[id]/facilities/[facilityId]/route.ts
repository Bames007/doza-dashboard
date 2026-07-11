// app/api/centers/[id]/facilities/[facilityId]/route.ts
// URL: /api/centers/[id]/facilities/[facilityId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { facilitySchema } from "@/app/lib/validation";
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
  { params }: { params: Promise<{ id: string; facilityId: string }> },
) {
  const { id: centerId, facilityId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:facility:${centerId}:${facilityId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const facilityRef = ref(
      db,
      `doza_centers/${centerId}/facilities/${facilityId}`,
    );
    const snapshot = await get(facilityRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, facilityId }, "Facility not found");
      return NextResponse.json(
        { success: false, error: "Facility not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: facilityId, ...snapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; facilityId: string }> },
) {
  const { id: centerId, facilityId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:facility-put:${centerId}:${facilityId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = facilitySchema.partial().parse(body);

    const facilityRef = ref(
      db,
      `doza_centers/${centerId}/facilities/${facilityId}`,
    );
    const snapshot = await get(facilityRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, facilityId }, "Facility not found for update");
      return NextResponse.json(
        { success: false, error: "Facility not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(facilityRef, updates);

    const updatedSnapshot = await get(facilityRef);

    // Invalidate cache
    cache.set(`facilities:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "facility",
      resourceId: facilityId,
      details: `Updated facility: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, facilityId }, "Facility updated");
    return NextResponse.json({
      success: true,
      data: { id: facilityId, ...updatedSnapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; facilityId: string }> },
) {
  const { id: centerId, facilityId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:facility-delete:${centerId}:${facilityId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const facilityRef = ref(
      db,
      `doza_centers/${centerId}/facilities/${facilityId}`,
    );
    const snapshot = await get(facilityRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, facilityId }, "Facility not found for deletion");
      return NextResponse.json(
        { success: false, error: "Facility not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(facilityRef);

    // Invalidate cache
    cache.set(`facilities:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "facility",
      resourceId: facilityId,
      details: `Deleted facility: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, facilityId }, "Facility deleted");
    return NextResponse.json({ success: true, message: "Facility deleted" });
  } catch (error) {
    return handleError(error);
  }
}
