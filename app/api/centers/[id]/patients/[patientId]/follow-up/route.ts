import { NextRequest, NextResponse } from "next/server";
import { ref, push, set, get } from "firebase/database";
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
} from "@/app/lib/apiHelpers";

const followUpSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  reason: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  createdBy: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:followup:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = followUpSchema.parse(body);

    const followUpRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}/followUpAppointments`,
    );
    const newRef = push(followUpRef);
    await set(newRef, {
      ...validated,
      createdAt: new Date().toISOString(),
      status: "scheduled",
    });

    cache.set(`followups:${centerId}:${patientId}`, null, 0);
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "follow-up-appointment",
      resourceId: newRef.key!,
      details: `Scheduled follow‑up for patient ${patientId} on ${validated.date}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, patientId, date: validated.date },
      "Follow‑up scheduled",
    );
    return NextResponse.json({ success: true, message: "Follow‑up scheduled" });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:followups:${centerId}:${patientId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `followups:${centerId}:${patientId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const followUpRef = ref(
      db,
      `doza_centers/${centerId}/patients/${patientId}/followUpAppointments`,
    );
    const snapshot = await get(followUpRef);
    let data: any[] = [];
    if (snapshot.exists()) {
      data = Object.entries(snapshot.val()).map(([id, val]) => ({
        id,
        ...(val as any),
      }));
      data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }
    cache.set(cacheKey, data, 30);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}
