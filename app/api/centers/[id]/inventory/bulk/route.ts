// app/api/centers/[id]/inventory/bulk/route.ts
// URL: /api/centers/[id]/inventory/bulk
// Method: POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const bulkUploadSchema = z.object({
  products: z.array(
    z.object({
      sku: z.string().optional(),
      name: z.string().min(1, "Name required"),
      category: z.string().min(1, "Category required"),
      quantity: z.coerce.number().int().nonnegative().default(0),
      unitPrice: z.coerce.number().nonnegative().default(0),
      sellingPrice: z.coerce.number().nonnegative().optional(),
      barcode: z.string().optional(),
      barcodeType: z.string().optional(),
      description: z.string().optional().default(""),
      supplier: z.string().optional().default(""),
      lotNumber: z.string().optional().default(""),
      expiryDate: z.string().optional().nullable(),
      isMedicalEquipment: z.boolean().optional().default(false),
      minStockLevel: z.coerce.number().int().nonnegative().default(5),
      maxStockLevel: z.coerce.number().int().nonnegative().default(100),
      location: z.string().optional().default("Main Storage"),
      markupPercentage: z.coerce.number().nonnegative().optional().default(20),
      prescriptionRequired: z.boolean().optional().default(false),
    }),
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:bulk-upload:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = bulkUploadSchema.parse(body);
    const products = validated.products;

    logger.info({ centerId, count: products.length }, "Bulk upload started");

    const results: any[] = [];
    const errors: any[] = [];
    const timestamp = new Date().toISOString();
    const batchId = `batch_${Date.now()}`;

    // Validate SKUs within batch and against existing DB
    const seenSkus = new Set<string>();
    const duplicateSkus = new Set<string>();
    products.forEach((product, index) => {
      let sku = product.sku?.toString().trim();
      if (!sku || sku === "") {
        const namePrefix = product.name.substring(0, 3).toUpperCase();
        const catPrefix = product.category.substring(0, 3).toUpperCase();
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
      logger.warn({ err }, "Could not check existing SKUs");
    }

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const sku = product.sku?.toString().toUpperCase().trim();

      if (sku && duplicateSkus.has(sku)) {
        errors.push({
          row: i + 1,
          sku,
          error: "Duplicate SKU within upload file",
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
          isMedicalEquipment: product.isMedicalEquipment || false,
          minStockLevel: product.minStockLevel || 5,
          maxStockLevel: product.maxStockLevel || 100,
          location: product.location || "Main Storage",
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: userId,
          updatedBy: userId,
          isActive: true,
        };

        const productRef = ref(
          db,
          `doza_centers/${centerId}/products/${productId}`,
        );
        await update(productRef, productData);

        const auditLog = {
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
        const auditRef = push(
          ref(db, `doza_centers/${centerId}/inventoryAudits`),
        );
        await update(auditRef, auditLog);

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

    // Batch summary and product count update
    if (results.length > 0) {
      const batchSummaryPath = `doza_centers/${centerId}/batchSummaries/${batchId}`;
      await update(ref(db), {
        [batchSummaryPath]: {
          batchId,
          centerId,
          userId,
          totalProducts: products.length,
          successful: results.length,
          failed: errors.length,
          uploadedAt: timestamp,
          status: errors.length === 0 ? "completed" : "partial",
          productIds: results.map((r) => r.id),
        },
      });

      const countRef = ref(db, `doza_centers/${centerId}/stats`);
      const countSnap = await get(countRef);
      const currentCount = countSnap.val()?.productCount || 0;
      await update(ref(db), {
        [`doza_centers/${centerId}/stats/productCount`]:
          currentCount + results.length,
        [`doza_centers/${centerId}/stats/lastUpdated`]: timestamp,
      });
    }

    // Main audit log for bulk upload
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "bulk_upload",
      resource: "inventory",
      resourceId: batchId,
      details: `Bulk uploaded ${results.length} products (${errors.length} failed)`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, batchId, successful: results.length, failed: errors.length },
      "Bulk upload completed",
    );

    return NextResponse.json({
      success: results.length > 0,
      data: {
        batchId,
        processed: products.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors,
      },
      message: `Bulk upload completed: ${results.length} successful, ${errors.length} failed`,
    });
  } catch (error) {
    return handleError(error);
  }
}
