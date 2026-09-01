// app/api/centers/[id]/patients/[patientId]/bills/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set, update } from "firebase/database";
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

const billItemSchema = z.object({
  type: z.enum(["prescription", "lab_test", "consultation", "bed", "other"]),
  description: z.string(),
  amount: z.number().nonnegative(),
  quantity: z.number().int().positive().optional().default(1),
});

const billCreateSchema = z.object({
  items: z.array(billItemSchema),
  notes: z.string().optional(),
});

const billUpdateSchema = z.object({
  status: z
    .enum(["pending", "approved", "paid", "discharged", "hmo"])
    .optional(),
  notes: z.string().optional(),
  approvedBy: z.string().optional(),
  dischargedBy: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "hmo", "bank_transfer"]).optional(),
  hmoProvider: z.string().optional(),
  hmoAuthorization: z.string().optional(),
  paymentAmount: z.number().nonnegative().optional(),
  paymentDate: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:bills:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `bills:${centerId}:${patientId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const billsRef = ref(db, `doza_centers/${centerId}/bills/${patientId}`);
    const snapshot = await get(billsRef);
    let bills: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      bills = Object.entries(data).map(([id, bill]) => ({
        id,
        ...(bill as any),
      }));
      bills.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    cache.set(cacheKey, bills, 30);
    return NextResponse.json({ success: true, data: bills });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:bill-create:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = billCreateSchema.parse(body);

    const total = validated.items.reduce(
      (sum, item) => sum + item.amount * (item.quantity || 1),
      0,
    );

    const newBill = {
      patientId,
      items: validated.items,
      total,
      status: "pending",
      paymentMethod: "pending",
      notes: validated.notes || "",
      createdBy: userId,
      createdByName: userName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const billsRef = ref(db, `doza_centers/${centerId}/bills/${patientId}`);
    const newRef = push(billsRef);
    await set(newRef, newBill);

    cache.set(`bills:${centerId}:${patientId}`, null, 0);
    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "create",
      resource: "bill",
      resourceId: newRef.key!,
      details: `Created bill for patient ${patientId} – total: ${total}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newBill },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const { searchParams } = new URL(request.url);
    const billId = searchParams.get("billId");
    if (!billId) {
      return NextResponse.json(
        { success: false, error: "billId required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:bill-update:${centerId}:${patientId}:${billId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = billUpdateSchema.parse(body);

    const billRef = ref(
      db,
      `doza_centers/${centerId}/bills/${patientId}/${billId}`,
    );
    const snapshot = await get(billRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 },
      );
    }

    const updates = {
      ...validated,
      updatedAt: Date.now(),
      updatedBy: userId,
      updatedByName: userName,
    };
    await update(billRef, updates);

    cache.set(`bills:${centerId}:${patientId}`, null, 0);
    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "update",
      resource: "bill",
      resourceId: billId,
      details: `Updated bill ${billId} – status: ${validated.status}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, message: "Bill updated" });
  } catch (error) {
    return handleError(error);
  }
}
