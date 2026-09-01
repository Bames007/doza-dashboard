// app/api/centers/[id]/requisitions/[reqId]/escalate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import { createNotification } from "@/app/lib/notificationHelper";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const escalateSchema = z.object({
  targetUserId: z.string().min(1),
  comment: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reqId: string }> },
) {
  const { id: centerId, reqId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userRole = request.headers.get("x-user-role") || "support";
    const userName = request.headers.get("x-user-name") || "Unknown";

    const rateKey = `${userId}:requisition-escalate:${centerId}:${reqId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { targetUserId, comment } = escalateSchema.parse(body);

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();

    // Authorization
    const isAdmin = ["admin", "owner", "admin", "center_owner"].includes(
      userRole,
    );
    const isAssigned = oldData.assignedToUserId === userId;
    const isRoleMatch = oldData.approverRole === userRole;

    if (!isAdmin && !isAssigned && !isRoleMatch) {
      return NextResponse.json(
        { success: false, error: "Not authorized to escalate" },
        { status: 403 },
      );
    }

    if (oldData.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Only pending requisitions can be escalated" },
        { status: 400 },
      );
    }

    // Get target staff details
    const staffRef = ref(db, `doza_centers/${centerId}/staff/${targetUserId}`);
    const staffSnap = await get(staffRef);
    if (!staffSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Target staff not found" },
        { status: 404 },
      );
    }
    const targetStaff = staffSnap.val();
    const targetName = targetStaff.personalInfo?.fullName || "Unknown";
    const targetRole = targetStaff.professional?.role || "support";

    if (targetUserId === userId) {
      return NextResponse.json(
        { success: false, error: "You cannot escalate to yourself" },
        { status: 400 },
      );
    }

    if (oldData.assignedToUserId === targetUserId) {
      return NextResponse.json(
        { success: false, error: "Requisition already assigned to this user" },
        { status: 400 },
      );
    }

    const escalationEntry = {
      role: userRole,
      userId,
      userName,
      action: "escalate",
      timestamp: new Date().toISOString(),
      comment: comment || `Escalated to ${targetName}`,
    };

    const assignmentEntry = {
      role: userRole,
      userId,
      userName,
      action: "assigned",
      timestamp: new Date().toISOString(),
      comment: `Assigned to ${targetName}`,
    };

    const updated = {
      ...oldData,
      approverRole: targetRole,
      assignedToUserId: targetUserId,
      assignedToName: targetName,
      updatedAt: new Date().toISOString(),
      approvalHistory: [
        ...(oldData.approvalHistory || []),
        escalationEntry,
        assignmentEntry,
      ],
    };
    await update(ref(db, refPath), updated);

    // Invalidate caches
    cache.set(`requisitions:${centerId}:${oldData.requesterId}`, null, 0);
    cache.set(`requisitions:${centerId}:${userId}`, null, 0);
    cache.set(`requisitions:${centerId}:${targetUserId}`, null, 0);

    // Notify new assignee
    await createNotification({
      centerId,
      userId: targetUserId,
      title: "Requisition Escalated to You",
      message: `${userName} escalated a requisition to you.`,
      type: "requisition",
      relatedId: reqId,
      link: `/dashboard/approvals/${reqId}`,
    });

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "escalate",
      resource: "requisition",
      resourceId: reqId,
      details: `Escalated to ${targetName}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      `Requisition ${reqId} escalated to ${targetUserId} by ${userId}`,
    );
    return NextResponse.json({
      success: true,
      data: { id: reqId, ...updated },
      message: `Escalated to ${targetName}`,
    });
  } catch (error) {
    return handleError(error);
  }
}
