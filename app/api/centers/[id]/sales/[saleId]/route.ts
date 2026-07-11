// app/api/centers/[id]/sales/[saleId]/route.ts
// URL: /api/centers/[id]/sales/[saleId]
// Methods: GET, PUT

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push } from "firebase/database";
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

const saleUpdateSchema = z
  .object({
    status: z
      .enum(["COMPLETED", "CANCELLED", "PENDING", "REFUNDED"])
      .optional(),
  })
  .passthrough();

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; saleId: string }> },
) {
  const { id: centerId, saleId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:sale:${centerId}:${saleId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `sale:${centerId}:${saleId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, saleId }, "Sale from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const saleRef = ref(db, `doza_centers/${centerId}/sales/${saleId}`);
    const saleSnapshot = await get(saleRef);
    if (!saleSnapshot.exists()) {
      logger.warn({ centerId, saleId }, "Sale not found");
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 },
      );
    }

    const data = { id: saleId, ...saleSnapshot.val() };
    cache.set(cacheKey, data, 30);
    logger.info({ centerId, saleId }, "Sale fetched");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; saleId: string }> },
) {
  const { id: centerId, saleId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:sale-update:${centerId}:${saleId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = saleUpdateSchema.parse(body);
    const { status } = validated;

    const saleRef = ref(db, `doza_centers/${centerId}/sales/${saleId}`);
    const saleSnapshot = await get(saleRef);
    if (!saleSnapshot.exists()) {
      logger.warn({ centerId, saleId }, "Sale not found for update");
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 },
      );
    }

    const currentSale = saleSnapshot.val();

    // If cancelling a completed sale, restore inventory
    if (status === "CANCELLED" && currentSale.status === "COMPLETED") {
      const updates: any = {};

      for (const item of currentSale.items || []) {
        const productRef = ref(
          db,
          `doza_centers/${centerId}/products/${item.productId}`,
        );
        const productSnapshot = await get(productRef);
        if (productSnapshot.exists()) {
          const product = productSnapshot.val();
          const newQuantity = (product.quantity || 0) + (item.quantity || 0);
          updates[
            `doza_centers/${centerId}/products/${item.productId}/quantity`
          ] = newQuantity;
          updates[
            `doza_centers/${centerId}/products/${item.productId}/updatedAt`
          ] = new Date().toISOString();
          updates[
            `doza_centers/${centerId}/products/${item.productId}/updatedBy`
          ] = userId;

          const auditLog = {
            productId: item.productId,
            centerId,
            userId,
            action: "STOCK_IN",
            previousQuantity: product.quantity || 0,
            newQuantity,
            difference: item.quantity || 0,
            reason: "Sale cancellation",
            reference: saleId,
            timestamp: new Date().toISOString(),
          };
          const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
          const newAuditKey = push(auditRef).key;
          updates[`doza_centers/${centerId}/inventoryAudits/${newAuditKey}`] =
            auditLog;
        }
      }

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    }

    // Update sale status
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
    };
    await update(saleRef, updateData);

    // Invalidate cache
    cache.set(`sale:${centerId}:${saleId}`, null, 0);
    cache.set(`sales:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "sale",
      resourceId: saleId,
      details: `Updated sale status to ${status}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, saleId, status }, "Sale updated");
    return NextResponse.json({
      success: true,
      data: { id: saleId, ...currentSale, ...updateData },
      message: "Sale updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
