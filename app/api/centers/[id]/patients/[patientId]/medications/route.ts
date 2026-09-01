// app/api/centers/[id]/patients/[patientId]/medications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, push, set, get } from "firebase/database";
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

const administrationSchema = z.object({
  prescriptionId: z.string().min(1),
  medication: z.string().min(1),
  dose: z.string().min(1),
  administeredAt: z.string().datetime(),
  notes: z.string().optional().default(""),
  administeredBy: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:administer:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = administrationSchema.parse(body);

    // Store administration under patient's medication history
    const adminRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}/medicationAdministrations`,
    );
    const newRef = push(adminRef);
    await set(newRef, {
      ...validated,
      administeredAt: validated.administeredAt,
      createdAt: new Date().toISOString(),
      administeredById: userId,
    });

    // Invalidate caches for this patient
    cache.set(`patient:${centerId}:${patientId}`, null, 0);

    // Audit log
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "medication-administration",
      resourceId: newRef.key!,
      details: `Administered ${validated.medication} to patient ${patientId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, patientId, medication: validated.medication },
      "Medication administered",
    );
    return NextResponse.json({
      success: true,
      message: "Administration logged",
    });
  } catch (error) {
    return handleError(error);
  }
}
