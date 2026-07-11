// app/api/centers/[id]/appointments/[appointmentId]/route.ts
// URL: /api/centers/[id]/appointments/[appointmentId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { appointmentCreateSchema } from "@/app/lib/validation";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";
import { cache } from "@/app/lib/cache";

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { id: centerId, appointmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:appointment:${centerId}:${appointmentId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const appointmentRef = ref(
      db,
      `doza_centers/${centerId}/appointments/${appointmentId}`,
    );
    const snapshot = await get(appointmentRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, appointmentId }, "Appointment not found");
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: appointmentId, ...snapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { id: centerId, appointmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:appointment-put:${centerId}:${appointmentId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = appointmentCreateSchema.partial().parse(body);

    const appointmentRef = ref(
      db,
      `doza_centers/${centerId}/appointments/${appointmentId}`,
    );
    const snapshot = await get(appointmentRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, appointmentId },
        "Appointment not found for update",
      );
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(appointmentRef, updates);

    const updatedSnapshot = await get(appointmentRef);
    const updatedData = updatedSnapshot.val();

    // Invalidate caches
    cache.set(`appointments:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "appointment",
      resourceId: appointmentId,
      details: `Updated appointment for patient ${oldData.patientName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, appointmentId }, "Appointment updated");
    return NextResponse.json({
      success: true,
      data: { id: appointmentId, ...updatedData },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> },
) {
  const { id: centerId, appointmentId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:appointment-delete:${centerId}:${appointmentId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const appointmentRef = ref(
      db,
      `doza_centers/${centerId}/appointments/${appointmentId}`,
    );
    const snapshot = await get(appointmentRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, appointmentId },
        "Appointment not found for deletion",
      );
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(appointmentRef);

    // Invalidate caches
    cache.set(`appointments:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "appointment",
      resourceId: appointmentId,
      details: `Deleted appointment for patient ${oldData.patientName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, appointmentId }, "Appointment deleted");
    return NextResponse.json({ success: true, message: "Appointment deleted" });
  } catch (error) {
    return handleError(error);
  }
}
