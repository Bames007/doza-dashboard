// app/api/centers/[id]/hospital_pharmacy/inventory/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/inventory
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
  computeStatus,
} from "@/app/lib/apiHelpers";

const drugSchema = z.object({
  name: z.string().min(1),
  strength: z.string().optional(),
  form: z.enum([
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Cream",
    "Drops",
    "Inhaler",
    "Other",
  ]),
  packSize: z.number().int().positive(),
  unit: z.string().min(1),
  quantity: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).default(10),
  expiryDate: z.string().optional(),
  batchNumber: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  costPerUnit: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
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

    const rateKey = `${userId}:hospital-pharmacy-inventory:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `hospital-pharmacy-inventory:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const refPath = `doza_centers/${centerId}/inventory/pharmacy`;
    const snapshot = await get(ref(db, refPath));
    const snapshotData = snapshot.val() as Record<string, any> | null;
    const data = snapshotData
      ? Object.entries(snapshotData).map(([id, val]) => ({
          id,
          ...(val as Record<string, any>),
        }))
      : [];

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

    const rateKey = `${userId}:hospital-pharmacy-inventory-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = drugSchema.parse(body);

    const newDrug = {
      ...validated,
      status: computeStatus(
        validated.quantity,
        validated.reorderPoint,
        validated.expiryDate,
      ),
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const refPath = `doza_centers/${centerId}/inventory/pharmacy`;
    const newRef = push(ref(db, refPath));
    await update(newRef, newDrug);

    const created = { id: newRef.key, ...newDrug };
    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "hospital-pharmacy-inventory",
      resourceId: newRef.key!,
      details: `Added drug ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return handleError(error);
  }
}
