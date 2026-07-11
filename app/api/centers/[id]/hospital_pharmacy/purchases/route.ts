// app/api/centers/[id]/hospital_pharmacy/purchases/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/purchases
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, set } from "firebase/database";
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

const orderItemSchema = z.object({
  drugName: z.string().min(1),
  strength: z.string().optional(),
  form: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.string().min(1),
  costPerUnit: z.number().positive(),
  totalCost: z.number().positive(),
});

const orderSchema = z.object({
  supplier: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  totalAmount: z.number().positive(),
  requestedBy: z.string().min(1),
  notes: z.string().optional(),
  status: z
    .enum(["draft", "pending", "approved", "received", "cancelled"])
    .default("pending"),
});

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-purchases:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `hospital-pharmacy-purchases:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const refPath = `doza_centers/${centerId}/orders/pharmacy/purchases`;
    const snapshot = await get(ref(db, refPath));
    const data = snapshot.exists()
      ? Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...(val as any),
        }))
      : [];
    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    cache.set(cacheKey, data, 30);
    return NextResponse.json({ success: true, data });
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

    const rateKey = `${userId}:hospital-pharmacy-purchases-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = orderSchema.parse(body);

    // Generate order number
    const metaRef = ref(
      db,
      `doza_centers/${centerId}/orders/pharmacy/_meta/orderCount`,
    );
    const countSnap = await get(metaRef);
    const count = (countSnap.val() || 0) + 1;
    await set(metaRef, count);
    const orderNumber = `PO-${String(count).padStart(4, "0")}`;

    const newOrder = {
      ...validated,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const refPath = `doza_centers/${centerId}/orders/pharmacy/purchases`;
    const newRef = push(ref(db, refPath));
    await update(newRef, newOrder);

    const created = { id: newRef.key, ...newOrder };
    cache.set(`hospital-pharmacy-purchases:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "hospital-pharmacy-purchases",
      resourceId: newRef.key!,
      details: `Created purchase order ${orderNumber} from ${validated.supplier}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return handleError(error);
  }
}
