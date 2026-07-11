// app/api/centers/[id]/staff/[staffId]/link-medic/route.ts
// URL: /api/centers/[id]/staff/[staffId]/link-medic
// Method: POST

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/utils/firebaseConfig";
import { get, ref, set, update } from "firebase/database";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const linkMedicSchema = z.object({
  medicId: z.string().min(1, "Medic ID required"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  const { id: centerId, staffId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:link-medic:${centerId}:${staffId}`;
    if (!rateLimiter.check(rateKey, 10, 60)) return tooManyRequests();

    const body = await request.json();
    const { medicId } = linkMedicSchema.parse(body);

    const medicRef = ref(db, `doza_medics/${medicId}`);
    const medicSnapshot = await get(medicRef);
    if (!medicSnapshot.exists()) {
      logger.warn({ medicId }, "Medic not found");
      return NextResponse.json(
        { success: false, error: "Medic not found" },
        { status: 404 },
      );
    }

    const medicData = medicSnapshot.val();

    const staffRef = ref(db, `doza_centers/${centerId}/staff/${staffId}`);
    const staffSnapshot = await get(staffRef);
    if (!staffSnapshot.exists()) {
      logger.warn({ centerId, staffId }, "Staff not found for linking");
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    const staffData = staffSnapshot.val();

    const updates: any = {};
    updates[`doza_centers/${centerId}/staff/${staffId}/dozaMedic`] = {
      isRegistered: true,
      medicId,
      linkedAt: new Date().toISOString(),
      registrationDate: medicData.registrationDate || new Date().toISOString(),
      points: medicData.points || 0,
      level: medicData.level || "beginner",
      lastSynced: new Date().toISOString(),
    };

    updates[`doza_medics/${medicId}/centerAffiliation`] = {
      centerId,
      staffId,
      linkedAt: new Date().toISOString(),
      verified: true,
      centerName: medicData.centerName || "Unknown Center",
    };

    const invitationsRef = ref(db, "doza_invitations");
    const invitationsSnapshot = await get(invitationsRef);
    if (invitationsSnapshot.exists()) {
      const invitations = invitationsSnapshot.val();
      Object.entries(invitations).forEach(([id, inv]: [string, any]) => {
        if (inv.staffId === staffId && inv.status === "pending") {
          updates[`doza_invitations/${id}/status`] = "completed";
          updates[`doza_invitations/${id}/completedAt`] =
            new Date().toISOString();
          updates[`doza_invitations/${id}/linkedMedicId`] = medicId;
        }
      });
    }

    await update(ref(db), updates);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        request.headers.get("x-user-name") ||
        staffData.personalInfo?.fullName ||
        "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "staff",
      resourceId: staffId,
      details: `Linked staff to medic: ${medicId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, staffId, medicId }, "Medic linked successfully");
    return NextResponse.json({
      success: true,
      message: "Accounts linked successfully",
      medicId,
      staffId,
    });
  } catch (error) {
    return handleError(error);
  }
}
