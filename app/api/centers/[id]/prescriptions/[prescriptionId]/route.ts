// app/api/centers/[id]/prescriptions/[prescriptionId]/route.ts
// URL: /api/centers/[id]/prescriptions/[prescriptionId]
// Methods: GET, PUT, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push } from "firebase/database";
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

// Zod schemas
const prescriptionUpdateSchema = z
  .object({
    status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED", "ON_HOLD"]).optional(),
    endDate: z.string().optional(),
    nextRefillDate: z.string().optional(),
    advice: z.string().optional(),
    notes: z.string().optional(),
    updateReason: z.string().optional(),
    updatedByName: z.string().optional(),
  })
  .passthrough();

const actionSchema = z
  .object({
    action: z.enum([
      "DISPENSE_MEDICATION",
      "COMPLETE_PRESCRIPTION",
      "CANCEL_PRESCRIPTION",
      "PRINT_SLIP",
      "SEND_REMINDER",
    ]),
    medicationId: z.string().optional(),
    quantity: z.number().optional(),
    reason: z.string().optional(),
    endDate: z.string().optional(),
    dispensedByName: z.string().optional(),
    userName: z.string().optional(),
  })
  .passthrough();

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prescriptionId: string }> },
) {
  const { id: centerId, prescriptionId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:prescription:${centerId}:${prescriptionId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `prescription:${centerId}:${prescriptionId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, prescriptionId }, "Prescription from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const prescriptionRef = ref(
      db,
      `doza_centers/${centerId}/prescriptions/${prescriptionId}`,
    );
    const prescriptionSnap = await get(prescriptionRef);
    if (!prescriptionSnap.exists()) {
      logger.warn({ centerId, prescriptionId }, "Prescription not found");
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 },
      );
    }
    const prescription = prescriptionSnap.val();

    // Get audit logs
    const auditRef = ref(db, `doza_centers/${centerId}/prescriptionAudits`);
    const auditSnap = await get(auditRef);
    let auditLogs: any[] = [];
    if (auditSnap.exists()) {
      const audits = auditSnap.val();
      auditLogs = Object.entries(audits)
        .map(([key, value]) => ({ id: key, ...(value as any) }))
        .filter((log: any) => log.prescriptionId === prescriptionId)
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    }

    // Get patient details if Doza user
    let patientDetails = null;
    if (prescription.isDozaUser && prescription.dozaUserId) {
      const userRef = ref(db, `users/${prescription.dozaUserId}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        const user = userSnap.val();
        patientDetails = {
          profile: user.registrationProfile || user.personalProfile,
          medicalProfile: user.medicalProfile,
          allergies: user.medicalProfile?.allergies,
          emergencyContacts: user.personalProfile?.sosOneName
            ? {
                primary: {
                  name: user.personalProfile.sosOneName,
                  phone: user.personalProfile.sosOnePhone,
                },
                secondary: user.personalProfile.sosTwoName
                  ? {
                      name: user.personalProfile.sosTwoName,
                      phone: user.personalProfile.sosTwoPhone,
                    }
                  : null,
              }
            : null,
        };
      }
    }

    const result = {
      prescription: { id: prescriptionId, ...prescription },
      auditLogs,
      patientDetails,
    };

    cache.set(cacheKey, result, 30);
    logger.info({ centerId, prescriptionId }, "Prescription fetched");
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prescriptionId: string }> },
) {
  const { id: centerId, prescriptionId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:prescription-update:${centerId}:${prescriptionId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = prescriptionUpdateSchema.parse(body);

    const prescriptionRef = ref(
      db,
      `doza_centers/${centerId}/prescriptions/${prescriptionId}`,
    );
    const snapshot = await get(prescriptionRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, prescriptionId },
        "Prescription not found for update",
      );
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 },
      );
    }

    const currentData = snapshot.val();
    const updateData = {
      ...validated,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await update(prescriptionRef, updateData);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        validated.updatedByName || currentData.prescribedByName || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "prescription",
      resourceId: prescriptionId,
      details: `Updated prescription: ${currentData.patientName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Detailed audit in prescriptionAudits
    const auditLog = {
      prescriptionId,
      centerId,
      userId,
      userName: validated.updatedByName || currentData.prescribedByName,
      action: "UPDATED",
      details: validated.updateReason || "Prescription updated",
      changes: Object.keys(validated).filter(
        (k) =>
          !["updatedAt", "updatedBy", "updateReason", "updatedByName"].includes(
            k,
          ),
      ),
      timestamp: new Date().toISOString(),
    };
    const auditRef = ref(db, `doza_centers/${centerId}/prescriptionAudits`);
    const newAuditRef = push(auditRef);
    await update(newAuditRef, auditLog);

    cache.set(`prescription:${centerId}:${prescriptionId}`, null, 0);
    cache.set(`prescriptions:${centerId}:*`, null, 0);

    logger.info({ centerId, prescriptionId }, "Prescription updated");
    return NextResponse.json({
      success: true,
      data: { id: prescriptionId, ...currentData, ...updateData },
      message: "Prescription updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST (actions) ────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prescriptionId: string }> },
) {
  const { id: centerId, prescriptionId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:prescription-action:${centerId}:${prescriptionId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = actionSchema.parse(body);
    const { action, ...actionData } = validated;

    const prescriptionRef = ref(
      db,
      `doza_centers/${centerId}/prescriptions/${prescriptionId}`,
    );
    const snapshot = await get(prescriptionRef);
    if (!snapshot.exists()) {
      logger.warn(
        { centerId, prescriptionId },
        "Prescription not found for action",
      );
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 },
      );
    }

    const currentData = snapshot.val();
    let updateFields: any = {};
    let auditDetails = "";

    switch (action) {
      case "DISPENSE_MEDICATION": {
        const { medicationId, quantity } = actionData;
        const medicationIndex = currentData.medications?.findIndex(
          (med: any) => med.id === medicationId,
        );
        if (medicationIndex === -1 || medicationIndex === undefined) {
          return NextResponse.json(
            { success: false, error: "Medication not found in prescription" },
            { status: 404 },
          );
        }
        const med = currentData.medications[medicationIndex];
        const dispenseQty = quantity || med.quantity;
        updateFields = {
          medications: currentData.medications.map((med: any, idx: number) =>
            idx === medicationIndex
              ? {
                  ...med,
                  dispensed: true,
                  dispensedQuantity: dispenseQty,
                  dispensedBy: userId,
                  dispensedAt: new Date().toISOString(),
                  dispensedByName: actionData.dispensedByName,
                }
              : med,
          ),
          updatedAt: new Date().toISOString(),
        };
        auditDetails = `Medication dispensed: ${med.name} (${dispenseQty} ${med.unit})`;
        break;
      }
      case "COMPLETE_PRESCRIPTION":
        updateFields = {
          status: "COMPLETED",
          endDate: actionData.endDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        auditDetails = "Prescription marked as completed";
        break;
      case "CANCEL_PRESCRIPTION":
        updateFields = {
          status: "CANCELLED",
          cancellationReason: actionData.reason,
          cancelledAt: new Date().toISOString(),
          cancelledBy: userId,
          updatedAt: new Date().toISOString(),
        };
        auditDetails = `Prescription cancelled: ${actionData.reason}`;
        break;
      case "PRINT_SLIP":
        updateFields = {
          slipPrinted: true,
          lastPrinted: new Date().toISOString(),
          printedBy: userId,
          updatedAt: new Date().toISOString(),
        };
        auditDetails = "Prescription slip printed";
        break;
      case "SEND_REMINDER":
        if (!currentData.isDozaUser) {
          return NextResponse.json(
            { success: false, error: "Patient is not a Doza user" },
            { status: 400 },
          );
        }
        updateFields = {
          lastReminderSent: new Date().toISOString(),
          remindersSent: (currentData.remindersSent || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        auditDetails = "Medication reminder sent to patient";
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }

    await update(prescriptionRef, updateFields);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        actionData.userName || currentData.prescribedByName || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "action",
      resource: "prescription",
      resourceId: prescriptionId,
      details: auditDetails,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const auditLog = {
      prescriptionId,
      centerId,
      userId,
      userName: actionData.userName || currentData.prescribedByName,
      action: action.toUpperCase(),
      details: auditDetails,
      metadata: actionData,
      timestamp: new Date().toISOString(),
    };
    const auditRef = ref(db, `doza_centers/${centerId}/prescriptionAudits`);
    const newAuditRef = push(auditRef);
    await update(newAuditRef, auditLog);

    cache.set(`prescription:${centerId}:${prescriptionId}`, null, 0);
    cache.set(`prescriptions:${centerId}:*`, null, 0);

    logger.info(
      { centerId, prescriptionId, action },
      "Prescription action performed",
    );
    return NextResponse.json({
      success: true,
      data: { id: prescriptionId, ...currentData, ...updateFields },
      message: "Action completed successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
