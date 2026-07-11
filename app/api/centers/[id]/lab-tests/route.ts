// app/api/centers/[id]/lab-tests/route.ts
// URL: /api/centers/[id]/lab-tests
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

// ─── Validation Schema ──────────────────────────────────────────────
const labTestCreateSchema = z.object({
  patientId: z.string().min(1, "Patient ID required"),
  patientName: z.string().optional().default(""),
  testType: z.string().min(1, "Test type required"),
  sampleType: z.string().optional().default(""),
  collectionDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString().split("T")[0]),
  orderedBy: z.string().optional(),
  orderedByName: z.string().optional(),
  panel: z.string().optional(),
});

// ─── GET: List lab tests ────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:lab-tests-list:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const cacheKey = `labTests:${centerId}:${patientId || "all"}:${status || "all"}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Lab tests from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const testsRef = ref(db, `doza_centers/${centerId}/lab_tests`);
    const snapshot = await get(testsRef);
    let tests: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      tests = Object.entries(data)
        .map(([id, item]) => ({ id, ...(item as any) }))
        .filter((item) => {
          if (patientId && item.patientId !== patientId) return false;
          if (status && item.status !== status) return false;
          return true;
        });
    }

    tests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    cache.set(cacheKey, tests, 30);
    logger.info({ centerId, count: tests.length }, "Lab tests fetched");
    return NextResponse.json({ success: true, data: tests });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST: Create lab test ──────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:lab-tests-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = labTestCreateSchema.parse(body);

    const newTest = {
      patientId: validated.patientId,
      patientName: validated.patientName || "",
      testType: validated.testType,
      sampleType: validated.sampleType || "",
      collectionDate:
        validated.collectionDate || new Date().toISOString().split("T")[0],
      status: "pending",
      orderedBy: validated.orderedBy || userId,
      orderedByName:
        validated.orderedByName ||
        request.headers.get("x-user-name") ||
        "Unknown",
      panel: validated.panel || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testsRef = ref(db, `doza_centers/${centerId}/lab_tests`);
    const newRef = push(testsRef);
    await set(newRef, newTest);

    // Invalidate caches
    cache.set(`labTests:${centerId}:all:all`, null, 0);
    cache.set(`labTests:${centerId}:${validated.patientId}:all`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "lab-test",
      resourceId: newRef.key!,
      details: `Created lab test for patient ${validated.patientName || "unknown"}: ${validated.testType}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, testId: newRef.key }, "Lab test created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newTest },
    });
  } catch (error) {
    return handleError(error);
  }
}
