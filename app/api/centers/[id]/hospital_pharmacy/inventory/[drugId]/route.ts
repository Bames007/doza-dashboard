// app/api/centers/[id]/hospital_pharmacy/inventory/[drugId]/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/inventory/[drugId]
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
  computeStatus,
} from "@/app/lib/apiHelpers";

const drugUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  strength: z.string().optional(),
  form: z
    .enum([
      "Tablet",
      "Capsule",
      "Syrup",
      "Injection",
      "Cream",
      "Drops",
      "Inhaler",
      "Other",
    ])
    .optional(),
  packSize: z.number().int().positive().optional(),
  unit: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  costPerUnit: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
});

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; drugId: string }> },
) {
  const { id: centerId, drugId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-inventory-update:${centerId}:${drugId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = drugUpdateSchema.parse(body);

    const refPath = `doza_centers/${centerId}/inventory/pharmacy/${drugId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updated = { ...oldData, ...validated };
    if (
      validated.quantity !== undefined ||
      validated.reorderPoint !== undefined
    ) {
      updated.status = computeStatus(
        updated.quantity,
        updated.reorderPoint,
        updated.expiryDate,
      );
    }
    updated.lastUpdated = new Date().toISOString();

    await update(ref(db, refPath), updated);

    // Invalidate caches
    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "hospital-pharmacy-inventory",
      resourceId: drugId,
      details: `Updated drug ${updated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: { id: drugId, ...updated },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; drugId: string }> },
) {
  const { id: centerId, drugId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-inventory-delete:${centerId}:${drugId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const refPath = `doza_centers/${centerId}/inventory/pharmacy/${drugId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();
    await remove(ref(db, refPath));

    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "hospital-pharmacy-inventory",
      resourceId: drugId,
      details: `Deleted drug ${oldData.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Drug deleted" });
  } catch (error) {
    return handleError(error);
  }
}
