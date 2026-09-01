// app/api/centers/[id]/doza-requests/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger"; // <-- NEW IMPORT

// ─── Schemas ────────────────────────────────────────────────────────────
const createSchema = z.object({
  patientName: z.string().min(1),
  patientPhone: z.string().optional(),
  patientEmail: z.string().optional(),
  dozaUserId: z.string().min(1),
  type: z.enum(["consultation", "prescription", "test"]),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  notes: z.string().optional().default(""),
  medication: z.string().optional(),
  dosage: z.string().optional(),
  quantity: z.number().optional(),
  testName: z.string().optional(),
  fulfillmentMethod: z.enum(["pickup", "delivery"]).optional(),
  deliveryAddress: z.string().optional(),
});

const patchSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["accept", "reject"]),
  notes: z.string().optional().default(""),
});

// ─── GET ───────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;

  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:doza-requests:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `doza-requests:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      // Log view (cached) – optional but included
      await writeAuditLog({
        centerId,
        userId,
        userName,
        userRole,
        action: "view",
        resource: "dozaRequest",
        resourceId: "list",
        details: `Viewed cached Doza requests (count: ${cached.length})`,
        status: "success",
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || "unknown",
      }).catch((e) => logger.warn(e, "Audit log failed"));
      return NextResponse.json({ success: true, data: cached });
    }

    const requestsRef = ref(db, `doza_centers/${centerId}/dozaRequests`);
    const snapshot = await get(requestsRef);
    let requests = snapshot.exists() ? snapshot.val() : {};
    let list = Object.entries(requests).map(([id, data]) => ({
      id,
      ...(data as object),
    }));

    list.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    cache.set(cacheKey, list, 5);

    // Audit log for successful fetch
    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "view",
      resource: "dozaRequest",
      resourceId: "list",
      details: `Fetched Doza requests (count: ${list.length})`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    }).catch((e) => logger.warn(e, "Audit log failed"));

    logger.info(
      { centerId, count: list.length },
      "Doza requests fetched from dedicated node",
    );

    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ──────────────────────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;

  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:doza-request-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 10, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = createSchema.parse(body);

    const newRequest = {
      ...validated,
      status: "pending",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responseNotes: "",
      respondedBy: null,
      respondedAt: null,
    };

    const requestsRef = ref(db, `doza_centers/${centerId}/dozaRequests`);
    const newRef = push(requestsRef);
    await set(newRef, newRequest);

    cache.set(`doza-requests:${centerId}`, null, 0);

    // Store in user's own requests node
    if (validated.dozaUserId) {
      const centerNameSnap = await get(
        ref(db, `doza_centers/${centerId}/name`),
      );
      const centerName = centerNameSnap.exists()
        ? centerNameSnap.val()
        : "Unknown Center";

      const userRequestRef = ref(
        db,
        `doza_users/${validated.dozaUserId}/requests/${newRef.key}`,
      );
      await set(userRequestRef, {
        ...newRequest,
        centerId,
        centerName,
      });
    }

    // Notify the Doza user
    if (validated.dozaUserId) {
      try {
        const notifRef = ref(
          db,
          `doza/users/${validated.dozaUserId}/notifications`,
        );
        const notif = push(notifRef);
        await set(notif, {
          title: "Request Submitted",
          message: `Your ${validated.type} request has been sent to the center.`,
          type: "doza-request",
          link: `/dashboard/doza-requests/${newRef.key}`,
          read: false,
          timestamp: Date.now(),
          centerId,
        });
      } catch (e) {
        logger.warn(e, "Failed to notify user");
      }
    }

    // Notify center admin/owner
    try {
      const centerSnap = await get(ref(db, `doza_centers/${centerId}`));
      let targetUserId: string | null = null;
      if (centerSnap.exists()) {
        const centerData = centerSnap.val();
        if (centerData.ownerInfo?.userId) {
          targetUserId = centerData.ownerInfo.userId;
        } else if (centerData.createdBy) {
          targetUserId = centerData.createdBy;
        }
      }

      if (targetUserId) {
        const centerNotifRef = ref(
          db,
          `doza_centers/${centerId}/notifications`,
        );
        const notif = push(centerNotifRef);
        await set(notif, {
          userId: targetUserId,
          title: `New ${validated.type} Request`,
          message: `${validated.patientName} requested ${validated.type === "consultation" ? "an appointment" : validated.type === "prescription" ? "medication" : "a test"}.`,
          type: "doza-request",
          status: "pending",
          relatedId: newRef.key,
          timestamp: Date.now(),
          read: false,
          link: "doza-requests",
        });
      }
    } catch (e) {
      logger.warn(e, "Failed to notify center");
    }

    // Audit log for request creation
    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "create",
      resource: "dozaRequest",
      resourceId: newRef.key,
      details: `Created ${validated.type} request for patient "${validated.patientName}"`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    }).catch((e) => logger.warn(e, "Audit log failed"));

    logger.info(
      { centerId, requestId: newRef.key, type: validated.type },
      "Doza request created",
    );

    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newRequest },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}

// ─── PATCH ──────────────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;

  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userName = request.headers.get("x-user-name") || "Unknown";
    const userRole = request.headers.get("x-user-role") || "staff";

    const rateKey = `${userId}:doza-requests-patch:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { requestId, action, notes } = patchSchema.parse(body);

    const requestRef = ref(
      db,
      `doza_centers/${centerId}/dozaRequests/${requestId}`,
    );
    const snapshot = await get(requestRef);
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();
    const newStatus = action === "accept" ? "scheduled" : "cancelled";

    const updateData = {
      status: newStatus,
      responseNotes: notes || "",
      respondedBy: userId,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await update(requestRef, updateData);

    cache.set(`doza-requests:${centerId}`, null, 0);

    // Update user's copy
    if (existing.dozaUserId) {
      try {
        const userRequestRef = ref(
          db,
          `doza_users/${existing.dozaUserId}/requests/${requestId}`,
        );
        const userSnap = await get(userRequestRef);
        if (userSnap.exists()) {
          await update(userRequestRef, updateData);
        }
      } catch (e) {
        logger.warn(e, "Failed to update user's request copy");
      }
    }

    // Notify the Doza user
    if (existing.dozaUserId) {
      try {
        const notifRef = ref(
          db,
          `doza/users/${existing.dozaUserId}/notifications`,
        );
        const notif = push(notifRef);
        await set(notif, {
          title: action === "accept" ? "Request Approved" : "Request Rejected",
          message: `Your ${existing.type} request at the center has been ${newStatus}.`,
          type: "doza-request",
          link: `/dashboard/doza-requests/${requestId}`,
          read: false,
          timestamp: Date.now(),
          centerId,
          requestId,
        });
      } catch (e) {
        logger.warn(e, "Failed to notify user");
      }
    }

    // Audit log for request update
    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "update",
      resource: "dozaRequest",
      resourceId: requestId,
      details: `${action} request (status: ${newStatus}) for patient "${existing.patientName}"`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    }).catch((e) => logger.warn(e, "Audit log failed"));

    return NextResponse.json({
      success: true,
      data: { id: requestId, ...updateData },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
