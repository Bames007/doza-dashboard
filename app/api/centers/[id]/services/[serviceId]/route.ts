// app/api/centers/[id]/services/[serviceId]/route.ts
// URL: /api/centers/[id]/services/[serviceId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { serviceSchema } from "@/app/lib/validation";
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
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  const { id: centerId, serviceId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:service:${centerId}:${serviceId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const serviceRef = ref(
      db,
      `doza_centers/${centerId}/services/${serviceId}`,
    );
    const snapshot = await get(serviceRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, serviceId }, "Service not found");
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: serviceId, ...snapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  const { id: centerId, serviceId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:service-put:${centerId}:${serviceId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = serviceSchema.partial().parse(body);

    const serviceRef = ref(
      db,
      `doza_centers/${centerId}/services/${serviceId}`,
    );
    const snapshot = await get(serviceRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, serviceId }, "Service not found for update");
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(serviceRef, updates);

    const updatedSnapshot = await get(serviceRef);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "service",
      resourceId: serviceId,
      details: `Updated service: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, serviceId }, "Service updated");
    return NextResponse.json({
      success: true,
      data: { id: serviceId, ...updatedSnapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> },
) {
  const { id: centerId, serviceId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:service-delete:${centerId}:${serviceId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const serviceRef = ref(
      db,
      `doza_centers/${centerId}/services/${serviceId}`,
    );
    const snapshot = await get(serviceRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, serviceId }, "Service not found for deletion");
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(serviceRef);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "service",
      resourceId: serviceId,
      details: `Deleted service: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, serviceId }, "Service deleted");
    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error) {
    return handleError(error);
  }
}
