// app/api/centers/[id]/inventory/adjust/route.ts
// URL: /api/centers/[id]/inventory/adjust
// Method: POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { inventoryAdjustSchema } from "@/app/lib/validation";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:adjust-stock:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = inventoryAdjustSchema.parse(body);
    const { productId, newQuantity, reason, notes } = validated;

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`,
    );
    const snapshot = await get(productRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const product = snapshot.val();
    const currentQuantity = product.quantity || 0;
    const difference = newQuantity - currentQuantity;

    if (difference === 0) {
      return NextResponse.json(
        { success: false, error: "No change in quantity" },
        { status: 400 },
      );
    }

    const action = difference > 0 ? "STOCK_IN" : "STOCK_OUT";

    await update(productRef, {
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    });

    const auditLog = {
      productId,
      sku: product.sku,
      centerId,
      userId,
      action,
      previousQuantity: currentQuantity,
      newQuantity,
      difference: Math.abs(difference),
      reason,
      notes: notes || "",
      timestamp: new Date().toISOString(),
    };
    const auditRef = push(ref(db, `doza_centers/${centerId}/inventoryAudits`));
    await update(auditRef, auditLog);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "adjust",
      resource: "inventory",
      resourceId: productId,
      details: `Adjusted stock of ${product.name || "unknown"} (${action}) by ${Math.abs(difference)} units. Reason: ${reason}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, productId, difference, action }, "Stock adjusted");
    return NextResponse.json({
      success: true,
      data: {
        productId,
        previousQuantity: currentQuantity,
        newQuantity,
        difference,
        action,
      },
      message: "Stock adjusted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
