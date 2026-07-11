// app/api/centers/[id]/lab-tests/[testId]/route.ts
// URL: /api/centers/[id]/lab-tests/[testId]
// Methods: GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove } from "firebase/database";
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

const labTestUpdateSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "rejected"]).optional(),
  result: z
    .object({
      value: z.union([z.string(), z.number()]).optional().nullable(),
      unit: z.string().optional().nullable(),
      referenceRange: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      concludedByName: z.string().optional().nullable(),
    })
    .optional(),
});

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> },
) {
  const { id: centerId, testId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:lab-test:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `labTest:${centerId}:${testId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, testId }, "Lab test from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const testRef = ref(db, `doza_centers/${centerId}/lab_tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Lab test not found");
      return NextResponse.json(
        { success: false, error: "Lab test not found" },
        { status: 404 },
      );
    }

    const data = { id: testId, ...snapshot.val() };
    cache.set(cacheKey, data, 30);
    logger.info({ centerId, testId }, "Lab test fetched");
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> },
) {
  const { id: centerId, testId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:lab-test-update:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = labTestUpdateSchema.parse(body);

    const testRef = ref(db, `doza_centers/${centerId}/lab_tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Lab test not found for update");
      return NextResponse.json(
        { success: false, error: "Lab test not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();

    const updates: any = { ...validated, updatedAt: new Date().toISOString() };
    if (validated.result) {
      updates.result = {
        ...validated.result,
        concludedBy: userId,
        concludedAt: new Date().toISOString(),
      };
    }

    await update(testRef, updates);

    cache.set(`labTest:${centerId}:${testId}`, null, 0);
    cache.set(`labTests:${centerId}:all:all`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "lab-test",
      resourceId: testId,
      details: `Updated lab test for patient ${oldData.patientName || "unknown"} (status: ${validated.status || "unchanged"})`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    const updatedSnapshot = await get(testRef);
    logger.info({ centerId, testId }, "Lab test updated");
    return NextResponse.json({
      success: true,
      data: { id: testId, ...updatedSnapshot.val() },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> },
) {
  const { id: centerId, testId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:lab-test-delete:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const testRef = ref(db, `doza_centers/${centerId}/lab_tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Lab test not found for deletion");
      return NextResponse.json(
        { success: false, error: "Lab test not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();

    await remove(testRef);

    cache.set(`labTest:${centerId}:${testId}`, null, 0);
    cache.set(`labTests:${centerId}:all:all`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "lab-test",
      resourceId: testId,
      details: `Deleted lab test for patient ${oldData.patientName || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, testId }, "Lab test deleted");
    return NextResponse.json({ success: true, message: "Lab test deleted" });
  } catch (error) {
    return handleError(error);
  }
}
