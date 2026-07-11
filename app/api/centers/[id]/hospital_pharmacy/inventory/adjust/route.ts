// app/api/centers/[id]/hospital_pharmacy/inventory/adjust/route.ts
// URL: /api/centers/[id]/hospital_pharmacy/inventory/adjust
// Method: POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
  computeStatus,
} from "@/app/lib/apiHelpers";

const adjustSchema = z.object({
  drugId: z.string().min(1),
  delta: z.number().int().min(-100000).max(100000),
  note: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:hospital-pharmacy-inventory-adjust:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { drugId, delta, note } = adjustSchema.parse(body);

    const refPath = `doza_centers/${centerId}/inventory/pharmacy/${drugId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const newQuantity = Math.max(0, oldData.quantity + delta);
    const newStatus = computeStatus(
      newQuantity,
      oldData.reorderPoint,
      oldData.expiryDate,
    );

    const updateData = {
      quantity: newQuantity,
      status: newStatus,
      lastUpdated: new Date().toISOString(),
    };
    await update(ref(db, refPath), updateData);

    const updated = { id: drugId, ...oldData, ...updateData };
    cache.set(`hospital-pharmacy-inventory:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "hospital-pharmacy-inventory",
      resourceId: drugId,
      details: `Adjusted stock by ${delta} (${note || "no note"})`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleError(error);
  }
}
