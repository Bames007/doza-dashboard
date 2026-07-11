// app/api/centers/[id]/prescriptions/route.ts
// URL: /api/centers/[id]/prescriptions
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, runTransaction } from "firebase/database";
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

// ---------- Zod Schemas ----------
const medicationSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID required"),
  sku: z.string().min(1, "SKU required"),
  name: z.string().min(1, "Medication name required"),
  genericName: z.string().optional(),
  dosage: z.string().min(1, "Dosage required"),
  frequency: z.string().min(1, "Frequency required"),
  duration: z.string().min(1, "Duration required"),
  quantity: z.number().positive("Quantity must be > 0"),
  unit: z.string().min(1, "Unit required"),
  instructions: z.string().optional(),
  route: z.string().min(1, "Route required"),
  stock: z.number().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional(),
});

const prescriptionCreateSchema = z.object({
  patientName: z.string().min(1, "Patient name required"),
  patientPhone: z.string().min(1, "Patient phone required"),
  patientEmail: z.string().email().optional().default(""),
  patientAge: z.string().optional().nullable(),
  patientGender: z.string().optional().default(""),
  patientAddress: z.string().optional().default(""),
  complaints: z.string().min(1, "Complaints required"),
  vitals: z.record(z.string(), z.any()).optional().default({}),
  diagnosis: z.string().optional().default(""),
  medications: z
    .array(medicationSchema)
    .min(1, "At least one medication required"),
  advice: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  prescribedByName: z.string().min(1, "Prescriber name required"),
  prescribedByRole: z.string().optional().default("DOCTOR"),
  startDate: z.string().optional(),
  endDate: z.string().optional().default(""),
  nextRefillDate: z.string().optional().default(""),
  remindersEnabled: z.boolean().optional().default(true),
  centerName: z.string().optional(),
});

// ---------- Helper functions ----------
async function fetchWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      logger.warn(
        { attempt: i + 1, error: error.message },
        "Retry attempt failed",
      );
      if (i < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i)),
        );
      }
    }
  }
  throw lastError;
}

async function scheduleMedicationReminders(userId: string, prescription: any) {
  try {
    const remindersRef = ref(db, `users/${userId}/medicationReminders`);
    const newReminderRef = push(remindersRef);
    const reminderData = {
      prescriptionId: prescription.id,
      patientName: prescription.patientName,
      medications: prescription.medications.map((med: any) => ({
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        instructions: med.instructions,
      })),
      nextReminderTime: calculateNextReminderTime(prescription),
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    await update(newReminderRef, reminderData);
  } catch (error) {
    logger.error({ error, userId }, "Failed to schedule reminders");
  }
}

function calculateNextReminderTime(prescription: any): string {
  const now = new Date();
  const frequencies: Record<string, number> = {
    "Once daily": 24,
    "Twice daily": 12,
    "Three times daily": 8,
    "Four times daily": 6,
    "Every 6 hours": 6,
    "Every 8 hours": 8,
  };
  const frequency = prescription.medications[0]?.frequency || "Once daily";
  const hours = frequencies[frequency] || 24;
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

async function updateInventoryStock(
  centerId: string,
  medications: any[],
  userId: string,
) {
  try {
    const stockLogs: any[] = [];
    for (const med of medications) {
      const productRef = ref(
        db,
        `doza_centers/${centerId}/inventory/${med.productId}`,
      );
      await runTransaction(productRef, (currentData) => {
        if (currentData) {
          const currentStock = currentData.quantity || 0;
          const newStock = Math.max(0, currentStock - med.quantity);
          return {
            ...currentData,
            quantity: newStock,
            lastUpdated: new Date().toISOString(),
          };
        }
        return currentData;
      });
      stockLogs.push({
        productId: med.productId,
        productName: med.name,
        prescriptionId: med.id,
        quantityDeducted: med.quantity,
        adjustedBy: userId,
        timestamp: new Date().toISOString(),
        reason: "PRESCRIPTION_DISPENSAL",
      });
    }
    if (stockLogs.length > 0) {
      const logsRef = ref(db, `doza_centers/${centerId}/inventoryLogs`);
      for (const log of stockLogs) {
        const logRef = push(logsRef);
        await update(logRef, log);
      }
    }
  } catch (error) {
    logger.error({ error, centerId }, "Error updating inventory stock");
    throw error;
  }
}

// ---------- GET ----------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const patientPhone = searchParams.get("patientPhone");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const rateKey = `${userId}:prescriptions:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `prescriptions:${centerId}:${patientPhone || ""}:${status || ""}:${startDate || ""}:${endDate || ""}:${page}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Prescriptions from cache");
      return NextResponse.json({ success: true, ...cached, fromCache: true });
    }

    const prescriptionsRef = ref(db, `doza_centers/${centerId}/prescriptions`);
    const snapshot = await fetchWithRetry(() => get(prescriptionsRef));

    let prescriptions: any[] = [];
    if (snapshot.exists()) {
      const all = snapshot.val();
      for (const [key, value] of Object.entries(all)) {
        const v = value as any;
        if (patientPhone && v.patientPhone !== patientPhone) continue;
        if (status && v.status !== status) continue;
        if (startDate && new Date(v.createdAt) < new Date(startDate)) continue;
        if (endDate && new Date(v.createdAt) > new Date(endDate)) continue;
        prescriptions.push({ id: key, ...v });
      }
    }

    prescriptions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const total = prescriptions.length;
    const paginated = prescriptions.slice(offset, offset + limit);

    const result = {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        filtered: prescriptions.length,
      },
    };

    cache.set(cacheKey, result, 30);
    logger.info({ centerId, count: paginated.length }, "Prescriptions fetched");
    return NextResponse.json({ success: true, ...result, fromCache: false });
  } catch (error) {
    return handleError(error);
  }
}

