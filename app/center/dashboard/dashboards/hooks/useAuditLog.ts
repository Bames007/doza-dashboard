// app/center/dashboard/hooks/useAuditLog.ts
"use client";

import { useCallback } from "react";
import logger from "@/app/utils/logger";
import { useDashboard } from "../../DashboardContext";

// Utility to validate a non‑empty, non‑"undefined" ID
const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export function useAuditLog() {
  const { user, center } = useDashboard();

  const logAction = useCallback(
    async (
      action: string,
      resource: string,
      resourceId: string,
      details: string,
    ) => {
      if (!isValidId(center?.id) || !isValidId(user?.id)) {
        logger.warn("Cannot log audit: missing or invalid center/user");
        return;
      }
      try {
        await fetch(`/api/centers/${center.id}/audit-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({
            action,
            resource,
            resourceId,
            details,
            userName: user.fullName,
            userRole: user.role,
          }),
        });
      } catch (err) {
        logger.error(err, "Failed to log audit");
      }
    },
    [center?.id, user],
  );

  return { logAction };
}
