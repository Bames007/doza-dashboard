// app/api/centers/[id]/appointments/route.ts
// URL: /api/centers/[id]/appointments
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { appointmentCreateSchema } from "@/app/lib/validation";
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

    const rateKey = `${userId}:appointments-list:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const patientId = searchParams.get("patientId") || "";

    const cacheKey = `appointments:${centerId}:${date}:${status}:${patientId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Appointments from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const appointmentsRef = ref(db, `doza_centers/${centerId}/appointments`);
    const snapshot = await get(appointmentsRef);
    let appointments = snapshot.exists() ? snapshot.val() : {};
    let list = Object.entries(appointments).map(([id, data]) => ({
      id,
      ...(data as object),
    }));

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      list = list.filter((a: any) => {
        const s = new Date(a.startTime);
        return s >= start && s <= end;
      });
    }
    if (status) list = list.filter((a: any) => a.status === status);
    if (patientId) list = list.filter((a: any) => a.patientId === patientId);

    cache.set(cacheKey, list, 30);
    logger.info({ centerId, count: list.length }, "Appointments fetched");
    return NextResponse.json({ success: true, data: list });
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

    const rateKey = `${userId}:create-appointment:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = appointmentCreateSchema.parse(body);

    const newAppointment = {
      ...validated,
      status: "scheduled",
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const appointmentsRef = ref(db, `doza_centers/${centerId}/appointments`);
    const newRef = push(appointmentsRef);
    await set(newRef, newAppointment);

    // Invalidate caches
    cache.set(`appointments:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "appointment",
      resourceId: newRef.key!,
      details: `Created appointment for patient ${validated.patientName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, appointmentId: newRef.key }, "Appointment created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newAppointment },
    });
  } catch (error) {
    return handleError(error);
  }
}
