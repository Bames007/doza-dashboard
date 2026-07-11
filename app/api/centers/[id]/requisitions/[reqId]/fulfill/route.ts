// app/api/centers/[id]/requisitions/[reqId]/fulfill/route.ts
// URL: /api/centers/[id]/requisitions/[reqId]/fulfill
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
  computeStatus,
} from "@/app/lib/apiHelpers";

const fulfillSchema = z.object({
  fulfilledBy: z.string().optional(),
  notes: z.string().optional(),
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

    const rateKey = `${userId}:requisition-fulfill:${centerId}:${reqId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { fulfilledBy, notes } = fulfillSchema.parse(body);

    const refPath = `doza_centers/${centerId}/requisitions/${reqId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Requisition not found" },
        { status: 404 },
      );
    }
    const oldData = snapshot.val();

    if (oldData.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Only approved requisitions can be fulfilled",
        },
        { status: 400 },
      );
    }

    // Deduct inventory for each item (if drugId exists)
    const inventoryRef = ref(db, `doza_centers/${centerId}/inventory/pharmacy`);
    const inventorySnap = await get(inventoryRef);
    const inventory = inventorySnap.exists() ? inventorySnap.val() : {};

    for (const item of oldData.items) {
      if (item.drugId) {
        const drugRef = ref(
          db,
          `doza_centers/${centerId}/inventory/pharmacy/${item.drugId}`,
        );
        const drugSnap = await get(drugRef);
        if (drugSnap.exists()) {
          const drug = drugSnap.val();
          const newQty = Math.max(0, (drug.quantity || 0) - item.quantity);
          const status = computeStatus(
            newQty,
            drug.reorderPoint || 10,
            drug.expiryDate,
          );
          await update(drugRef, {
            quantity: newQty,
            status,
            lastUpdated: new Date().toISOString(),
          });
        } else {
          logger.warn(`Drug ${item.drugId} not found for fulfillment`);
        }
      } else {
        logger.warn(`No drugId for item ${item.name}, cannot deduct inventory`);
      }
    }

    const updated = {
      ...oldData,
      status: "fulfilled",
      fulfilledBy: fulfilledBy || userName,
      fulfilledAt: new Date().toISOString(),
      fulfillmentNotes: notes || "",
      updatedAt: new Date().toISOString(),
    };
    await update(ref(db, refPath), updated);

    cache.set(`requisitions:${centerId}:${oldData.requesterId}`, null, 0);
    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);

    await createNotification({
      centerId,
      userId: oldData.requesterId,
      title: "Requisition Fulfilled",
      message: `Your requisition has been fulfilled by ${fulfilledBy || userName}`,
      type: "fulfillment",
      relatedId: reqId,
      link: `/dashboard/requisitions/${reqId}`,
    });

    await writeAuditLog({
      centerId,
      userId,
      userName,
      userRole,
      action: "fulfill",
      resource: "requisition",
      resourceId: reqId,
      details: `Fulfilled requisition`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(`Requisition ${reqId} fulfilled by ${userId}`);
    return NextResponse.json({
      success: true,
      data: { id: reqId, ...updated },
    });
  } catch (error) {
    return handleError(error);
  }
}
