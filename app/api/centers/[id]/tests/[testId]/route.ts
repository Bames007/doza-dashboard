// app/api/centers/[id]/tests/[testId]/route.ts
// URL: /api/centers/[id]/tests/[testId]
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

const testUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  sampleType: z.string().optional(),
  preparationInstructions: z.string().optional(),
  isActive: z.boolean().optional(),
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

    const rateKey = `${userId}:test:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `test:${centerId}:${testId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, testId }, "Test from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const testRef = ref(db, `doza_centers/${centerId}/tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Test not found");
      return NextResponse.json(
        { success: false, error: "Test not found" },
        { status: 404 },
      );
    }

    const data = { id: testId, ...snapshot.val() };
    cache.set(cacheKey, data, 30);
    logger.info({ centerId, testId }, "Test fetched");
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

    const rateKey = `${userId}:test-put:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = testUpdateSchema.parse(body);

    const testRef = ref(db, `doza_centers/${centerId}/tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Test not found for update");
      return NextResponse.json(
        { success: false, error: "Test not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    const updates = { ...validated, updatedAt: new Date().toISOString() };
    await update(testRef, updates);

    cache.set(`test:${centerId}:${testId}`, null, 0);
    cache.set(`tests:${centerId}:*`, null, 0);

    const updatedSnapshot = await get(testRef);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "test",
      resourceId: testId,
      details: `Updated test: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, testId }, "Test updated");
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

    const rateKey = `${userId}:test-delete:${centerId}:${testId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const testRef = ref(db, `doza_centers/${centerId}/tests/${testId}`);
    const snapshot = await get(testRef);
    if (!snapshot.exists()) {
      logger.warn({ centerId, testId }, "Test not found for deletion");
      return NextResponse.json(
        { success: false, error: "Test not found" },
        { status: 404 },
      );
    }

    const oldData = snapshot.val();
    await remove(testRef);

    cache.set(`test:${centerId}:${testId}`, null, 0);
    cache.set(`tests:${centerId}:*`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "delete",
      resource: "test",
      resourceId: testId,
      details: `Deleted test: ${oldData.name || "unknown"}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, testId }, "Test deleted");
    return NextResponse.json({ success: true, message: "Test deleted" });
  } catch (error) {
    return handleError(error);
  }
}
