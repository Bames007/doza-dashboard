// app/api/centers/[id]/services/route.ts
// URL: /api/centers/[id]/services
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { serviceSchema } from "@/app/lib/validation";
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

    const rateKey = `${userId}:services:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const cacheKey = `services:${centerId}:${category || "all"}:${includeInactive}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId, category }, "Services from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const servicesRef = ref(db, `doza_centers/${centerId}/services`);
    const snapshot = await get(servicesRef);
    let services: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      services = Object.entries(data)
        .map(([id, item]) => ({ id, ...(item as any) }))
        .filter((item) => {
          if (!includeInactive && item.isActive === false) return false;
          if (category && item.category !== category) return false;
          return true;
        });
    }

    services.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    cache.set(cacheKey, services, 30);
    logger.info({ centerId, count: services.length }, "Services fetched");
    return NextResponse.json({ success: true, data: services });
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

    const rateKey = `${userId}:service-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = serviceSchema.parse(body);

    const newService = {
      ...validated,
      isActive: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const servicesRef = ref(db, `doza_centers/${centerId}/services`);
    const newRef = push(servicesRef);
    await update(newRef, newService);

    cache.set(`services:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "service",
      resourceId: newRef.key!,
      details: `Created service: ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, serviceId: newRef.key }, "Service created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newService },
    });
  } catch (error) {
    return handleError(error);
  }
}
