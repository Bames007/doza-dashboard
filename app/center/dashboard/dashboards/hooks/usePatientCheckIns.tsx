// app/center/dashboard/dashboards/hooks/usePatientCheckIns.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "@/app/lib/api";
import logger from "@/app/utils/logger";

const isValidId = (id?: string): id is string => !!id && id !== "undefined";

export interface PatientCheckInsData {
  current: number;
  waiting: number;
  avgWaitTime: number;
  list: Array<{
    id: string;
    name: string;
    checkInTime: string;
    waitTime: number;
  }>;
}

export function usePatientCheckIns(centerId?: string, userId?: string) {
  const [checkIns, setCheckIns] = useState<PatientCheckInsData>({
    current: 0,
    waiting: 0,
    avgWaitTime: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCheckIns = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/patients/checkins`,
        {
          userId,
          signal: controller.signal,
        },
      );
      setCheckIns(data || { current: 0, waiting: 0, avgWaitTime: 0, list: [] });
      logger.debug({ centerId }, "Patient check-ins fetched");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to load check-ins");
      logger.error("usePatientCheckIns error", err);
    } finally {
      setLoading(false);
      if (abortControllerRef.current === controller)
        abortControllerRef.current = null;
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchCheckIns();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchCheckIns]);

  const refetch = useCallback(() => fetchCheckIns(), [fetchCheckIns]);
  return { checkIns, loading, error, refetch };
}
