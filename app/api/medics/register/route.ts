// app/api/medics/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update, set } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "@/app/utils/firebaseConfig";
import { MedicRegistrationData } from "@/app/medic/type";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";

// ---------- Zod Schemas ----------
const personalInfoSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone required"),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  gender: z.string().min(1, "Gender required"),
});

const professionalInfoSchema = z.object({
  role: z.string().min(1, "Professional role required"),
  licenseNumber: z.string().min(1, "License number required"),
  yearsOfExperience: z.number().positive("Years of experience must be > 0"),
  specialties: z.array(z.string()).default([]),
  customSpecialty: z.string().optional(),
  qualifications: z
    .array(z.string())
    .min(1, "At least one qualification required"),
});

const practiceInfoSchema = z.object({
  consultationTypes: z
    .object({
      inPerson: z.boolean().optional(),
      online: z.boolean().optional(),
      homeVisit: z.boolean().optional(),
    })
    .refine((val) => val.inPerson || val.online || val.homeVisit, {
      message: "At least one consultation type must be selected",
    }),
  hourlyRate: z.number().positive("Hourly rate must be > 0"),
  availability: z.object({
    days: z.array(z.string()).min(1, "At least one available day required"),
    timeSlots: z.any().optional(),
  }),
  languages: z.array(z.string()).optional(),
});

const locationSchema = z.object({
  address: z.string().min(1, "Address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  country: z.string().min(1, "Country required"),
  serviceRadius: z.number().optional(),
});

const legalSchema = z.object({
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "Must agree to terms of service",
  }),
  agreedToPrivacy: z.boolean().refine((val) => val === true, {
    message: "Must agree to privacy policy",
  }),
  agreedToCommitment: z.boolean().refine((val) => val === true, {
    message: "Must agree to commitment agreement",
  }),
  signature: z.string().min(1, "Signature required"),
});

const credentialsSchema = z.object({
  documents: z.array(z.any()).optional(),
});

const registrationSchema = z.object({
  personalInfo: personalInfoSchema,
  professionalInfo: professionalInfoSchema,
  practiceInfo: practiceInfoSchema,
  location: locationSchema,
  legal: legalSchema,
  credentials: credentialsSchema.optional(),
});

// Query schemas for GET
const statusQuerySchema = z.object({
  medicId: z.string().optional(),
  email: z.string().email().optional(),
});

// Update status schema
const statusUpdateSchema = z.object({
  medicId: z.string().min(1, "medicId required"),
  status: z.enum(["pending", "approved", "rejected", "suspended"]),
  rejectionReason: z.string().optional(),
  verificationNotes: z.string().optional(),
  assignedVerifier: z.string().optional(),
});

// ---------- Helpers ----------
function generateMedicId(): string {
  return `MED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function uploadDocument(
  fileUrl: string,
  email: string,
  documentType: string,
): Promise<string> {
  try {
    if (fileUrl.startsWith("blob:")) {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const fileName = `${documentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const filePath = `medic_documents/${email}/${fileName}`;
      const docRef = storageRef(storage, filePath);
      const snapshot = await uploadBytes(docRef, blob);
      return await getDownloadURL(snapshot.ref);
    }
    return fileUrl; // Already a URL
  } catch (error) {
    logger.error({ error, documentType, email }, "Failed to upload document");
    throw new Error(`Failed to upload ${documentType} document`);
  }
}

// Custom rate limiter for registration (5 per hour per IP)
const registrationLimits = new Map<
  string,
  { count: number; resetAt: number }
>();

function checkRegistrationRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = registrationLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    registrationLimits.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// ---------- POST (Registration – with audit) ----------
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  try {
    if (!checkRegistrationRateLimit(ip)) {
      logger.warn({ ip }, "Registration rate limit exceeded");
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts. Please try again in an hour.",
        },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = registrationSchema.parse(body);

    // Check existing email
    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);
    let existingMedicId: string | null = null;
    if (snapshot.exists()) {
      const medics = snapshot.val();
      for (const [id, medic] of Object.entries(medics) as [string, any][]) {
        if (medic.personalInfo?.email === validated.personalInfo.email) {
          existingMedicId = id;
          break;
        }
      }
    }
    if (existingMedicId) {
      logger.warn(
        { email: validated.personalInfo.email },
        "Email already registered",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          medicId: existingMedicId,
        },
        { status: 409 },
      );
    }

    // Upload documents
    let uploadedDocuments = validated.credentials?.documents || [];
    if (uploadedDocuments.length > 0) {
      try {
        const uploadPromises = uploadedDocuments.map(async (doc: any) => {
          const url = await uploadDocument(
            doc.fileUrl,
            validated.personalInfo.email,
            doc.type,
          );
          return { ...doc, fileUrl: url, uploadDate: new Date().toISOString() };
        });
        uploadedDocuments = await Promise.all(uploadPromises);
      } catch (uploadError: any) {
        logger.error({ error: uploadError.message }, "Document upload failed");
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload documents",
            details: uploadError.message,
          },
          { status: 500 },
        );
      }
    }

    const medicId = generateMedicId();
    const timestamp = new Date().toISOString();

    const medicData = {
      ...validated,
      id: medicId,
      credentials: {
        ...validated.credentials,
        documents: uploadedDocuments,
        verified: false,
      },
      status: "pending",
      verified: false,
      createdAt: timestamp,
      lastUpdated: timestamp,
      registrationIp: ip,
      rating: 0,
      totalConsultations: 0,
      lastActive: null,
      isOnline: false,
      profileViews: 0,
      rejectionReason: null,
      verificationNotes: null,
      verificationDate: null,
      assignedVerifier: null,
    };

    await set(ref(db, `doza_medics/${medicId}`), medicData);

    // Audit log
    await writeAuditLog({
      centerId: "unknown", // not known at registration time
      userId: "system",
      userName: validated.personalInfo.email,
      userRole: "medic",
      action: "register",
      resource: "medic",
      resourceId: medicId,
      details: `Medic registration submitted: ${validated.personalInfo.firstName} ${validated.personalInfo.lastName}`,
      status: "success",
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Admin notification
    await push(ref(db, "adminNotifications"), {
      type: "NEW_REGISTRATION",
      medicId,
      medicName: `${validated.personalInfo.firstName} ${validated.personalInfo.lastName}`,
      role: validated.professionalInfo.role,
      timestamp,
      read: false,
    });

    logger.info(
      { medicId, email: validated.personalInfo.email },
      "Medic registration submitted",
    );
    return NextResponse.json(
      {
        success: true,
        data: {
          medicId,
          status: "pending",
          message:
            "Registration submitted successfully. You will be contacted within 24-48 hours.",
          estimatedVerificationTime: "24-48 hours",
          contactEmail: "help@dozamedic.com",
          contactPhone: "+234 812 772 8084",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, ip }, "Medic registration error");
    return NextResponse.json(
      { success: false, error: msg || "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------- GET (Status Check – read‑only) ----------
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const medicId = searchParams.get("medicId");
    const email = searchParams.get("email");

    try {
      statusQuerySchema.parse({ medicId, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }
    }

    if (!medicId && !email) {
      return NextResponse.json(
        { success: false, error: "medicId or email is required" },
        { status: 400 },
      );
    }

    // Rate limit
    const rateKey = `${userId}:medic-status:${medicId || email}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ userId }, "Medic status rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `medicStatus:${medicId || email}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ medicId, email }, "Medic status from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    let medicData: any = null;
    if (medicId) {
      const refPath = ref(db, `doza_medics/${medicId}`);
      const snap = await get(refPath);
      if (snap.exists()) medicData = snap.val();
    } else if (email) {
      const medicsRef = ref(db, "doza_medics");
      const snap = await get(medicsRef);
      if (snap.exists()) {
        const medics = snap.val();
        for (const [id, medic] of Object.entries(medics) as [string, any][]) {
          if (medic.personalInfo?.email === email) {
            medicData = { ...medic, id };
            break;
          }
        }
      }
    }

    if (!medicData) {
      logger.warn({ medicId, email }, "Medic not found");
      return NextResponse.json(
        { success: false, error: "Medic not found" },
        { status: 404 },
      );
    }

    // Sanitize response
    const response = {
      id: medicData.id,
      status: medicData.status,
      personalInfo: {
        firstName: medicData.personalInfo?.firstName,
        lastName: medicData.personalInfo?.lastName,
      },
      professionalInfo: {
        role: medicData.professionalInfo?.role,
      },
      verificationStatus: medicData.credentials?.verified || false,
      createdAt: medicData.createdAt,
      lastUpdated: medicData.lastUpdated,
      rejectionReason: medicData.rejectionReason,
      verificationNotes: medicData.verificationNotes,
      verificationDate: medicData.verificationDate,
    };

    cache.set(cacheKey, response, 30);
    logger.info(
      { medicId, email, status: medicData.status },
      "Medic status fetched",
    );
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error fetching medic status");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- PUT (Admin Status Update – with audit) ----------
export async function PUT(request: NextRequest) {
  let adminId = "";
  let medicId = "";
  try {
    const adminIdHeader = request.headers.get("x-admin-id");
    if (!adminIdHeader) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 },
      );
    }
    adminId = adminIdHeader;

    const rateKey = `${adminId}:medic-status-update`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ adminId }, "Status update rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = statusUpdateSchema.parse(body);
    medicId = validated.medicId;
    const { status, rejectionReason, verificationNotes, assignedVerifier } =
      validated;

    const medicRef = ref(db, `doza_medics/${medicId}`);
    const snapshot = await get(medicRef);
    if (!snapshot.exists()) {
      logger.warn({ medicId }, "Medic not found for update");
      return NextResponse.json(
        { success: false, error: "Medic not found" },
        { status: 404 },
      );
    }

    const currentData = snapshot.val();
    const timestamp = new Date().toISOString();
    const updates: any = { status, lastUpdated: timestamp };

    if (status === "approved") {
      updates.verified = true;
      updates.verificationDate = timestamp;
      updates.verificationNotes = verificationNotes || "Verified by admin";
      updates.assignedVerifier = assignedVerifier || adminId;
      // Create user account
      await set(ref(db, `doza_medics/${medicId}`), {
        ...currentData,
        ...updates,
      });
    } else if (status === "rejected") {
      updates.rejectionReason = rejectionReason || "Application rejected";
      updates.verificationNotes = verificationNotes || "Rejected by admin";
      updates.assignedVerifier = assignedVerifier || adminId;
    } else if (status === "suspended") {
      updates.suspensionReason = rejectionReason || "Account suspended";
      updates.verificationNotes = verificationNotes || "Suspended by admin";
      updates.assignedVerifier = assignedVerifier || adminId;
    }

    await update(medicRef, updates);

    // Audit log
    await writeAuditLog({
      centerId: currentData.centerId || "unknown",
      userId: adminId,
      userName: request.headers.get("x-user-name") || "Admin",
      userRole: "admin",
      action: "update_status",
      resource: "medic",
      resourceId: medicId,
      details: `Updated medic status to ${status}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Detailed audit in dedicated node
    await push(ref(db, "auditLogs/medicStatusChanges"), {
      medicId,
      action: `STATUS_${status.toUpperCase()}`,
      timestamp,
      adminId,
      details: {
        previousStatus: currentData.status,
        newStatus: status,
        reason: rejectionReason,
        notes: verificationNotes,
      },
    });

    // Notify medic
    await push(ref(db, `medicNotifications/${medicId}`), {
      medicId,
      type: "STATUS_UPDATE",
      title: `Application ${status}`,
      message:
        status === "approved"
          ? "Your application has been approved! You can now access your dashboard."
          : status === "rejected"
            ? `Your application was rejected. Reason: ${rejectionReason}`
            : "Your account status has been updated.",
      timestamp,
      read: false,
      actionUrl: status === "approved" ? "/dashboard" : "/support",
    });

    // Invalidate cache
    cache.set(`medicStatus:${medicId}`, null, 0);

    logger.info({ adminId, medicId, status }, "Medic status updated");
    return NextResponse.json({
      success: true,
      data: { medicId, status, message: `Medic status updated to ${status}` },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      { error: msg, adminId, medicId },
      "Error updating medic status",
    );
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- DELETE (Admin Delete – with audit) ----------
export async function DELETE(request: NextRequest) {
  let adminId = "";
  let medicId = "";
  try {
    const adminIdHeader = request.headers.get("x-admin-id");
    if (!adminIdHeader) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 },
      );
    }
    adminId = adminIdHeader;

    const { searchParams } = new URL(request.url);
    const medicIdParam = searchParams.get("medicId");
    if (!medicIdParam) {
      return NextResponse.json(
        { success: false, error: "medicId is required" },
        { status: 400 },
      );
    }
    medicId = medicIdParam;

    const rateKey = `${adminId}:medic-delete`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ adminId }, "Medic delete rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const medicRef = ref(db, `doza_medics/${medicId}`);
    const snapshot = await get(medicRef);
    if (!snapshot.exists()) {
      logger.warn({ medicId }, "Medic not found for deletion");
      return NextResponse.json(
        { success: false, error: "Medic not found" },
        { status: 404 },
      );
    }

    const medicData = snapshot.val();
    const timestamp = new Date().toISOString();

    // Backup
    await set(ref(db, `deletedProfessionals/${medicId}_${Date.now()}`), {
      ...medicData,
      deletedBy: adminId,
      deletedAt: timestamp,
      deletionReason: "Admin deletion",
    });

    await set(medicRef, null);

    // Audit log
    await writeAuditLog({
      centerId: medicData.centerId || "unknown",
      userId: adminId,
      userName: request.headers.get("x-user-name") || "Admin",
      userRole: "admin",
      action: "delete",
      resource: "medic",
      resourceId: medicId,
      details: `Deleted medic: ${medicData.personalInfo?.email || medicId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Detailed audit
    await push(ref(db, "auditLogs/adminActions"), {
      medicId,
      action: "MEDIC_DELETED",
      timestamp,
      adminId,
      details: {
        email: medicData.personalInfo?.email,
        name: `${medicData.personalInfo?.firstName || ""} ${medicData.personalInfo?.lastName || ""}`.trim(),
        status: medicData.status,
      },
    });

    // Invalidate cache
    cache.set(`medicStatus:${medicId}`, null, 0);

    logger.info({ adminId, medicId }, "Medic deleted");
    return NextResponse.json({
      success: true,
      message: "Medic registration deleted successfully",
      backupCreated: true,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, adminId, medicId }, "Error deleting medic");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
