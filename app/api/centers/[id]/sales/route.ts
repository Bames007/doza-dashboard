// app/api/centers/[id]/sales/route.ts
// URL: /api/centers/[id]/sales
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { adjustStockForSale } from "@/app/center/dashboard/utils/stockAdjustment";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ---------- Zod Schemas ----------
const saleItemSchema = z.object({
  productId: z.string().min(1, "Product ID required"),
  sku: z.string().optional().default("N/A"),
  name: z.string().min(1, "Product name required"),
  quantity: z.number().positive("Quantity must be > 0"),
  unitPrice: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  subtotal: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
  total: z.number().nonnegative().default(0),
  batchNumber: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  discountPercentage: z.number().optional().default(0),
  markupPercentage: z.number().optional().default(0),
  sellingPrice: z.number().optional().default(0),
  taxPercentage: z.number().optional().default(7.5),
});

const saleCreateSchema = z
  .object({
    saleNumber: z.string().optional(),
    customerId: z.string().optional().nullable(),
    customerName: z.string().optional().nullable(),
    customerPhone: z.string().optional().nullable(),
    customerEmail: z.string().email().optional().nullable(),
    customerType: z
      .enum(["REGULAR", "WHOLESALE", "VIP"])
      .optional()
      .default("REGULAR"),
    dozaUserId: z.string().optional().nullable(),
    items: z.array(saleItemSchema).min(1, "At least one item required"),
    paymentMethod: z
      .enum(["CASH", "CARD", "TRANSFER", "POS"])
      .optional()
      .default("CASH"),
    paymentReference: z.string().optional().nullable(),
    amountPaid: z.number().optional(),
    changeAmount: z.number().optional().default(0),
    subTotal: z.number().optional(),
    discountAmount: z.number().optional().default(0),
    taxAmount: z.number().optional().default(0),
    totalAmount: z.number().optional(),
    notes: z.string().optional().nullable(),
    soldBy: z.string().optional(),
    soldByName: z.string().optional().default("Staff"),
    taxEnabled: z.boolean().optional().default(false),
  })
  .passthrough();

const offlineSaleSchema = saleCreateSchema
  .extend({
    _local: z.boolean().optional(),
    saleId: z.string().optional(),
    id: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

// ---------- Helpers ----------
function cleanForFirebase(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirebase);
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanForFirebase(value);
    }
  }
  return cleaned;
}

function generateSaleNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SALE${year}${month}${day}${random}`;
}

// ---------- Offline Sync Handler ----------
async function handleOfflineSaleSync(
  centerId: string,
  userId: string,
  body: any,
  saleId: string,
) {
  const {
    saleNumber,
    customerName,
    items = [],
    paymentMethod = "CASH",
    subTotal = 0,
    discountAmount = 0,
    taxAmount = 0,
    totalAmount = 0,
    amountPaid,
    changeAmount = 0,
    status = "COMPLETED",
    createdAt,
    updatedAt,
  } = body;

  if (!saleId) {
    return { success: false, error: "Sale ID required for offline sync" };
  }

  logger.info({ centerId, saleId }, "Syncing offline sale");

  const calculatedSubTotal = items.reduce(
    (sum: any, item: any) => sum + (Number(item.subtotal) || 0),
    0,
  );
  const calculatedDiscount = discountAmount || 0;
  const calculatedTax = taxAmount || 0;
  const calculatedTotal =
    totalAmount || calculatedSubTotal - calculatedDiscount + calculatedTax;

  const saleData = cleanForFirebase({
    id: saleId,
    saleNumber: saleNumber || generateSaleNumber(),
    centerId,
    customerId: body.customerId || null,
    customerName: customerName || "Walk-in Customer",
    customerPhone: body.customerPhone || null,
    customerEmail: body.customerEmail || null,
    customerType: body.customerType || "REGULAR",
    dozaUserId: body.dozaUserId || null,
    items: items.map((item: any) =>
      cleanForFirebase({
        productId: item.productId || item.id,
        sku: item.sku || "N/A",
        name: item.name || "Unknown Product",
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discountAmount: Number(item.discountAmount) || 0,
        subtotal: Number(item.subtotal) || 0,
        taxAmount: Number(item.taxAmount) || 0,
        total:
          Number(item.total) ||
          (Number(item.subtotal) || 0) -
            (Number(item.discountAmount) || 0) +
            (Number(item.taxAmount) || 0),
        batchNumber: item.batchNumber || null,
        expiryDate: item.expiryDate || null,
      }),
    ),
    paymentMethod: paymentMethod || "CASH",
    paymentReference: body.paymentReference || null,
    subTotal: subTotal || calculatedSubTotal,
    discountAmount: calculatedDiscount,
    taxAmount: calculatedTax,
    totalAmount: calculatedTotal,
    amountPaid: amountPaid || calculatedTotal,
    changeAmount: changeAmount || 0,
    notes: body.notes || null,
    soldBy: body.soldBy || userId,
    soldByName: body.soldByName || "Staff",
    taxEnabled: body.taxEnabled || false,
    status: status || "COMPLETED",
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
    syncedAt: new Date().toISOString(),
    _synced: true,
    _wasOffline: true,
  });

  try {
    const updates: any = {};
    updates[`doza_centers/${centerId}/sales/${saleId}`] = saleData;

    for (const item of items) {
      const productId = item.productId || item.id;
      const requestedQuantity = Number(item.quantity) || 0;
      if (!productId || requestedQuantity <= 0) continue;

      const productRef = ref(
        db,
        `doza_centers/${centerId}/products/${productId}`,
      );
      const productSnapshot = await get(productRef);

      if (productSnapshot.exists()) {
        const product = productSnapshot.val();
        const currentStock = Number(product.quantity) || 0;
        const newQuantity = currentStock - requestedQuantity;

        updates[`doza_centers/${centerId}/products/${productId}/quantity`] =
          newQuantity;
        updates[`doza_centers/${centerId}/products/${productId}/updatedAt`] =
          new Date().toISOString();
        updates[`doza_centers/${centerId}/products/${productId}/updatedBy`] =
          userId;

        const auditLog = cleanForFirebase({
          productId,
          centerId,
          userId,
          action: "STOCK_OUT",
          previousQuantity: currentStock,
          newQuantity,
          difference: -requestedQuantity,
          reason: "Offline sale sync",
          reference: `SALE_${saleId}`,
          notes: `Sold to ${customerName || "Customer"} (offline sync)`,
          timestamp: new Date().toISOString(),
        });
        const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
        const newAuditKey = push(auditRef).key;
        updates[`doza_centers/${centerId}/inventoryAudits/${newAuditKey}`] =
          auditLog;
      } else {
        const auditLog = cleanForFirebase({
          productId,
          centerId,
          userId,
          action: "STOCK_OUT",
          previousQuantity: 0,
          newQuantity: 0,
          difference: -requestedQuantity,
          reason: "Offline sale sync - product not found",
          reference: `SALE_${saleId}`,
          notes: `Sold to ${customerName || "Customer"} (product not found)`,
          timestamp: new Date().toISOString(),
        });
        const auditRef = ref(db, `doza_centers/${centerId}/inventoryAudits`);
        const newAuditKey = push(auditRef).key;
        updates[`doza_centers/${centerId}/inventoryAudits/${newAuditKey}`] =
          auditLog;
      }
    }

    await update(ref(db), updates);
    logger.info({ centerId, saleId }, "Offline sale synced successfully");
    return {
      success: true,
      data: saleData,
      message: "Offline sale synced and stock adjusted",
    };
  } catch (error: any) {
    logger.error(
      { error: error.message, centerId, saleId },
      "Failed to sync offline sale",
    );
    return {
      success: false,
      error: `Failed to sync offline sale: ${error.message}`,
    };
  }
}

// ---------- Online Sale Handler ----------
async function handleOnlineSale(centerId: string, userId: string, body: any) {
  const {
    saleNumber,
    customerId,
    customerName,
    customerPhone,
    customerEmail,
    customerType = "REGULAR",
    dozaUserId,
    items = [],
    paymentMethod = "CASH",
    paymentReference,
    amountPaid,
    changeAmount,
    subTotal = 0,
    discountAmount = 0,
    taxAmount = 0,
    totalAmount = 0,
    notes,
    soldBy,
    soldByName,
    taxEnabled = false,
  } = body;

  const processedItems: any[] = [];

  for (const item of items) {
    const productId = item.productId || item.id;
    if (!productId) {
      logger.warn({ item }, "Item missing productId");
      continue;
    }

    const productRef = ref(
      db,
      `doza_centers/${centerId}/products/${productId}`,
    );
    const productSnapshot = await get(productRef);

    if (!productSnapshot.exists()) {
      logger.warn(
        { productId },
        "Product not found, adding without stock check",
      );
      processedItems.push(
        cleanForFirebase({
          productId,
          sku: item.sku || "N/A",
          name: item.name || "Unknown Product",
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          discountAmount: Number(item.discountAmount) || 0,
          subtotal: Number(item.subtotal) || 0,
          taxAmount: Number(item.taxAmount) || 0,
          total:
            (Number(item.subtotal) || 0) -
            (Number(item.discountAmount) || 0) +
            (Number(item.taxAmount) || 0),
        }),
      );
      continue;
    }

    const product = productSnapshot.val();
    const currentStock = Number(product.quantity) || 0;
    const requestedQuantity = Number(item.quantity) || 0;

    if (currentStock < requestedQuantity) {
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`,
      );
    }

    const itemUnitPrice =
      Number(item.unitPrice) || Number(product.sellingPrice) || 0;
    const itemSubTotal = requestedQuantity * itemUnitPrice;
    const itemDiscount = Number(item.discountAmount) || 0;
    const itemTax = Number(item.taxAmount) || 0;

    processedItems.push(
      cleanForFirebase({
        productId,
        sku: product.sku || item.sku || "N/A",
        name: product.name || item.name || "Unknown Product",
        quantity: requestedQuantity,
        unitPrice: itemUnitPrice,
        markupPercentage: product.markupPercentage || 0,
        sellingPrice: itemUnitPrice,
        discountPercentage: item.discountPercentage || 0,
        discountAmount: itemDiscount,
        subtotal: itemSubTotal,
        taxPercentage: item.taxPercentage || 7.5,
        taxAmount: itemTax,
        total: itemSubTotal - itemDiscount + itemTax,
        batchNumber: product.batchNumber || null,
        expiryDate: product.expiryDate || null,
      }),
    );
  }

  const calculatedSubTotal = processedItems.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0,
  );
  const calculatedDiscountAmount = processedItems.reduce(
    (sum, item) => sum + (item.discountAmount || 0),
    0,
  );
  const calculatedTaxAmount = taxEnabled
    ? ((calculatedSubTotal - calculatedDiscountAmount) * 7.5) / 100
    : 0;
  const calculatedTotalAmount =
    calculatedSubTotal - calculatedDiscountAmount + calculatedTaxAmount;

  const finalSaleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const saleData = cleanForFirebase({
    id: finalSaleId,
    saleNumber: saleNumber || generateSaleNumber(),
    centerId,
    customerId: customerId || null,
    customerName: customerName || null,
    customerPhone: customerPhone || null,
    customerEmail: customerEmail || null,
    customerType: customerType || "REGULAR",
    dozaUserId: dozaUserId || null,
    items: processedItems,
    paymentMethod: paymentMethod || "CASH",
    paymentReference: paymentReference || null,
    subTotal: calculatedSubTotal,
    discountAmount: calculatedDiscountAmount,
    taxAmount: calculatedTaxAmount,
    totalAmount: calculatedTotalAmount,
    amountPaid: amountPaid || calculatedTotalAmount,
    changeAmount: changeAmount || 0,
    notes: notes || null,
    soldBy: soldBy || userId,
    soldByName: soldByName || "Staff",
    taxEnabled: taxEnabled || false,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _wasOnline: true,
  });

  await adjustStockForSale(
    centerId,
    userId,
    items,
    finalSaleId,
    customerName,
    false,
  );

  const updates: any = {};
  updates[`doza_centers/${centerId}/sales/${finalSaleId}`] = saleData;
  await update(ref(db), cleanForFirebase(updates));

  return {
    success: true,
    data: saleData,
    message: "Sale completed successfully",
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const paymentMethod = searchParams.get("paymentMethod");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const rateKey = `${userId}:sales-list:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `sales:${centerId}:${JSON.stringify({ startDate, endDate, page, limit, sortBy, sortOrder, paymentMethod, status, search })}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Sales list from cache");
      return NextResponse.json({ success: true, ...cached, fromCache: true });
    }

    const salesRef = ref(db, `doza_centers/${centerId}/sales`);
    const snapshot = await get(salesRef);

    let salesArray: any[] = [];
    if (snapshot.exists()) {
      const salesObj = snapshot.val();
      salesArray = Object.entries(salesObj).map(([key, value]) => ({
        id: key,
        ...(value as any),
      }));
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      salesArray = salesArray.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });
    }

    if (paymentMethod && paymentMethod !== "all") {
      salesArray = salesArray.filter(
        (sale) => sale.paymentMethod === paymentMethod,
      );
    }
    if (status && status !== "all") {
      salesArray = salesArray.filter((sale) => sale.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      salesArray = salesArray.filter(
        (sale) =>
          sale.saleNumber?.toLowerCase().includes(searchLower) ||
          sale.customerName?.toLowerCase().includes(searchLower) ||
          sale.customerPhone?.includes(search) ||
          sale.soldByName?.toLowerCase().includes(searchLower),
      );
    }

    salesArray.sort((a, b) => {
      let aValue: any, bValue: any;
      if (sortBy === "date") {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortBy === "amount") {
        aValue = a.totalAmount || 0;
        bValue = b.totalAmount || 0;
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }
      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : bValue > aValue
          ? 1
          : -1;
    });

    const total = salesArray.length;
    const startIndex = (page - 1) * limit;
    const paginatedSales = salesArray.slice(startIndex, startIndex + limit);

    const result = {
      data: {
        sales: paginatedSales,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { centerId, count: paginatedSales.length },
      "Sales list fetched",
    );
    return NextResponse.json({ success: true, ...result, fromCache: false });
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

    const rateKey = `${userId}:sale-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();

    if (body._local) {
      const saleId = body.saleId || body.id;
      const result = await handleOfflineSaleSync(
        centerId,
        userId,
        body,
        saleId,
      );
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 },
        );
      }
      return NextResponse.json({
        success: true,
        data: result.data,
        message: result.message,
        _local: true,
      });
    }

    const validated = saleCreateSchema.parse(body);
    const result = await handleOnlineSale(centerId, userId, validated);
    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    return handleError(error);
  }
}
