// app/api/centers/[id]/quality-control/[qcId]/route.ts
// URL: /api/centers/[id]/quality-control/[qcId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const qcUpdateSchema = z.object({
  testType: z.string().optional(),
  controlName: z.string().optional(),
  lotNumber: z.string().optional(),
  expiryDate: z.string().nullable().optional(),
  instrument: z.string().nullable().optional(),
  operator: z.string().nullable().optional(),
  performedAt: z.string().optional(),
  result: z.string().optional(),
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qcId: string }> },
) {
  const { id: centerId, qcId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:qc-record:${centerId}:${qcId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `qcRecord:${centerId}:${qcId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, qcId }, "QC record from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const qcRef = ref(db, `doza_centers/${centerId}/quality_controls/${qcId}`);
    const snapshot = await get(qcRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, qcId }, "QC record not found");
      return NextResponse.json(
        { success: false, error: "QC record not found" },
        { status: 404 },
      );
    }

    const data = { id: qcId, ...snapshot.val() };
    cache.set(cacheKey, data, 30);
    logger.info({ centerId, qcId }, "QC record fetched");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qcId: string }> },
) {
  const { id: centerId, qcId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:qc-update:${centerId}:${qcId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = qcUpdateSchema.parse(body);

    const qcRef = ref(db, `doza_centers/${centerId}/quality_controls/${qcId}`);
    const snapshot = await get(qcRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, qcId }, "QC record not found for update");
      return NextResponse.json(
        { success: false, error: "QC record not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(qcRef, updates);

    cache.set(`qcRecord:${centerId}:${qcId}`, null, 0);
    cache.set(`qcRecords:${centerId}`, null, 0);

    const updatedSnapshot = await get(qcRef);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "quality-control",
      resourceId: qcId,
      details: `Updated QC record: ${oldData.testType || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, qcId }, "QC record updated");
    return NextResponse.json({
      success: true,
      data: { id: qcId, ...updatedSnapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; qcId: string }> },
) {
  const { id: centerId, qcId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:qc-delete:${centerId}:${qcId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const qcRef = ref(db, `doza_centers/${centerId}/quality_controls/${qcId}`);
    const snapshot = await get(qcRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, qcId }, "QC record not found for deletion");
      return NextResponse.json(
        { success: false, error: "QC record not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(qcRef);

    cache.set(`qcRecord:${centerId}:${qcId}`, null, 0);
    cache.set(`qcRecords:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "quality-control",
      resourceId: qcId,
      details: `Deleted QC record: ${oldData.testType || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, qcId }, "QC record deleted");
    return NextResponse.json({ success: true, message: "QC record deleted" });
  } catch (error) {
    return handleError(error);
  }
}
