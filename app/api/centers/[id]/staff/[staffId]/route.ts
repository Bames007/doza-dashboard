// app/api/centers/[id]/staff/[staffId]/route.ts
// URL: /api/centers/[id]/staff/[staffId]
// Methods: PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const staffUpdateSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Full name required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone required"),
    position: z.string().optional(),
  }),
  professional: z
    .object({
      role: z.string().optional(),
      department: z.string().optional(),
      employmentType: z.string().optional(),
      startDate: z.string().optional(),
    })
    .optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  const { id: centerId, staffId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:staff-update:${centerId}:${staffId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = staffUpdateSchema.parse(body);

    const staffRef = ref(db, `doza_centers/${centerId}/staff/${staffId}`);
    const snapshot = await get(staffRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, staffId }, "Staff not found for update");
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();

    if (
      existing.isOwner &&
      (validated.personalInfo || validated.professional)
    ) {
      return NextResponse.json(
        { success: false, error: "Cannot modify owner information" },
        { status: 400 },
      );
    }

    const updates: any = {};
    if (validated.personalInfo) {
      updates.personalInfo = {
        ...existing.personalInfo,
        ...validated.personalInfo,
        fullName: validated.personalInfo.fullName.trim(),
        email: validated.personalInfo.email.trim().toLowerCase(),
        phone: validated.personalInfo.phone.trim(),
        position:
          validated.personalInfo.position?.trim() ||
          existing.personalInfo.position,
      };
    }
    if (validated.professional) {
      updates.professional = {
        ...existing.professional,
        ...validated.professional,
      };
    }
    if (validated.status) {
      updates.status = validated.status;
    }
    updates.lastUpdated = new Date().toISOString();

    await update(staffRef, updates);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        request.headers.get("x-user-name") ||
        existing.personalInfo?.fullName ||
        "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "staff",
      resourceId: staffId,
      details: `Updated staff: ${existing.personalInfo?.fullName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, staffId }, "Staff updated");
    return NextResponse.json({
      success: true,
      data: { id: staffId, ...existing, ...updates },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> },
) {
  const { id: centerId, staffId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:staff-delete:${centerId}:${staffId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const staffRef = ref(db, `doza_centers/${centerId}/staff/${staffId}`);
    const snapshot = await get(staffRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, staffId }, "Staff not found for deletion");
      return NextResponse.json(
        { success: false, error: "Staff not found" },
        { status: 404 },
      );
    }

    const staffData = snapshot.val();
    if (staffData.isOwner) {
      return NextResponse.json(
        { success: false, error: "Cannot delete owner account" },
        { status: 400 },
      );
    }

    await remove(staffRef);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        request.headers.get("x-user-name") ||
        staffData.personalInfo?.fullName ||
        "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "staff",
      resourceId: staffId,
      details: `Deleted staff: ${staffData.personalInfo?.fullName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, staffId }, "Staff deleted");
    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}
