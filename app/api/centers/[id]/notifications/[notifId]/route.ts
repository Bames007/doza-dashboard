// app/api/centers/[id]/notifications/[notifId]/route.ts
// URL: /api/centers/[id]/notifications/[notifId]
// Method: PATCH

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; notifId: string }> },
) {
  const { id: centerId, notifId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:notification-read:${centerId}:${notifId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const refPath = `doza_centers/${centerId}/notifications/${notifId}`;
    const snapshot = await get(ref(db, refPath));
    if (!snapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 },
      );
    }
    const old = snapshot.val();
    if (old.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 },
      );
    }
    await update(ref(db, refPath), { read: true });

    cache.set(`notifications:${centerId}:${userId}`, null, 0);
    logger.info(`Notification ${notifId} marked as read by ${userId}`);
    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    return handleError(error);
  }
}
