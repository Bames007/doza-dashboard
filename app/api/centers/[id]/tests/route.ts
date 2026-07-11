// app/api/centers/[id]/tests/route.ts
// URL: /api/centers/[id]/tests
// Methods: GET, POST

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, update } from "firebase/database";
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

const testSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  duration: z.number().min(0, "Duration must be 0 or greater").optional(),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  sampleType: z.string().optional().default(""),
  preparationInstructions: z.string().optional().default(""),
  isActive: z.boolean().optional().default(true),
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

    const rateKey = `${userId}:tests:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const cacheKey = `tests:${centerId}:${category || "all"}:${includeInactive}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId, category }, "Tests from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const testsRef = ref(db, `doza_centers/${centerId}/tests`);
    const snapshot = await get(testsRef);
    let tests: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      tests = Object.entries(data)
        .map(([id, item]) => ({ id, ...(item as any) }))
        .filter((item) => {
          if (!includeInactive && item.isActive === false) return false;
          if (category && item.category !== category) return false;
          return true;
        });
    }

    tests.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    cache.set(cacheKey, tests, 30);
    logger.info({ centerId, count: tests.length }, "Tests fetched");
    return NextResponse.json({ success: true, data: tests });
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

    const rateKey = `${userId}:test-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = testSchema.parse(body);

    const newTest = {
      ...validated,
      isActive: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const testsRef = ref(db, `doza_centers/${centerId}/tests`);
    const newRef = push(testsRef);
    await update(newRef, newTest);

    cache.set(`tests:${centerId}:all:true`, null, 0);
    cache.set(`tests:${centerId}:all:false`, null, 0);
    cache.set(`tests:${centerId}:${validated.category}:true`, null, 0);
    cache.set(`tests:${centerId}:${validated.category}:false`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "test",
      resourceId: newRef.key!,
      details: `Created test: ${validated.name}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId, testId: newRef.key }, "Test created");
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...newTest },
    });
  } catch (error) {
    return handleError(error);
  }
}
