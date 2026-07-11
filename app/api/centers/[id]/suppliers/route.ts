// app/api/centers/[id]/suppliers/route.ts
// URL: /api/centers/[id]/suppliers
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
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

type Supplier = {
  id: string;
  isActive?: boolean;
  [key: string]: any;
};

const supplierCreateSchema = z
  .object({
    name: z.string().min(1, "Supplier name required"),
    contactPerson: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    email: z.string().email("Invalid email").optional().default(""),
    address: z.string().optional().default(""),
    category: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  })
  .passthrough();

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:suppliers:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `suppliers:${centerId}`;
    const cached = cache.get<Supplier[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Suppliers from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const suppliersRef = ref(db, `doza_centers/${centerId}/suppliers`);
    const snapshot = await get(suppliersRef);

    let suppliers: Supplier[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val() as Record<string, Supplier>;
      suppliers = Object.entries(data)
        .map(([key, value]) => ({
          ...value,
          id: key,
        }))
        .filter((supplier) => supplier.isActive !== false);
    }

    cache.set(cacheKey, suppliers, 30);
    logger.info({ centerId, count: suppliers.length }, "Suppliers fetched");
    return NextResponse.json({ success: true, data: suppliers });
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

    const rateKey = `${userId}:supplier-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = supplierCreateSchema.parse(body);

    const supplierData = {
      ...validated,
      centerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      isActive: true,
    };

    const newSupplierRef = push(ref(db, `doza_centers/${centerId}/suppliers`));
    await update(newSupplierRef, supplierData);

    cache.set(`suppliers:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "supplier",
      resourceId: newSupplierRef.key!,
      details: `Created supplier: ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, supplierId: newSupplierRef.key, name: validated.name },
      "Supplier created",
    );
    return NextResponse.json({
      success: true,
      data: { id: newSupplierRef.key, ...supplierData },
      message: "Supplier created successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
