// URL: /api/centers/[id]/emergency/patients
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

const patientSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
  gender: z.enum(["Male", "Female", "Other"]),
  chiefComplaint: z.string().min(1),
  acuity: z.enum(["1", "2", "3", "4", "5"]),
  status: z.enum(["waiting", "in-treatment", "discharged"]).default("waiting"),
  bedAssigned: z.string().optional(),
  arrivalTime: z.string().datetime(),
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
  needICU: z.boolean().default(false),
  needVentilator: z.boolean().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:emergency-patients:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyPatients:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const patientsRef = ref(db, `doza_centers/${centerId}/emergency/patients`);
    const snapshot = await get(patientsRef);
    const data = snapshot.exists() ? snapshot.val() : {};
    const patients = Object.entries(data).map(([id, val]) => ({
      id,
      ...(val as any),
    }));

    cache.set(cacheKey, patients, 30);
    logger.info(
      { centerId, count: patients.length },
      "Emergency patients fetched",
    );
    return NextResponse.json({ success: true, data: patients });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:emergency-patient-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = patientSchema.parse(body);

    const newPatient = {
      ...validated,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    const patientsRef = ref(db, `doza_centers/${centerId}/emergency/patients`);
    const newRef = push(patientsRef);
    await set(newRef, newPatient);

    // Invalidate all relevant caches
    cache.set(`emergencyPatients:${centerId}`, null, 0);
    cache.set(`emergencyStats:${centerId}`, null, 0);
    cache.set(`emergencyCensus:${centerId}`, null, 0);
    cache.set(`emergencyCritical:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "create",
      resource: "emergency-patient",
      resourceId: newRef.key!,
      details: `Added emergency patient ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, patientId: newRef.key },
      "Emergency patient created",
    );
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newPatient },
    });
  } catch (error) {
    return handleError(error);
  }
}
