// URL: /api/centers/[id]/inventory/triggers/low-stock?autoCreate=true
// Method: GET

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import { createNotification } from "@/app/lib/notificationHelper";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();
    const userRole = request.headers.get("x-user-role") || "support";
    if (!["admin", "owner", "pharmacist"].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }

    const rateKey = `${userId}:low-stock-trigger:${centerId}`;
    if (!rateLimiter.check(rateKey, 10, 60)) return tooManyRequests();

    const autoCreate =
      request.nextUrl.searchParams.get("autoCreate") === "true";

    const inventoryRef = ref(db, `doza_centers/${centerId}/inventory/pharmacy`);
    const inventorySnap = await get(inventoryRef);
    const inventory = inventorySnap.exists() ? inventorySnap.val() : {};

    const lowStockItems = [];
    const requisitionItems = [];

    for (const [drugId, drug] of Object.entries(inventory) as [string, any][]) {
      const qty = drug.quantity || 0;
      const reorder = drug.reorderPoint || 10;
      if (qty <= reorder && qty > 0) {
        lowStockItems.push({
          drugId,
          name: drug.name,
          strength: drug.strength,
          form: drug.form,
          quantity: qty,
          reorderPoint: reorder,
        });
        const suggestedQty = reorder * 2 - qty;
        if (suggestedQty > 0) {
          requisitionItems.push({
            drugId,
            name: drug.name,
            strength: drug.strength || "",
            form: drug.form || "",
            quantity: suggestedQty,
            unit: drug.unit || "unit",
          });
        }
      }
    }

    let createdRequisition = null;
    if (autoCreate && requisitionItems.length > 0) {
      const newReq = {
        type: "pharmacy-restock",
        priority: "routine",
        items: requisitionItems,
        requesterId: userId,
        requesterName: request.headers.get("x-user-name") || "System",
        requesterRole: userRole,
        approverRole: "admin",
        status: "pending",
        clinicalNotes: `Auto-generated from low-stock trigger. ${requisitionItems.length} items need restocking.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approvalHistory: [
          {
            role: userRole,
            userId,
            action: "submitted",
            timestamp: new Date().toISOString(),
            comment: "Auto-generated low stock requisition",
          },
        ],
      };
      const refPath = `doza_centers/${centerId}/requisitions`;
      const newRef = push(ref(db, refPath));
      await update(newRef, newReq);
      createdRequisition = { id: newRef.key, ...newReq };

      await createNotification({
        centerId,
        userId: "admin",
        title: "Auto Low-Stock Requisition",
        message: `System generated a requisition for ${requisitionItems.length} items due to low stock.`,
        type: "requisition",
        relatedId: newRef.key!,
        link: `/dashboard/approvals/${newRef.key}`,
      });

      await writeAuditLog({
        centerId,
        userId,
        userName: request.headers.get("x-user-name") || "System",
        userRole,
        action: "create",
        resource: "requisition",
        resourceId: newRef.key!,
        details: `Auto-generated low-stock requisition with ${requisitionItems.length} items`,
        status: "success",
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || "unknown",
      });

      logger.info(
        `Low-stock trigger created requisition ${newRef.key} for center ${centerId}`,
      );
    }

    cache.set(`requisitions:${centerId}:${userId}`, null, 0);

    return NextResponse.json({
      success: true,
      data: {
        lowStockItems,
        autoCreated: autoCreate,
        createdRequisition,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
