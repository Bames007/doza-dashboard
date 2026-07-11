// app/api/centers/[id]/staff/route.ts
// URL: /api/centers/[id]/staff
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

const staffCreateSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(1, "Full name required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone required"),
    position: z.string().optional().default("Staff"),
  }),
  professional: z
    .object({
      role: z.string().optional().default("staff"),
      department: z.string().optional().default("general"),
      employmentType: z.string().optional().default("full-time"),
      startDate: z.string().optional(),
    })
    .optional(),
  isOwner: z.boolean().optional().default(false),
  status: z
    .enum(["active", "inactive", "suspended"])
    .optional()
    .default("active"),
});

async function getAvailableCenters(): Promise<string[]> {
  try {
    const centersRef = ref(db, "doza_centers");
    const snapshot = await get(centersRef);
    if (snapshot.exists()) {
      return Object.keys(snapshot.val());
    }
    return [];
  } catch (error) {
    logger.error({ error }, "Error getting available centers");
    return [];
  }
}

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:staff:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `staff:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Staff from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const centerRef = ref(db, `doza_centers/${centerId}`);
    const centerSnapshot = await get(centerRef);
    if (!centerSnapshot.exists()) {
      const available = await getAvailableCenters();
      logger.warn({ centerId }, "Center not found for staff fetch");
      return NextResponse.json(
        {
          success: false,
          error: `Center not found with ID: ${centerId}`,
          availableCenters: available,
        },
        { status: 404 },
      );
    }

    const staffRef = ref(db, `doza_centers/${centerId}/staff`);
    const staffSnapshot = await get(staffRef);

    let staff: any[] = [];
    if (staffSnapshot.exists()) {
      const data = staffSnapshot.val();
      staff = Object.entries(data).map(([id, item]) => ({
        id,
        staffId: id,
        ...(item as Record<string, any>),
      }));
    }

    cache.set(cacheKey, staff, 30);
    logger.info({ centerId, count: staff.length }, "Staff fetched");
    return NextResponse.json({ success: true, data: staff });
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

    const rateKey = `${userId}:staff-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const centerRef = ref(db, `doza_centers/${centerId}`);
    const centerSnapshot = await get(centerRef);
    if (!centerSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: `Center not found with ID: ${centerId}` },
        { status: 404 },
      );
    }

    const body = await request.json();
    const validated = staffCreateSchema.parse(body);

    const centerData = centerSnapshot.val();
    const centerPrefix =
      centerData.centerId?.split("-")[1]?.substring(0, 4) || "STAF";
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const staffId = `STAFF-${centerPrefix}-${timestamp}-${randomNum}`;

    const currentTime = new Date().toISOString();

    const staffData = {
      staffId,
      personalInfo: {
        fullName: validated.personalInfo.fullName.trim(),
        email: validated.personalInfo.email.trim().toLowerCase(),
        phone: validated.personalInfo.phone.trim(),
        position: validated.personalInfo.position?.trim() || "Staff",
      },
      professional: {
        role: validated.professional?.role?.trim() || "staff",
        department: validated.professional?.department?.trim() || "general",
        employmentType: validated.professional?.employmentType || "full-time",
        startDate: validated.professional?.startDate || currentTime,
      },
      isOwner: validated.isOwner || false,
      status: validated.status || "active",
      createdAt: currentTime,
      joinedAt: currentTime,
      lastUpdated: currentTime,
    };

    const staffRef = ref(db, `doza_centers/${centerId}/staff`);
    const newRef = push(staffRef);
    await update(newRef, staffData);

    cache.set(`staff:${centerId}`, null, 0);

    await writeAuditLog({
      centerId,
      userId,
      userName:
        request.headers.get("x-user-name") ||
        validated.personalInfo.fullName ||
        "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "staff",
      resourceId: newRef.key!,
      details: `Created staff: ${validated.personalInfo.fullName}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      {
        centerId,
        staffId: newRef.key,
        fullName: validated.personalInfo.fullName,
      },
      "Staff created",
    );
    return NextResponse.json({
      success: true,
      data: { id: newRef.key, ...staffData },
    });
  } catch (error) {
    return handleError(error);
  }
}