// ---------- POST ----------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:prescription-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = prescriptionCreateSchema.parse(body);

    // Check Doza user
    let isDozaUser = false;
    let dozaUserId = null;
    try {
      const usersRef = ref(db, "users");
      const usersSnapshot = await get(usersRef);
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        const entry = Object.entries(users).find(
          ([_, userData]: [string, any]) => {
            const profile =
              userData.registrationProfile || userData.personalProfile;
            return profile?.phone === validated.patientPhone;
          },
        );
        if (entry) {
          isDozaUser = true;
          dozaUserId = entry[0];
        }
      }
    } catch (error) {
      logger.warn({ error, centerId }, "Could not check Doza user status");
    }

    // Generate prescription ID
    const prescriptionId = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const prescriptionData = {
      id: prescriptionId,
      centerId,
      patientId: dozaUserId,
      patientName: validated.patientName,
      patientPhone: validated.patientPhone,
      patientEmail: validated.patientEmail || "",
      patientAge: validated.patientAge || null,
      patientGender: validated.patientGender || "",
      patientAddress: validated.patientAddress || "",
      complaints: validated.complaints,
      vitals: validated.vitals || {},
      diagnosis: validated.diagnosis || "",
      medications: validated.medications.map((med) => ({
        ...med,
        prescriptionId,
        dispensed: false,
        dispensedQuantity: 0,
      })),
      advice: validated.advice || "",
      notes: validated.notes || "",
      prescribedBy: userId,
      prescribedByName: validated.prescribedByName,
      prescribedByRole: validated.prescribedByRole || "DOCTOR",
      startDate: validated.startDate || new Date().toISOString(),
      endDate: validated.endDate || "",
      nextRefillDate: validated.nextRefillDate || "",
      status: "ACTIVE",
      isDozaUser,
      dozaUserId: dozaUserId || "",
      remindersEnabled: validated.remindersEnabled !== false,
      lastReminderSent: null,
      qrCodeData: !isDozaUser
        ? `DOZA:PRESCRIPTION:${prescriptionId}:${validated.patientPhone}:${Date.now()}`
        : null,
      slipPrinted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
    };

    // Save to center
    const prescriptionRef = ref(
      db,
      `doza_centers/${centerId}/prescriptions/${prescriptionId}`,
    );
    await fetchWithRetry(() => update(prescriptionRef, prescriptionData));

    // Audit log – main audit
    await writeAuditLog({
      centerId,
      userId,
      userName: prescriptionData.prescribedByName || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "prescription",
      resourceId: prescriptionId,
      details: `Created prescription for ${validated.patientName}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Also keep detailed audit in prescriptionAudits
    const auditLog = {
      prescriptionId,
      centerId,
      userId,
      userName: prescriptionData.prescribedByName,
      action: "CREATED",
      details: `Prescription created for ${validated.patientName}`,
      timestamp: new Date().toISOString(),
    };
    const auditRef = ref(db, `doza_centers/${centerId}/prescriptionAudits`);
    const newAuditRef = push(auditRef);
    await update(newAuditRef, auditLog);

    // If Doza user, add to user's records and schedule reminders
    if (isDozaUser && dozaUserId) {
      try {
        const userPrescriptionRef = ref(
          db,
          `users/${dozaUserId}/prescriptions/${prescriptionId}`,
        );
        await update(userPrescriptionRef, {
          ...prescriptionData,
          centerName: validated.centerName || "Medical Center",
        });
        if (prescriptionData.remindersEnabled) {
          await scheduleMedicationReminders(dozaUserId, prescriptionData);
        }
      } catch (error) {
        logger.error({ error, dozaUserId }, "Failed to save to user profile");
      }
    }

    // Update inventory stock
    await updateInventoryStock(centerId, validated.medications, userId);

    // Invalidate caches
    cache.set(`prescriptions:${centerId}:*`, null, 0);
    cache.set(
      `patientPrescription:${centerId}:${validated.patientPhone}`,
      null,
      0,
    );

    logger.info(
      { centerId, prescriptionId, patientName: validated.patientName },
      "Prescription created",
    );
    return NextResponse.json({
      success: true,
      data: {
        prescriptionId,
        ...prescriptionData,
        message: isDozaUser
          ? "Prescription created and sent to patient's Doza app"
          : "Prescription created successfully",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
    },
  });
}
