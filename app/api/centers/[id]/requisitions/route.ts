// app/api/centers/[id]/requisitions/route.ts
// URL: /api/centers/[id]/requisitions
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
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

const requisitionItemSchema = z.object({
  drugId: z.string().optional(),
  name: z.string().min(1),
  strength: z.string().optional(),
  form: z.string().optional(),
  quantity: z.number().int().positive(),
  unit: z.string().min(1),
});

const requisitionSchema = z.object({
  type: z.enum(["pharmacy-restock", "clinical", "lab", "ward-supply"]),
  priority: z.enum(["routine", "urgent", "stat"]).default("routine"),
  patientId: z.string().optional(),
  patientName: z.string().optional(),
  clinicalNotes: z.string().optional(),
  items: z.array(requisitionItemSchema).min(1),
  approverRole: z.string().optional(),
  assignedToUserId: z.string().optional(),
  assignedToName: z.string().optional(),
});

function getApproverRole(type: string): string {
  switch (type) {
    case "pharmacy-restock":
      return "admin";
    case "clinical":
      return "head-nurse";
    case "lab":
      return "lab-manager";
    case "ward-supply":
      return "admin";
    default:
      return "admin";
  }
}

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userRole = request.headers.get("x-user-role") || "support";

    const rateKey = `${userId}:requisitions:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `requisitions:${centerId}:${userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const refPath = `doza_centers/${centerId}/requisitions`;
    const snapshot = await get(ref(db, refPath));
    const data = snapshot.exists()
      ? Object.entries(snapshot.val()).map(([id, val]) => ({
          id,
          ...(val as any),
        }))
      : [];

    const isAdmin = ["center_owner", "admin"].includes(userRole);
    const isApprover = ["head-nurse", "lab-manager", "cmo", "owner"].includes(
      userRole,
    );

    let filtered = data;

    if (isAdmin) {
      filtered = data; // admins see everything
    } else if (isApprover) {
      filtered = data.filter((r) => {
        const isOwn = r.requesterId === userId;
        const isPendingForMe =
          r.status === "pending" && r.approverRole === userRole;
        const isAssignedToMe = r.assignedToUserId === userId;
        const hasActed = r.approvalHistory?.some(
          (entry: any) => entry.userId === userId,
        );
        return isOwn || isPendingForMe || isAssignedToMe || hasActed;
      });
    } else {
      // Regular users: own requests + requests assigned to them
      filtered = data.filter(
        (r) => r.requesterId === userId || r.assignedToUserId === userId,
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    cache.set(cacheKey, filtered, 30);
    return NextResponse.json({ success: true, data: filtered });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "support";

    const rateKey = `${userId}:requisition-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = requisitionSchema.parse(body);

    let finalApproverRole =
      validated.approverRole || getApproverRole(validated.type);

    const history: any[] = [
      {
        role: userRole,
        userId,
        userName,
        action: "submitted",
        timestamp: new Date().toISOString(),
        comment: "Requisition submitted",
      },
    ];

    if (validated.assignedToUserId && validated.assignedToName) {
      history.push({
        role: userRole,
        userId,
        userName,
        action: "assigned",
        timestamp: new Date().toISOString(),
        comment: `Assigned to ${validated.assignedToName}`,
      });
    }

    const newRequisition = {
      ...validated,
      requesterId: userId,
      requesterName: userName,
      requesterRole: userRole,
      approverRole: finalApproverRole,
      assignedToUserId: validated.assignedToUserId || null,
      assignedToName: validated.assignedToName || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvalHistory: history,
    };

    const refPath = `doza_centers/${centerId}/requisitions`;
    const newRef = push(ref(db, refPath));
    await update(newRef, newRequisition);

    const created = { id: newRef.key, ...newRequisition };
    cache.set(`requisitions:${centerId}:${userId}`, null, 0);

    const notifyTarget = validated.assignedToUserId || finalApproverRole;
    await createNotification({
      centerId,
      userId: notifyTarget,
      title: "New Requisition",
      message: `${userName} requested ${validated.items.length} item(s) (${validated.type})`,
      type: "requisition",
      relatedId: newRef.key!,
      link: `/dashboard/approvals/${newRef.key}`,
    });

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "create",
      resource: "requisition",
      resourceId: newRef.key!,
      details: `Created ${validated.type} requisition with ${validated.items.length} items`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      `Requisition created: ${newRef.key} by ${userId} in center ${centerId}`,
    );
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    return handleError(error);
  }
}
