// app/lib/auditLogger.ts

import { ref, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { NextRequest } from "next/server";

export interface AuditLogParams {
  centerId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  status: "success" | "failure";
  ipAddress?: string;
  userAgent?: string;
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const {
      centerId,
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details,
      status,
      ipAddress,
      userAgent,
    } = params;

    const auditEntry = {
      userId,
      userName,
      userRole,
      centerId,
      action,
      resource,
      resourceId: resourceId || "",
      details,
      status,
      timestamp: new Date().toISOString(),
      ipAddress: ipAddress || "unknown",
      userAgent: userAgent || "unknown",
    };

    const auditRef = ref(db, `doza_centers/${centerId}/auditLogs`);
    const newRef = push(auditRef);
    await set(newRef, auditEntry);
    logger.debug({ centerId, userId, action, status }, "Audit log written");
  } catch (error) {
    // Never let audit logging break the main operation.
    logger.error({ error }, "Failed to write audit log");
  }
}
