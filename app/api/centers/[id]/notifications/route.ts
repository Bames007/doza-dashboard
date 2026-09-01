// app/api/centers/[id]/notifications/route.ts
// URL: /api/centers/[id]/notifications
// Method: GET

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ─── Type Guard ─────────────────────────────────────────────────────
function isNotification(
  value: unknown,
): value is { userId: string; [key: string]: any } {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof (value as any).userId === "string"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:notifications:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `notifications:${centerId}:${userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const refPath = `doza_centers/${centerId}/notifications`;
    const snapshot = await get(ref(db, refPath));
    const all = snapshot.exists() ? snapshot.val() : {};

    // ✅ Include notifications for this user OR for "center"
    const userNotifications: Array<{ id: string } & Record<string, any>> = [];
    for (const [id, val] of Object.entries(all)) {
      if (isNotification(val)) {
        if (val.userId === userId || val.userId === "center") {
          userNotifications.push({ id, ...val });
        }
      }
    }

    userNotifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    cache.set(cacheKey, userNotifications, 30);
    logger.info(
      { centerId, userId, count: userNotifications.length },
      "Notifications fetched",
    );
    return NextResponse.json({ success: true, data: userNotifications });
  } catch (error) {
    return handleError(error);
  }
}
