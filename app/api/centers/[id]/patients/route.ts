// app/api/centers/[id]/patients/route.ts
// URL: /api/centers/[id]/patients
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
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

// ─── Updated Schema – allow empty strings and all statuses ─────────

const patientCreateSchema = z.object({
  fullName: z.string().min(1, "Full name required"),
  email: z
    .union([z.string().email("Invalid email address"), z.literal("")])
    .optional()
    .default(""),
  phone: z.string().optional().default(""),
  dateOfBirth: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  address: z.string().optional().default(""),
  patientId: z.string().optional().default(""),
  dozaPatientId: z.string().optional().default(""),
  patientType: z
    .enum(["inpatient", "outpatient"])
    .optional()
    .default("outpatient"),
  status: z
    .enum([
      "active",
      "inactive",
      "discharge_pending",
      "waiting",
      "in-treatment",
      "discharged",
    ])
    .optional()
    .default("active"),
  emergencyContact: z.string().optional().default(""),
  // Emergency fields
  acuity: z.enum(["1", "2", "3", "4", "5"]).optional(),
  bedAssigned: z.string().optional(),
  triageTime: z.string().optional(),
  waitTime: z.number().optional(),
  needICU: z.boolean().optional(),
  needVentilator: z.boolean().optional(),
  arrivalTime: z.string().optional(),
  chiefComplaint: z.string().optional(),
});

// ─── GET ─────────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params; // ✅ Must await params
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:patients:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department");

    const cacheKey = `patients:${centerId}:${department || "all"}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const snapshot = await get(patientsRef);
    const patientsData = snapshot.exists() ? snapshot.val() : {};
    let patientsArray = Object.entries(patientsData).map(([id, data]) => ({
      id,
      ...(data as Record<string, any>),
    }));

    if (department === "emergency") {
      patientsArray = patientsArray.filter((p: any) => {
        const emergencyStatuses = ["waiting", "in-treatment", "discharged"];
        return (
          emergencyStatuses.includes(p.status) ||
          (p.acuity && p.acuity !== "") ||
          (p.bedAssigned && p.bedAssigned !== "") ||
          p.needICU === true ||
          p.needVentilator === true ||
          p.triageTime
        );
      });
    }

    cache.set(cacheKey, patientsArray, 30);
    return NextResponse.json({ success: true, data: patientsArray });
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

    const rateKey = `${userId}:patient-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = patientCreateSchema.parse(body);

    if (validated.arrivalTime && !validated.triageTime) {
      validated.triageTime = validated.arrivalTime;
    }

    const newPatient = {
      ...validated,
      registeredAt: new Date().toISOString(),
      registeredBy: userId,
    };

    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const newRef = push(patientsRef);
    await set(newRef, newPatient);

    cache.set(`patients:${centerId}:all`, null, 0);
    cache.set(`patients:${centerId}:emergency`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "patient",
      resourceId: newRef.key!,
      details: `Created patient: ${validated.fullName}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, patientId: newRef.key, fullName: validated.fullName },
      "Patient created",
    );
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newPatient },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      logger.error(
        { error: errorMessages },
        "Patient creation validation failed",
      );
      return NextResponse.json(
        { success: false, error: errorMessages },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
