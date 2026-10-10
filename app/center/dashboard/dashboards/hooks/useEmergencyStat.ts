// app/center/dashboard/dashboards/hooks/useEmergencyStats.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string =>
  !!id && id !== "undefined" && id !== "null";

export interface EmergencyPatient {
  id: string;
  name: string;
  chiefComplaint?: string;
  acuity?: "high" | "medium" | "low" | string;
  waitTime?: number;
}

export interface AmbulanceArrival {
  id: string;
  provider: string;
  eta: string;
  patientName?: string;
  chiefComplaint?: string;
  priority: "high" | "medium" | "low";
}

export interface EmergencyStats {
  avgWaitTime: number;
  patientsWaiting: number;
  patients: EmergencyPatient[];
  arrivals: AmbulanceArrival[];
}

const EMPTY_STATS: EmergencyStats = {
  avgWaitTime: 0,
  patientsWaiting: 0,
  patients: [],
  arrivals: [],
};

export function useEmergencyStats(centerId?: string, userId?: string) {
  const [emergency, setEmergency] = useState<EmergencyStats>(EMPTY_STATS);
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

      // Normalize — always return every field, even if the API omits it
      setEmergency({
        avgWaitTime: data?.avgWaitTime ?? 0,
        patientsWaiting: data?.patientsWaiting ?? 0,
        patients: Array.isArray(data?.patients) ? data.patients : [],
        arrivals: Array.isArray(data?.arrivals) ? data.arrivals : [],
      });
    } catch (err: any) {
      setError(err.message || "Failed to load emergency stats");
      setEmergency(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { emergency, loading, error, refetch: fetchStats };
}
