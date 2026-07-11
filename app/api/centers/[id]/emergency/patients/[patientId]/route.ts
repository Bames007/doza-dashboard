// URL: /api/centers/[id]/emergency/patients/[patientId]
// Methods: PUT, DELETE

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

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.number().int().positive().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  chiefComplaint: z.string().min(1).optional(),
  acuity: z.enum(["1", "2", "3", "4", "5"]).optional(),
  status: z.enum(["waiting", "in-treatment", "discharged"]).optional(),
  bedAssigned: z.string().optional(),
  triageTime: z.string().datetime().optional(),
  vitalSigns: z
    .object({
      bp: z.string().optional(),
      hr: z.number().optional(),
      rr: z.number().optional(),
      o2sat: z.number().optional(),
      temp: z.number().optional(),
    })
    .optional(),
  needICU: z.boolean().optional(),
  needVentilator: z.boolean().optional(),
});

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

    const rateKey = `${userId}:emergency-patient-update:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = updatePatientSchema.parse(body);

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/emergency/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();
    const updatedPatient = {
      ...existing,
      ...validated,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await update(patientRef, updatedPatient);

    // Invalidate caches
    cache.set(`emergencyPatients:${centerId}`, null, 0);
    cache.set(`emergencyStats:${centerId}`, null, 0);
    cache.set(`emergencyCensus:${centerId}`, null, 0);
    cache.set(`emergencyCritical:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "update",
      resource: "emergency-patient",
      resourceId: patientId,
      details: `Updated emergency patient ${existing.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, patientId }, "Emergency patient updated");
    return NextResponse.json({
      success: true,
      data: { id: patientId, ...updatedPatient },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:emergency-patient-delete:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/emergency/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }
    const patientData = snapshot.val();

    await remove(patientRef);

    // Invalidate caches
    cache.set(`emergencyPatients:${centerId}`, null, 0);
    cache.set(`emergencyStats:${centerId}`, null, 0);
    cache.set(`emergencyCensus:${centerId}`, null, 0);
    cache.set(`emergencyCritical:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "delete",
      resource: "emergency-patient",
      resourceId: patientId,
      details: `Deleted emergency patient ${patientData.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, patientId }, "Emergency patient deleted");
    return NextResponse.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
