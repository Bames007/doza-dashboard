// app/api/centers/[id]/operating-hours/route.ts
// URL: /api/centers/[id]/operating-hours
// Method: PUT

import { NextRequest, NextResponse } from "next/server";
import { ref, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

const operatingHoursSchema = z
  .object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
    holidays: z.array(z.string()).optional(),
  })
  .passthrough();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:operating-hours:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const validated = operatingHoursSchema.parse(body);

    const centerRef = ref(db, `doza_centers/${centerId}`);
    await update(centerRef, {
      operatingHours: validated,
      updatedAt: new Date().toISOString(),
    });

    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "operating-hours",
      resourceId: centerId,
      details: "Updated operating hours",
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info({ centerId }, "Operating hours updated");
    return NextResponse.json({
      success: true,
      data: validated,
    });
  } catch (error) {
    return handleError(error);
  }
}
