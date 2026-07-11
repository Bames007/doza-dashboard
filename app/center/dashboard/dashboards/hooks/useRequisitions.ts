// app/center/dashboards/hooks/useRequisitions.ts

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";
import { useDashboard } from "../../DashboardContext";
import logger from "@/app/utils/logger";

export function useRequisitions(centerId?: string) {
  const { user } = useDashboard();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = {
    "x-user-name": user?.fullName || "Unknown",
    "x-user-role": user?.role || "staff",
  };

  const refetch = useCallback(async () => {
    if (!centerId || !user?.id) {
      setLoading(false);
      setRequisitions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/api/centers/${centerId}/requisitions`, {
        userId: user.id,
        headers: authHeaders,
        cacheKey: `requisitions_${centerId}_${user.id}`,
        cacheDuration: 30 * 1000,
      });

      logger.info(
        {
          centerId,
          userId: user.id,
          count: data?.length || 0,
        },
        "Requisitions fetched",
      );

      setRequisitions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch requisitions");
      logger.error(err, "useRequisitions fetch error");
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  }, [centerId, user?.id, user?.fullName, user?.role]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createRequisition = async (payload: any) => {
    return apiPost(`/api/centers/${centerId}/requisitions`, payload, {
      userId: user.id,
      headers: authHeaders,
    });
  };

  const updateRequisition = async (id: string, payload: any) => {
    return apiPut(`/api/centers/${centerId}/requisitions/${id}`, payload, {
      userId: user.id,
      headers: authHeaders,
    });
  };

  const deleteRequisition = async (id: string) => {
    return apiDelete(`/api/centers/${centerId}/requisitions/${id}`, {
      userId: user.id,
      headers: authHeaders,
    });
  };

  const approve = async (id: string, comment?: string) => {
    return apiPost(
      `/api/centers/${centerId}/requisitions/${id}/approve`,
      { decision: "approve", comment },
      { userId: user.id, headers: authHeaders },
    );
  };

  const reject = async (id: string, comment: string) => {
    return apiPost(
      `/api/centers/${centerId}/requisitions/${id}/approve`,
      { decision: "reject", comment },
      { userId: user.id, headers: authHeaders },
    );
  };

  const fulfill = async (id: string, fulfilledBy?: string, notes?: string) => {
    return apiPost(
      `/api/centers/${centerId}/requisitions/${id}/fulfill`,
      { fulfilledBy, notes },
      { userId: user.id, headers: authHeaders },
    );
  };

  const escalate = async (
    id: string,
    targetUserId: string,
    comment?: string,
  ) => {
    return apiPost(
      `/api/centers/${centerId}/requisitions/${id}/escalate`,
      { targetUserId, comment },
      { userId: user.id, headers: authHeaders },
    );
  };

  return {
    requisitions,
    loading,
    error,
    refetch,
    createRequisition,
    updateRequisition,
    deleteRequisition,
    approve,
    reject,
    fulfill,
    escalate,
  };
}
