// app/api/centers/[id]/facilities/route.ts
// URL: /api/centers/[id]/facilities
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { facilitySchema } from "@/app/lib/validation";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:facilities:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const cacheKey = `facilities:${centerId}:${type || "all"}:${includeInactive}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId, type }, "Facilities from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const facilitiesRef = ref(db, `doza_centers/${centerId}/facilities`);
    const snapshot = await get(facilitiesRef);
    let facilities: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      facilities = Object.entries(data)
        .map(([id, item]) => ({ id, ...(item as any) }))
        .filter((item) => {
          if (!includeInactive && item.isActive === false) return false;
          if (type && item.type !== type) return false;
          return true;
        });
    }

    facilities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    cache.set(cacheKey, facilities, 30);
    logger.info({ centerId, count: facilities.length }, "Facilities fetched");
    return NextResponse.json({ success: true, data: facilities });
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

    const rateKey = `${userId}:facility-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = facilitySchema.parse(body);

    const newFacility = {
      ...validated,
      isActive: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const facilitiesRef = ref(db, `doza_centers/${centerId}/facilities`);
    const newRef = push(facilitiesRef);
    await update(newRef, newFacility);

    // Invalidate all facility caches for this center
    cache.set(`facilities:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "facility",
      resourceId: newRef.key!,
      details: `Created facility: ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, facilityId: newRef.key }, "Facility created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newFacility },
    });
  } catch (error) {
    return handleError(error);
  }
}
