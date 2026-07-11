// app/api/medics/register/invite/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, set, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import { InvitationsMap } from "@/app/center/type";

// ---------- Zod Schema ----------
const inviteSchema = z.object({
  staffId: z.string().min(1, "Staff ID required"),
  email: z.string().email("Valid email required"),
  centerId: z.string().min(1, "Center ID required"),
  centerName: z.string().optional(),
  invitedBy: z.string().min(1, "Invited by (user ID) required"),
});

export async function POST(request: NextRequest) {
  let invitedBy = "";
  let centerId = "";
  let email = "";
  try {
    const ip = getClientIp(request);
    const userId = request.headers.get("x-user-id") || ip;
    invitedBy = userId;

    const rateKey = `medic-invite:${invitedBy}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ ip, userId }, "Medic invite rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = inviteSchema.parse(body);
    const {
      staffId,
      email: emailParam,
      centerId: cId,
      centerName,
      invitedBy: invBy,
    } = validated;
    email = emailParam;
    centerId = cId;

    logger.info({ staffId, email, centerId, invitedBy }, "Creating invitation");

    // Check existing pending invitation
    const invitationsRef = ref(db, "doza_invitations");
    const snapshot = await get(invitationsRef);
    let existingInvitation: {
      id: string;
      token: string;
      expiresAt: string;
    } | null = null;

    if (snapshot.exists()) {
      const invitations = snapshot.val() as InvitationsMap;
      for (const [id, inv] of Object.entries(invitations)) {
        if (
          inv &&
          typeof inv === "object" &&
          "email" in inv &&
          "status" in inv
        ) {
          if (inv.email === email && inv.status === "pending") {
            existingInvitation = {
              id,
              token: inv.token,
              expiresAt: inv.expiresAt,
            };
            break;
          }
        }
      }
    }

    if (existingInvitation) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const invitationLink = `${baseUrl}/medic/register?token=${existingInvitation.token}&email=${encodeURIComponent(email)}`;

      logger.info(
        { email, invitationId: existingInvitation.id },
        "Existing invitation found",
      );
      return NextResponse.json({
        success: true,
        message: "Existing invitation found",
        invitationLink,
        invitationId: existingInvitation.id,
        expiresAt: existingInvitation.expiresAt,
        status: "already_exists",
      });
    }

    // Generate new invitation
    const invitationId = uuidv4();
    const token = Buffer.from(`${invitationId}_${Date.now()}_${email}`)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const invitationData = {
      staffId,
      email,
      centerId,
      centerName: centerName || "",
      invitedBy,
      token,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    await set(ref(db, `doza_invitations/${invitationId}`), invitationData);

    // Update staff record
    await update(ref(db, `centers/${centerId}/staff/${staffId}`), {
      dozaMedic: {
        isRegistered: false,
        registrationStatus: "invited",
        invitationSentAt: new Date().toISOString(),
        invitationId,
      },
    });

    // Audit log
    await writeAuditLog({
      centerId,
      userId: invitedBy,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "invite",
      resource: "medic",
      resourceId: invitationId,
      details: `Invited medic ${email} for staff ${staffId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const invitationLink = `${baseUrl}/medic/register?token=${token}&email=${encodeURIComponent(email)}`;

    logger.info({ email, invitationId }, "Invitation created successfully");

    return NextResponse.json({
      success: true,
      message: "Invitation created successfully",
      invitationLink,
      invitationId,
      expiresAt,
      token, // Keep for testing; remove in production
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
      { error: msg, invitedBy, centerId, email },
      "Error creating invitation",
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invitation",
        details: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
