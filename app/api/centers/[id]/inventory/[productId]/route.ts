// app/api/centers/[id]/inventory/[productId]/route.ts
// URL: /api/centers/[id]/inventory/[productId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { productSchema } from "@/app/lib/validation";
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
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const { id: centerId, productId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:product:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `product:${centerId}:${productId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, productId }, "Product from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`,
    );
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      logger.warn({ centerId, productId }, "Product not found");
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
    const auditSnapshot = await get(auditRef);
    let auditLogs: any[] = [];
    if (auditSnapshot.exists()) {
      const auditData = auditSnapshot.val();
      auditLogs = Object.entries(auditData)
        .map(([auditId, data]) => ({ id: auditId, ...(data as any) }))
        .filter((log) => log.productId === productId)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    }

    const result = {
      product: { id: productId, ...productSnapshot.val() },
      auditLogs,
    };

    cache.set(cacheKey, result, 10);
    logger.info(
      { centerId, productId, auditCount: auditLogs.length },
      "Product fetched",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const { id: centerId, productId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:product-update:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { quantity, reason, notes, ...rest } = body;

    const validated = productSchema.partial().parse(rest);

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`,
    );
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      logger.warn({ centerId, productId }, "Product not found for update");
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const currentProduct = productSnapshot.val();
    const updateData: any = { ...validated };

    if (quantity !== undefined && quantity !== currentProduct.quantity) {
      const diff = quantity - currentProduct.quantity;
      const action = diff > 0 ? "STOCK_IN" : "STOCK_OUT";

      const auditLog = {
        productId,
        centerId,
        userId,
        action,
        previousQuantity: currentProduct.quantity,
        newQuantity: quantity,
        difference: Math.abs(diff),
        reason: reason || "Manual adjustment",
        notes: notes || "",
        timestamp: new Date().toISOString(),
      };

      const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
      const newAuditRef = push(auditRef);
      await update(newAuditRef, auditLog);

      updateData.quantity = quantity;
    }

    const newUnitPrice = updateData.unitPrice ?? currentProduct.unitPrice;
    const newMarkup =
      updateData.markupPercentage ?? currentProduct.markupPercentage ?? 20;
    if (
      updateData.unitPrice !== undefined ||
      updateData.markupPercentage !== undefined
    ) {
      updateData.sellingPrice = newUnitPrice * (1 + newMarkup / 100);
    }

    updateData.updatedAt = new Date().toISOString();
    updateData.updatedBy = userId;

    await update(productRef, updateData);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "product",
      resourceId: productId,
      details: `Updated product: ${currentProduct.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    cache.set(`product:${centerId}:${productId}`, null, 0);

    logger.info({ centerId, productId }, "Product updated");
    return NextResponse.json({
      success: true,
      data: { id: productId, ...currentProduct, ...updateData },
      message: "Product updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> },
) {
  const { id: centerId, productId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:product-delete:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`,
    );
    const productSnapshot = await get(productRef);
    if (!productSnapshot.exists()) {
      logger.warn({ centerId, productId }, "Product not found for delete");
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    const productData = productSnapshot.val();

    await update(productRef, {
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
    });

    // Update product count stats
    const countRef = ref(db, `doza_centers/${centerId}/stats`);
    const countSnap = await get(countRef);
    const currentCount = countSnap.val()?.productCount || 1;
    await update(ref(db), {
      [`doza_centers/${centerId}/stats/productCount`]: Math.max(
        0,
        currentCount - 1,
      ),
      [`doza_centers/${centerId}/stats/lastUpdated`]: new Date().toISOString(),
    });

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "product",
      resourceId: productId,
      details: `Deleted product: ${productData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    cache.set(`product:${centerId}:${productId}`, null, 0);

    logger.info({ centerId, productId }, "Product soft-deleted");
    return NextResponse.json({
      success: true,
      message: "Product deactivated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
