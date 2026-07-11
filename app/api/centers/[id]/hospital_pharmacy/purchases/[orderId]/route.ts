// app/api/centers/[id]/hospital_pharmacy/purchases/[orderId]/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/purchases/[orderId]
// Methods: PUT, DELETE

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

const orderUpdateSchema = z.object({
  supplier: z.string().min(1).optional(),
  items: z.array(z.any()).optional(),
  totalAmount: z.number().positive().optional(),
  requestedBy: z.string().min(1).optional(),
  notes: z.string().optional(),
  status: z
    .enum(["draft", "pending", "approved", "received", "cancelled"])
    .optional(),
  approvedBy: z.string().optional(),
  receivedBy: z.string().optional(),
});

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  const { id: centerId, orderId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-purchases-update:${centerId}:${orderId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = orderUpdateSchema.parse(body);

    const refPath = `doza_centers/${centerId}/orders/pharmacy/purchases/${orderId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updated = {
      ...oldData,
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    await update(ref(db, refPath), updated);

    const result = { id: orderId, ...updated };
    cache.set(`hospital-pharmacy-purchases:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "hospital-pharmacy-purchases",
      resourceId: orderId,
      details: `Updated order ${oldData.orderNumber}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  const { id: centerId, orderId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-purchases-delete:${centerId}:${orderId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const refPath = `doza_centers/${centerId}/orders/pharmacy/purchases/${orderId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();
    await remove(ref(db, refPath));
    cache.set(`hospital-pharmacy-purchases:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "hospital-pharmacy-purchases",
      resourceId: orderId,
      details: `Deleted order ${oldData.orderNumber}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Order deleted" });
  } catch (error) {
    return handleError(error);
  }
}
