// app/api/medics/register/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, set, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  InvitationsMap,
  MedicsMap,
  MedicData,
  DozaInvitation,
} from "@/app/center/type";

// ---------- Zod Schemas ----------
const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

const professionalInfoSchema = z.object({
  role: z.string().optional(),
  licenseNumber: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  specialties: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
});

const medicDataSchema = z.object({
  personalInfo: personalInfoSchema,
  professionalInfo: professionalInfoSchema.optional(),
  practiceInfo: z.record(z.string(), z.any()).optional(),
  location: z.record(z.string(), z.any()).optional(),
  credentials: z.record(z.string(), z.any()).optional(),
  points: z.number().optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token required"),
  email: z.string().email("Valid email required"),
  medicData: medicDataSchema,
});

export async function POST(request: NextRequest) {
  let userId = "";
  let email = "";
  try {
    const ip = getClientIp(request);
    const userIdHeader = request.headers.get("x-user-id") || ip;
    userId = userIdHeader;

    const rateKey = `medic-accept:${userId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ ip, userId }, "Medic accept rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = acceptInvitationSchema.parse(body);
    const { token, email: emailParam, medicData } = validated;
    email = emailParam;

    logger.info({ token, email }, "Processing medic invitation acceptance");

    // Verify invitation
    const invitationsRef = ref(db, "doza_invitations");
    const invitationsSnapshot = await get(invitationsRef);

    let invitation: DozaInvitation | null = null;
    let invitationId: string | null = null;

    if (invitationsSnapshot.exists()) {
      const invitations = invitationsSnapshot.val() as InvitationsMap;
      for (const [id, inv] of Object.entries(invitations)) {
        if (
          inv &&
          typeof inv === "object" &&
          "token" in inv &&
          "email" in inv
        ) {
          if (inv.token === token && inv.email === email) {
            invitation = inv as DozaInvitation;
            invitationId = id;
            break;
          }
        }
      }
    }

    if (!invitation || !invitationId) {
      logger.warn({ token, email }, "Invalid invitation");
      return NextResponse.json(
        { success: false, error: "Invalid invitation or token" },
        { status: 404 },
      );
    }

    // Check expiration
    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      await update(ref(db, `doza_invitations/${invitationId}`), {
        status: "expired",
      });
      logger.warn({ token, email, expiresAt }, "Invitation expired");
      return NextResponse.json(
        { success: false, error: "Invitation has expired" },
        { status: 410 },
      );
    }

    if (invitation.status !== "pending") {
      logger.warn(
        { token, email, status: invitation.status },
        "Invitation already used",
      );
      return NextResponse.json(
        {
          success: false,
          error: `Invitation has already been ${invitation.status}`,
        },
        { status: 400 },
      );
    }

    if (!invitation.centerId || !invitation.staffId) {
      logger.error(
        {
          invitationId,
          centerId: invitation.centerId,
          staffId: invitation.staffId,
        },
        "Invalid invitation data",
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid invitation data: missing centerId or staffId",
        },
        { status: 400 },
      );
    }

    // Check existing medic
    const medicsRef = ref(db, "doza_medics");
    const medicsSnapshot = await get(medicsRef);
    let existingMedicId: string | null = null;

    if (medicsSnapshot.exists()) {
      const medics = medicsSnapshot.val() as MedicsMap;
      for (const [id, medic] of Object.entries(medics)) {
        if (
          medic &&
          typeof medic === "object" &&
          "personalInfo" in medic &&
          medic.personalInfo &&
          typeof medic.personalInfo === "object" &&
          "email" in medic.personalInfo
        ) {
          if (medic.personalInfo.email === email) {
            existingMedicId = id;
            break;
          }
        }
      }
    }

    let medicId: string;

    if (existingMedicId) {
      medicId = existingMedicId;
      // Link existing medic to staff
      await update(
        ref(db, `centers/${invitation.centerId}/staff/${invitation.staffId}`),
        {
          dozaMedic: {
            isRegistered: true,
            medicId: existingMedicId,
            linkedAt: new Date().toISOString(),
            registrationDate: new Date().toISOString(),
          },
        },
      );
      await set(ref(db, `doza_medics/${existingMedicId}/centerAffiliation`), {
        centerId: invitation.centerId,
        staffId: invitation.staffId,
        linkedAt: new Date().toISOString(),
        verified: true,
        centerName: invitation.centerName || "Unknown Center",
      });
      logger.info(
        { medicId, centerId: invitation.centerId, staffId: invitation.staffId },
        "Existing medic linked",
      );
    } else {
      // Create new medic
      medicId = uuidv4();
      const medicRef = ref(db, `doza_medics/${medicId}`);
      const completeMedicData: MedicData = {
        ...medicData,
        id: medicId,
        registrationDate: new Date().toISOString(),
        status: "active",
        centerAffiliation: {
          centerId: invitation.centerId,
          staffId: invitation.staffId,
          linkedAt: new Date().toISOString(),
          verified: true,
          centerName: invitation.centerName || "Unknown Center",
        },
        points: medicData.points || 0,
        level: medicData.level || "beginner",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as MedicData;
      await set(medicRef, completeMedicData);
      await update(
        ref(db, `centers/${invitation.centerId}/staff/${invitation.staffId}`),
        {
          dozaMedic: {
            isRegistered: true,
            medicId: medicId,
            linkedAt: new Date().toISOString(),
            registrationDate: new Date().toISOString(),
            points: completeMedicData.points,
            level: completeMedicData.level,
          },
        },
      );
      logger.info(
        { medicId, centerId: invitation.centerId, staffId: invitation.staffId },
        "New medic created and linked",
      );
    }

    // Update invitation
    await update(ref(db, `doza_invitations/${invitationId}`), {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      medicId: medicId,
    });

    // Audit log
    await writeAuditLog({
      centerId: invitation.centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "accept",
      resource: "invitation",
      resourceId: invitationId,
      details: `Accepted invitation for medic ${email}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { medicId, invitationId, email },
      "Invitation accepted successfully",
    );
    return NextResponse.json({
      success: true,
      message: existingMedicId
        ? "Accounts linked successfully"
        : "Medic account created and linked successfully",
      medicId,
      centerId: invitation.centerId,
      staffId: invitation.staffId,
      invitationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, userId, email }, "Error accepting invitation");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to accept invitation",
        details: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
