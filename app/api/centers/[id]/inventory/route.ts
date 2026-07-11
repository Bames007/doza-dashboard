// app/api/centers/[id]/inventory/route.ts
// URL: /api/centers/[id]/inventory
// Methods: GET, POST, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, set } from "firebase/database";
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

// ─── Helper: Bulk upload (internal) ────────────────────────────────
async function handleBulkUpload(
  centerId: string,
  userId: string,
  products: any[],
) {
  const updates: Record<string, any> = {};
  const results: any[] = [];
  const errors: any[] = [];
  const timestamp = new Date().toISOString();
  const batchId = `batch_${Date.now()}`;

  const seenSkus = new Set<string>();
  const duplicateSkus = new Set<string>();
  products.forEach((product, index) => {
    let sku = product.sku?.toString().trim();
    if (!sku || sku === "") {
      const namePrefix =
        product.name?.toString().substring(0, 3).toUpperCase() || "PRO";
      const catPrefix =
        product.category?.toString().substring(0, 3).toUpperCase() || "GEN";
      sku = `${namePrefix}-${catPrefix}-${Date.now().toString().slice(-6)}-${index}`;
      product.sku = sku;
    } else {
      sku = sku.toUpperCase().trim();
      product.sku = sku;
    }
    if (sku && seenSkus.has(sku)) duplicateSkus.add(sku);
    seenSkus.add(sku);
  });

  const existingSkus = new Set<string>();
  try {
    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const p = child.val();
        if (p.sku && p.isActive !== false) {
          existingSkus.add(p.sku.toUpperCase().trim());
        }
      });
    }
  } catch (err) {
    logger.warn({ err }, "Could not check existing SKUs during bulk upload");
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const sku = product.sku?.toString().toUpperCase().trim();

    if (sku && duplicateSkus.has(sku)) {
      errors.push({
        row: i + 1,
        sku,
        error: "Duplicate SKU in upload file",
        product,
      });
      continue;
    }
    if (sku && existingSkus.has(sku)) {
      errors.push({
        row: i + 1,
        sku,
        error: `SKU "${sku}" already exists in inventory`,
        product,
      });
      continue;
    }

    try {
      if (!product.name || !product.category) {
        errors.push({
          row: i + 1,
          sku,
          error: "Missing Name or Category",
          product,
        });
        continue;
      }

      const quantity = Number(product.quantity);
      const unitPrice = Number(product.unitPrice);
      if (isNaN(quantity) || quantity < 0) {
        errors.push({
          row: i + 1,
          sku,
          error: "Quantity must be >= 0",
          product,
        });
        continue;
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        errors.push({
          row: i + 1,
          sku,
          error: "Unit price must be >= 0",
          product,
        });
        continue;
      }

      const productId = sku
        ? sku.replace(/[^a-zA-Z0-9]/g, "_")
        : `prod_${Date.now()}_${i}`;
      let sellingPrice = product.sellingPrice;
      if (!sellingPrice && unitPrice > 0) {
        const markup = product.markupPercentage || 20;
        sellingPrice = unitPrice * (1 + markup / 100);
      }

      let barcode = product.barcode;
      let barcodeType = product.barcodeType;
      if (!barcode) {
        barcode = `DZ${Date.now().toString().slice(-10)}${i}`;
        barcodeType = "CUSTOM";
      }

      const productData = {
        sku,
        name: product.name.toString().trim(),
        category: product.category.toString().toLowerCase().trim(),
        quantity,
        unitPrice,
        sellingPrice: sellingPrice || 0,
        barcode,
        barcodeType,
        centerId,
        description: product.description || "",
        supplier: product.supplier || "",
        lotNumber: product.lotNumber || "",
        expiryDate: product.expiryDate || "",
        isMedicalEquipment:
          product.isMedicalEquipment === true ||
          String(product.isMedicalEquipment).toLowerCase() === "true",
        minStockLevel: product.minStockLevel || 5,
        maxStockLevel: product.maxStockLevel || 100,
        location: product.location || "Main Storage",
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userId,
        updatedBy: userId,
        isActive: true,
      };

      const productPath = `doza_centers/${centerId}/products/${productId}`;
      updates[productPath] = productData;

      const auditPath = `doza_centers/${centerId}/inventoryAudits/${Date.now()}_${i}`;
      updates[auditPath] = {
        productId,
        sku,
        centerId,
        userId,
        action: "BULK_UPLOAD",
        previousQuantity: 0,
        newQuantity: quantity,
        difference: quantity,
        reason: "Bulk upload",
        batchId,
        timestamp,
        details: { rowNumber: i + 1 },
      };

      results.push({ id: productId, ...productData });
    } catch (err: any) {
      errors.push({
        row: i + 1,
        sku: product.sku,
        error: err.message,
        product,
      });
    }
  }

  if (results.length > 0) {
    const batchSummaryPath = `doza_centers/${centerId}/batchSummaries/${batchId}`;
    updates[batchSummaryPath] = {
      batchId,
      centerId,
      userId,
      totalProducts: products.length,
      successful: results.length,
      failed: errors.length,
      uploadedAt: timestamp,
      status: errors.length === 0 ? "completed" : "partial",
      productIds: results.map((r) => r.id),
    };

    await update(ref(db), updates);

    const countRef = ref(db, `doza_centers/${centerId}/stats`);
    const countSnap = await get(countRef);
    const currentCount = countSnap.val()?.productCount || 0;
    await update(ref(db), {
      [`doza_centers/${centerId}/stats/productCount`]:
        currentCount + results.length,
      [`doza_centers/${centerId}/stats/lastUpdated`]: timestamp,
    });
  }

  return {
    success: results.length > 0,
    data: {
      batchId,
      processed: products.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    },
    message: `Bulk upload: ${results.length} successful, ${errors.length} failed`,
  };
}

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:inventory-list:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const barcode = searchParams.get("barcode");
    const sku = searchParams.get("sku");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const cacheKey = `inventory:${centerId}:${JSON.stringify({ barcode, sku, category, search, page, limit })}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Inventory list from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);
    let allProducts: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      allProducts = Object.entries(data)
        .map(([key, val]) => ({ id: key, ...(val as any) }))
        .filter((p) => p.isActive !== false);
    }

    if (barcode) allProducts = allProducts.filter((p) => p.barcode === barcode);
    if (sku)
      allProducts = allProducts.filter((p) =>
        p.sku?.toLowerCase().includes(sku.toLowerCase()),
      );
    if (category)
      allProducts = allProducts.filter((p) => p.category === category);
    if (search) {
      allProducts = allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search) ||
          p.genericName?.toLowerCase().includes(search),
      );
    }

    allProducts.sort((a, b) => a.name?.localeCompare(b.name));
    const total = allProducts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = allProducts.slice(start, start + limit);

    const result = {
      products: paginated,
      pagination: { page, limit, total, pages: totalPages },
      summary: {
        totalValue: allProducts.reduce(
          (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
          0,
        ),
        totalItems: allProducts.reduce((sum, p) => sum + (p.quantity || 0), 0),
        categories: [
          ...new Set(allProducts.map((p) => p.category).filter(Boolean)),
        ],
      },
    };

    cache.set(cacheKey, result, 30);
    logger.info({ centerId, count: paginated.length }, "Inventory fetched");
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const body = await request.json();

    // --- OFFLINE SYNC ---
    if (body._local) {
      logger.info({ centerId }, "Handling offline sync");
      const productId = body.id || `prod_${Date.now()}`;
      const productRef = ref(
        db,
        `doza_centers/${centerId}/products/${productId}`,
      );
      const snapshot = await get(productRef);

      if (snapshot.exists()) {
        const existing = snapshot.val();
        const updateData = {
          ...existing,
          ...body,
          sku: body.sku?.toString().toUpperCase().trim() || existing.sku,
          name: body.name?.toString().trim() || existing.name,
          category:
            body.category?.toString().toLowerCase().trim() || existing.category,
          quantity: Number(body.quantity) || existing.quantity,
          unitPrice: Number(body.unitPrice) || existing.unitPrice,
          updatedAt: new Date().toISOString(),
          updatedBy: userId,
        };
        await set(productRef, updateData);

        const auditLog = {
          productId,
          sku: updateData.sku,
          centerId,
          userId,
          action: "STOCK_UPDATE",
          previousQuantity: existing.quantity || 0,
          newQuantity: updateData.quantity,
          difference: updateData.quantity - (existing.quantity || 0),
          reason: "Offline sync - update",
          timestamp: new Date().toISOString(),
        };
        const auditRef = push(
          ref(db, `doza_centers/${centerId}/inventoryAudits`),
        );
        await set(auditRef, auditLog);

        logger.info({ productId }, "Product updated from offline sync");
        return NextResponse.json({
          success: true,
          data: { id: productId, ...updateData },
          message: "Product updated from offline sync",
        });
      } else {
        const productData = {
          ...body,
          centerId,
          sku: body.sku?.toString().toUpperCase().trim() || `SKU_${Date.now()}`,
          name: body.name?.toString().trim() || "New Product",
          category: body.category?.toString().toLowerCase().trim() || "general",
          quantity: Number(body.quantity) || 0,
          unitPrice: Number(body.unitPrice) || 0,
          createdAt: body.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userId,
          updatedBy: userId,
          isActive: true,
        };
        if (!productData.barcode) {
          productData.barcode = `DZ${Date.now().toString().slice(-10)}`;
          productData.barcodeType = "CUSTOM";
        }
        if (!productData.sellingPrice) {
          const markup = productData.markupPercentage || 20;
          productData.sellingPrice = productData.unitPrice * (1 + markup / 100);
        }
        await set(productRef, productData);

        const auditLog = {
          productId,
          sku: productData.sku,
          centerId,
          userId,
          action: "STOCK_IN",
          previousQuantity: 0,
          newQuantity: productData.quantity,
          difference: productData.quantity,
          reason: "Offline sync - creation",
          timestamp: new Date().toISOString(),
        };
        const auditRef = push(
          ref(db, `doza_centers/${centerId}/inventoryAudits`),
        );
        await set(auditRef, auditLog);

        const countRef = ref(db, `doza_centers/${centerId}/stats`);
        const countSnap = await get(countRef);
        const currentCount = countSnap.val()?.productCount || 0;
        await update(ref(db), {
          [`doza_centers/${centerId}/stats/productCount`]: currentCount + 1,
          [`doza_centers/${centerId}/stats/lastUpdated`]:
            new Date().toISOString(),
        });

        logger.info({ productId }, "Product created from offline sync");
        return NextResponse.json({
          success: true,
          data: { id: productId, ...productData },
          message: "Product created from offline sync",
        });
      }
    }

    // --- REGULAR API ---
    const rateKey = `${userId}:inventory-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    // Bulk upload?
    if (body.products && Array.isArray(body.products)) {
      const MAX_BATCH_SIZE = 10000;
      if (body.products.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Batch size exceeds limit of ${MAX_BATCH_SIZE} products`,
          },
          { status: 400 },
        );
      }
      const result = await handleBulkUpload(centerId, userId, body.products);
      await writeAuditLog({
        centerId,
        userId,
        userName: request.headers.get("x-user-name") || "Unknown",
        userRole: request.headers.get("x-user-role") || "staff",
        action: "bulk_upload",
        resource: "inventory",
        resourceId: result.data.batchId,
        details: `Bulk upload: ${result.data.successful} successful, ${result.data.failed} failed`,
        status: "success",
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || "unknown",
      });
      const status = result.success ? 200 : 400;
      return NextResponse.json(result, { status });
    }

    // Single product
    const validated = productSchema.parse(body);

    // Check duplicate SKU
    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const existing = snapshot.val();
      for (const [key, val] of Object.entries(existing)) {
        if (
          (val as any).sku === validated.sku &&
          (val as any).isActive !== false
        ) {
          return NextResponse.json(
            { success: false, error: `SKU "${validated.sku}" already exists` },
            { status: 400 },
          );
        }
      }
    }

    const productData = {
      ...validated,
      centerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
    };
    if (!productData.barcode) {
      productData.barcode = `DZ${Date.now().toString().slice(-10)}`;
      productData.barcodeType = "CUSTOM";
    }
    if (!productData.sellingPrice) {
      const markup = productData.markupPercentage || 20;
      productData.sellingPrice = productData.unitPrice * (1 + markup / 100);
    }

    const newRef = push(ref(db, `doza_centers/${centerId}/products`));
    await set(newRef, productData);

    const auditLog = {
      productId: newRef.key,
      sku: productData.sku,
      centerId,
      userId,
      action: "STOCK_IN",
      previousQuantity: 0,
      newQuantity: productData.quantity,
      difference: productData.quantity,
      reason: "Initial stock",
      timestamp: new Date().toISOString(),
    };
    const auditRef = push(ref(db, `doza_centers/${centerId}/inventoryAudits`));
    await set(auditRef, auditLog);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "product",
      resourceId: newRef.key!,
      details: `Created product: ${productData.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const countRef = ref(db, `doza_centers/${centerId}/stats`);
    const countSnap = await get(countRef);
    const currentCount = countSnap.val()?.productCount || 0;
    await update(ref(db), {
      [`doza_centers/${centerId}/stats/productCount`]: currentCount + 1,
      [`doza_centers/${centerId}/stats/lastUpdated`]: new Date().toISOString(),
    });

    cache.set(`inventory:${centerId}:*`, null, 0);
    logger.info({ centerId, productId: newRef.key }, "Product created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...productData },
      message: "Product created successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const body = await request.json();
    const { productId, ...updateData } = body;
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:inventory-update:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

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

    const current = snapshot.val();
    const validated = productSchema.partial().parse(updateData);

    if (
      validated.quantity !== undefined &&
      validated.quantity !== current.quantity
    ) {
      const diff = validated.quantity - current.quantity;
      const action = diff > 0 ? "STOCK_IN" : "STOCK_OUT";
      const reason = updateData.reason || "Manual adjustment";
      const notes = updateData.notes || "";
      const auditLog = {
        productId,
        sku: current.sku,
        centerId,
        userId,
        action,
        previousQuantity: current.quantity,
        newQuantity: validated.quantity,
        difference: Math.abs(diff),
        reason,
        notes,
        timestamp: new Date().toISOString(),
      };
      const auditRef = push(
        ref(db, `doza_centers/${centerId}/inventoryAudits`),
      );
      await set(auditRef, auditLog);
    }

    const updated = {
      ...validated,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };
    await update(productRef, updated);

    if (
      updated.unitPrice !== undefined ||
      updated.markupPercentage !== undefined
    ) {
      const newUnitPrice = updated.unitPrice || current.unitPrice;
      const newMarkup =
        updated.markupPercentage || current.markupPercentage || 20;
      const newSelling = newUnitPrice * (1 + newMarkup / 100);
      await update(productRef, { sellingPrice: newSelling });
    }

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "product",
      resourceId: productId,
      details: `Updated product: ${current.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    cache.set(`inventory:${centerId}:*`, null, 0);
    cache.set(`product:${centerId}:${productId}`, null, 0);

    logger.info({ centerId, productId }, "Product updated");
    return NextResponse.json({
      success: true,
      data: { id: productId, ...current, ...updated },
      message: "Product updated",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:inventory-delete:${centerId}:${productId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

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

    const productData = snapshot.val();

    const auditLog = {
      productId,
      sku: productData.sku,
      centerId,
      userId,
      action: "DELETE",
      previousQuantity: productData.quantity,
      newQuantity: 0,
      difference: productData.quantity,
      reason: "Product deletion",
      timestamp: new Date().toISOString(),
    };
    const auditRef = push(ref(db, `doza_centers/${centerId}/inventoryAudits`));
    await set(auditRef, auditLog);

    await update(productRef, {
      isActive: false,
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
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

    cache.set(`inventory:${centerId}:*`, null, 0);
    cache.set(`product:${centerId}:${productId}`, null, 0);

    logger.info({ centerId, productId }, "Product soft-deleted");
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
