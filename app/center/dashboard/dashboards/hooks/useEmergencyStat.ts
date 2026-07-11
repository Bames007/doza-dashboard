// app/center/dashboard/dashboards/hooks/useEmergencyStats.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string =>
  !!id && id !== "undefined" && id !== "null";

export function useEmergencyStats(centerId?: string, userId?: string) {
  const [emergency, setEmergency] = useState({
    avgWaitTime: 0,
    patientsWaiting: 0,
    patients: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/centers/${centerId}/emergency/stats`, {
        userId,
      });
      setEmergency(
        data || { avgWaitTime: 0, patientsWaiting: 0, patients: [] },
      );
    } catch (err: any) {
      setError(err.message || "Failed to load emergency stats");
      setEmergency({ avgWaitTime: 0, patientsWaiting: 0, patients: [] });
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { emergency, loading, error, refetch: fetchStats };
}
