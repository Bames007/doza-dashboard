// app/api/centers/[id]/audit-logs/route.ts
// URL: /api/centers/[id]/audit-logs
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { getClientIp } from "@/app/lib/auditLogger";
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

    const rateKey = `${userId}:audit-logs:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const resource = searchParams.get("resource") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const cacheKey = `auditLogs:${centerId}:${page}:${limit}:${search}:${action}:${resource}:${status}:${dateFrom}:${dateTo}`;
    const cached = cache.get<{ logs: any[]; total: number }>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Audit logs from cache");
      return NextResponse.json({
        success: true,
        logs: cached.logs,
        total: cached.total,
        page,
        limit,
      });
    }

    const auditRef = ref(db, `doza_centers/${centerId}/auditLogs`);
    const snapshot = await get(auditRef);
    let logs: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      logs = Object.entries(data)
        .map(([id, entry]) => ({ id, ...(entry as any) }))
        .filter((entry) => {
          if (search) {
            const s = search.toLowerCase();
            const matches =
              entry.userName?.toLowerCase().includes(s) ||
              entry.action?.toLowerCase().includes(s) ||
              entry.resource?.toLowerCase().includes(s) ||
              entry.details?.toLowerCase().includes(s);
            if (!matches) return false;
          }
          if (action && entry.action !== action) return false;
          if (resource && entry.resource !== resource) return false;
          if (status && entry.status !== status) return false;
          if (dateFrom) {
            const from = new Date(dateFrom);
            const ts = new Date(entry.timestamp);
            if (ts < from) return false;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            const ts = new Date(entry.timestamp);
            if (ts > to) return false;
          }
          return true;
        });
    }

    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const total = logs.length;
    const start = (page - 1) * limit;
    const paginated = logs.slice(start, start + limit);

    cache.set(cacheKey, { logs: paginated, total }, 30);
    logger.info(
      { centerId, count: paginated.length, total },
      "Audit logs fetched",
    );

    return NextResponse.json({
      success: true,
      logs: paginated,
      total,
      page,
      limit,
    });
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

    const body = await request.json();
    const { action, resource, resourceId, details, userName, userRole } = body;

    const auditEntry = {
      userId,
      userName: userName || "Unknown",
      userRole: userRole || "unknown",
      centerId,
      action,
      resource,
      resourceId,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
      status: "success",
    };

    const refPath = ref(db, `doza_centers/${centerId}/auditLogs`);
    const newRef = push(refPath);
    await set(newRef, auditEntry);

    cache.set(`auditLogs:${centerId}:*`, null, 0);

    logger.info({ centerId, userId, action }, "Audit log created");
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
