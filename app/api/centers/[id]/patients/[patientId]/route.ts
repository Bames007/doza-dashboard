// peer/app/api/centers/[centerId]/patients/[patientId]/route.ts
// For patients to fetch their own clinical data from a center

// app/api/centers/[id]/patients/[patientId]/route.ts
// Center staff only – uses x-user-id headers
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
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

// ─── Validation Schema ──────────────────────────────────────────────
const patientUpdateSchema = z
  .object({
    fullName: z.string().optional(),
    email: z
      .union([z.string().email("Invalid email"), z.literal("")])
      .optional(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    patientType: z.enum(["inpatient", "outpatient"]).optional(),
    status: z
      .enum([
        "active",
        "inactive",
        "discharge_pending",
        "waiting",
        "in-treatment",
        "discharged",
      ])
      .optional(),
    vitals: z.record(z.string(), z.any()).optional(),
    doctorNotes: z.array(z.any()).optional(),
    nursingNotes: z.array(z.any()).optional(),
    diagnoses: z.array(z.string()).optional(),
    billingInfo: z.record(z.string(), z.any()).optional(),
    admissionDate: z.string().optional(),
    dischargeDate: z.string().optional(),
    dischargeRequested: z.boolean().optional(),
    dischargeRequestedBy: z.string().optional(),
    dischargeRequestedAt: z.string().optional(),
    emergencyContact: z.string().optional(),
    prescriptions: z.array(z.any()).optional(),
    vitalsHistory: z.array(z.any()).optional(),
    referral: z.record(z.string(), z.any()).optional(),
    dischargeSummary: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    acuity: z.enum(["1", "2", "3", "4", "5"]).optional(),
    bedAssigned: z.string().optional(),
    triageTime: z.string().optional(),
    waitTime: z.number().optional(),
    needICU: z.boolean().optional(),
    needVentilator: z.boolean().optional(),
    arrivalTime: z.string().optional(),
    chiefComplaint: z.string().optional(),
  })
  .passthrough();

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:patient:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `patient:${centerId}:${patientId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const data = { id: patientId, ...snapshot.val() };

    // ─── Fetch bills ──────────────────────────────────────────────
    const billsRef = ref(db, `doza_centers/${centerId}/bills/${patientId}`);
    const billsSnap = await get(billsRef);
    let bills: any[] = [];
    if (billsSnap.exists()) {
      const billsData = billsSnap.val();
      bills = Object.entries(billsData).map(([id, bill]) => ({
        id,
        ...(bill as any),
      }));
      bills.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
    data.bills = bills;
    data.totalBilling = bills.reduce((sum, b) => sum + (b.total || 0), 0);
    // ──────────────────────────────────────────────────────────────

    cache.set(cacheKey, data, 30);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:patient-update:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = patientUpdateSchema.parse(body);

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(patientRef, updates);

    // Invalidate caches
    cache.set(`patient:${centerId}:${patientId}`, null, 0);
    cache.set(`patients:${centerId}`, null, 0);

    const updatedSnapshot = await get(patientRef);
    const updatedData = { id: patientId, ...updatedSnapshot.val() };
    const updatedFields = Object.keys(validated).join(", ");

    // Audit log
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "patient",
      resourceId: patientId,
      details: `Updated patient ${oldData.fullName || "unknown"} – fields: ${updatedFields}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, patientId, fields: updatedFields },
      "Patient updated",
    );
    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      logger.error(
        { error: errorMessages },
        "Patient update validation failed",
      );
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:patient-delete:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(patientRef);

    // Invalidate caches
    cache.set(`patient:${centerId}:${patientId}`, null, 0);
    cache.set(`patients:${centerId}`, null, 0);

    // Audit log
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "patient",
      resourceId: patientId,
      details: `Deleted patient: ${oldData.fullName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, patientId }, "Patient deleted");
    return NextResponse.json({ success: true, message: "Patient deleted" });
  } catch (error) {
    return handleError(error);
  }
}
