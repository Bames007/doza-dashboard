// app/api/centers/[id]/hospital_pharmacy/purchases/[orderId]/receive/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/purchases/[orderId]/receive
// Method: POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
  computeStatus,
} from "@/app/lib/apiHelpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  const { id: centerId, orderId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-purchases-receive:${centerId}:${orderId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    // 1. Fetch order
    const orderRef = ref(
      db,
      `doza_centers/${centerId}/orders/pharmacy/purchases/${orderId}`,
    );
    const orderSnap = await get(orderRef);
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 },
      );
    }
    const order = orderSnap.val();
    if (order.status === "received") {
      return NextResponse.json(
        { success: false, error: "Order already received" },
        { status: 400 },
      );
    }

    // 2. Update order status
    const updatedOrder = {
      ...order,
      status: "received",
      receivedBy: request.headers.get("x-user-name") || "Unknown",
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await update(orderRef, updatedOrder);

    // 3. Process each item
    const inventoryRef = ref(db, `doza_centers/${centerId}/inventory/pharmacy`);
    const inventorySnap = await get(inventoryRef);
    const inventory = inventorySnap.exists() ? inventorySnap.val() : {};

    for (const item of order.items) {
      // Find existing drug (case‑insensitive match on name + strength + form)
      let foundKey = null;
      for (const [key, drug] of Object.entries(inventory)) {
        const d = drug as any;
        if (
          d.name?.toLowerCase() === item.drugName.toLowerCase() &&
          d.strength?.toLowerCase() === (item.strength || "").toLowerCase() &&
          d.form?.toLowerCase() === item.form.toLowerCase()
        ) {
          foundKey = key;
          break;
        }
      }

      if (foundKey) {
        const drug = inventory[foundKey];
        const newQuantity = (drug.quantity || 0) + item.quantity;
        const newStatus = computeStatus(
          newQuantity,
          drug.reorderPoint || 10,
          drug.expiryDate,
        );
        await update(
          ref(db, `doza_centers/${centerId}/inventory/pharmacy/${foundKey}`),
          {
            quantity: newQuantity,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
          },
        );
      } else {
        const newDrug = {
          name: item.drugName,
          strength: item.strength || "",
          form: item.form,
          packSize: 1,
          unit: item.unit,
          quantity: item.quantity,
          reorderPoint: 10,
          expiryDate: "",
          batchNumber: "",
          supplier: order.supplier,
          location: "",
          category: "",
          costPerUnit: item.costPerUnit,
          sellingPrice: item.costPerUnit * 1.3,
          status: "in-stock",
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        const newRef = push(
          ref(db, `doza_centers/${centerId}/inventory/pharmacy`),
        );
        await update(newRef, newDrug);
      }
    }

    // Invalidate caches
    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);
    cache.set(`hospital-pharmacy-purchases:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "receive",
      resource: "hospital-pharmacy-purchases",
      resourceId: orderId,
      details: `Received order ${order.orderNumber} and updated inventory`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({
      success: true,
      data: { id: orderId, ...updatedOrder },
      message: "Order received and inventory updated",
    });
  } catch (error) {
    return handleError(error);
  }
}
