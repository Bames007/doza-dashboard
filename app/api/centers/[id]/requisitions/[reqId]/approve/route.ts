// app/api/centers/[id]/requisitions/[reqId]/approve/route.ts
// URL: /api/centers/[id]/requisitions/[reqId]/approve
// Method: POST

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

const approvalSchema = z.object({
  decision: z.enum(["approve", "reject"]),
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

    const rateKey = `${userId}:requisition-approve:${centerId}:${reqId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { decision, comment } = approvalSchema.parse(body);

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();

    const isAdmin = [
      "admin",
      "owner",
      "hospital_admin",
      "center_owner",
    ].includes(userRole);
    const isAssigned = oldData.assignedToUserId === userId;
    const isRoleMatch = oldData.approverRole === userRole;

    if (!isAdmin && !isAssigned && !isRoleMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not authorized to approve this requisition",
        },
        { status: 403 },
      );
    }

    if (oldData.status === "approved" || oldData.status === "rejected") {
      return NextResponse.json({
        success: true,
        data: { id: reqId, ...oldData },
        message: `Requisition already ${oldData.status}`,
      });
    }

    if (oldData.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Requisition is not pending (current: ${oldData.status})`,
        },
        { status: 400 },
      );
    }

    const newStatus = decision === "approve" ? "approved" : "rejected";
    const approvalEntry = {
      role: userRole,
      userId,
      userName,
      action: decision,
      timestamp: new Date().toISOString(),
      comment: comment || "",
    };

    const updated = {
      ...oldData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      approvalHistory: [...(oldData.approvalHistory || []), approvalEntry],
    };
    await update(ref(db, refPath), updated);

    cache.set(`requisitions:${centerId}:${oldData.requesterId}`, null, 0);
    cache.set(`requisitions:${centerId}:${userId}`, null, 0);
    if (oldData.assignedToUserId) {
      cache.set(
        `requisitions:${centerId}:${oldData.assignedToUserId}`,
        null,
        0,
      );
    }

    await createNotification({
      centerId,
      userId: oldData.requesterId,
      title: `Requisition ${decision === "approve" ? "Approved" : "Rejected"}`,
      message: `Your requisition has been ${decision}d${comment ? ": " + comment : ""}`,
      type: "approval",
      relatedId: reqId,
      link: `/dashboard/requisitions/${reqId}`,
    });

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: decision === "approve" ? "approve" : "reject",
      resource: "requisition",
      resourceId: reqId,
      details: `${decision}d requisition`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(`Requisition ${reqId} ${decision}d by ${userId}`);
    return NextResponse.json({
      success: true,
      data: { id: reqId, ...updated },
      message: `Requisition ${decision}d`,
    });
  } catch (error) {
    return handleError(error);
  }
}
