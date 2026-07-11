// app/api/centers/[id]/patients/[patientId]/vitals/route.ts
// URL: /api/centers/[id]/patients/[patientId]/vitals
// Method: PUT

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
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

const vitalsSchema = z
  .object({
    bloodPressureSystolic: z.number().int().positive().optional(),
    bloodPressureDiastolic: z.number().int().positive().optional(),
    heartRate: z.number().int().positive().optional(),
    temperature: z.number().positive().optional(),
    oxygenSaturation: z.number().int().min(0).max(100).optional(),
    respiratoryRate: z.number().int().positive().optional(),
    bloodSugar: z.number().positive().optional(),
    weight: z.number().positive().optional(),
    height: z.number().positive().optional(),
    bmi: z.number().positive().optional(),
  })
  .passthrough();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:vitals-update:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = vitalsSchema.parse(body);

    const patientRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}`,
    );
    const snapshot = await get(patientRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, patientId },
        "Patient not found for vitals update",
      );
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const currentData = snapshot.val();
    const currentVitals = currentData.vitals || {};
    const updatedVitals = { ...currentVitals, ...validated };

    Object.keys(updatedVitals).forEach(
      (key) => updatedVitals[key] === undefined && delete updatedVitals[key],
    );

    await update(patientRef, {
      vitals: updatedVitals,
      updatedAt: new Date().toISOString(),
    });

    cache.set(`patient:${centerId}:${patientId}`, null, 0);
    cache.set(`patients:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "patient-vitals",
      resourceId: patientId,
      details: `Updated vitals for patient ${currentData.fullName || patientId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const updatedSnapshot = await get(patientRef);
    return NextResponse.json({
      success: true,
      data: { id: patientId, ...updatedSnapshot.val() },
      message: "Vitals updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
