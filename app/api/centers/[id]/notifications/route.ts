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
    type Notification = {
      id: string;
      createdAt?: string | number;
      [k: string]: any;
    };

    const userNotifications: Notification[] = Object.entries(
      all as Record<string, unknown>,
    )
      .filter(([, val]) => {
        if (!val || typeof val !== "object") return false;
        return (val as { userId?: string }).userId === userId;
      })
      .map(([id, val]) => ({
        id,
        ...(val as Record<string, any>),
      }));

    userNotifications.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    cache.set(cacheKey, userNotifications, 30);
    logger.info(
      `Fetched ${userNotifications.length} notifications for user ${userId}`,
    );
    return NextResponse.json({ success: true, data: userNotifications });
  } catch (error) {
    return handleError(error);
  }
}
