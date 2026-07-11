// app/api/centers/[id]/requisitions/[reqId]/route.ts
// URL: /api/centers/[id]/requisitions/[reqId]
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

const updateRequisitionSchema = z.object({
  type: z
    .enum(["pharmacy-restock", "clinical", "lab", "ward-supply"])
    .optional(),
  priority: z.enum(["routine", "urgent", "stat"]).optional(),
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  clinicalNotes: z.string().optional(),
  items: z.array(z.any()).optional(),
  status: z
    .enum(["draft", "pending", "approved", "rejected", "fulfilled"])
    .optional(),
});

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  const { id: centerId, reqId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }
    const data = { id: reqId, ...snapshot.val() };
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  const { id: centerId, reqId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userRole = request.headers.get("x-user-role") || "support";

    const rateKey = `${userId}:requisition-update:${centerId}:${reqId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = updateRequisitionSchema.parse(body);

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    if (oldData.status !== "draft" && oldData.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot update a requisition that is already approved or fulfilled",
        },
        { status: 403 },
      );
    }

    const updated = {
      ...oldData,
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    await update(ref(db, refPath), updated);

    cache.set(`requisitions:${centerId}:${userId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole,
      action: "update",
      resource: "requisition",
      resourceId: reqId,
      details: `Updated requisition`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(`Requisition ${reqId} updated by ${userId}`);
    return NextResponse.json({
      success: true,
      data: { id: reqId, ...updated },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  const { id: centerId, reqId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();
    if (oldData.status !== "draft" && oldData.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete a requisition that is already approved or fulfilled",
        },
        { status: 403 },
      );
    }
    await remove(ref(db, refPath));
    cache.set(`requisitions:${centerId}:${userId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "support",
      action: "delete",
      resource: "requisition",
      resourceId: reqId,
      details: `Deleted requisition`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(`Requisition ${reqId} deleted by ${userId}`);
    return NextResponse.json({ success: true, message: "Requisition deleted" });
  } catch (error) {
    return handleError(error);
  }
}
