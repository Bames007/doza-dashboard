// app/api/centers/[id]/quality-control/route.ts
// URL: /api/centers/[id]/quality-control
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
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

const qcCreateSchema = z.object({
  testType: z.string().min(1, "Test type required"),
  controlName: z.string().min(1, "Control name required"),
  lotNumber: z.string().min(1, "Lot number required"),
  expiryDate: z.string().nullable().optional(),
  instrument: z.string().nullable().optional(),
  operator: z.string().nullable().optional(),
  performedAt: z.string().min(1, "Performed at date required"),
  result: z.string().min(1, "Result required"),
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:qc-records:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `qcRecords:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "QC records from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const qcRef = ref(db, `doza_centers/${centerId}/quality_controls`);
    const snapshot = await get(qcRef);
    let records: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      records = Object.entries(data).map(([id, item]) => ({
        id,
        ...(item as any),
      }));
    }

    cache.set(cacheKey, records, 30);
    logger.info({ centerId, count: records.length }, "QC records fetched");
    return NextResponse.json({ success: true, data: records });
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

    const rateKey = `${userId}:qc-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = qcCreateSchema.parse(body);

    const newRecord = {
      ...validated,
      performedBy: userId,
      createdAt: new Date().toISOString(),
    };

    const qcRef = ref(db, `doza_centers/${centerId}/quality_controls`);
    const newRef = push(qcRef);
    await set(newRef, newRecord);

    cache.set(`qcRecords:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "quality-control",
      resourceId: newRef.key!,
      details: `Created QC record: ${validated.testType} (${validated.controlName})`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, recordId: newRef.key }, "QC record created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newRecord },
    });
  } catch (error) {
    return handleError(error);
  }
}
