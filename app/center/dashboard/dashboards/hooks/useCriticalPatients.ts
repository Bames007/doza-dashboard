// app/center/dashboard/dashboards/hooks/useCriticalPatients.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string =>
  !!id && id !== "undefined" && id !== "null";

export interface CriticalPatientsData {
  count: number;
  icuRequired: number;
  list: Array<{
    id: string;
    name: string;
    age: number;
    gender: string;
    condition: string;
    vitalSigns: {
      bp: string;
      hr: number;
      rr: number;
      o2sat: number;
    };
    arrivalTime: string;
    needICU: boolean;
    needVentilator: boolean;
  }>;
}

export function useCriticalPatients(centerId?: string, userId?: string) {
  const [critical, setCritical] = useState<CriticalPatientsData>({
    count: 0,
    icuRequired: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCritical = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/emergency/critical`,
        { userId },
      );
      setCritical(data || { count: 0, icuRequired: 0, list: [] });
    } catch (err: any) {
      setError(err.message || "Failed to load critical patients");
      setCritical({ count: 0, icuRequired: 0, list: [] });
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchCritical();
  }, [fetchCritical]);

  return { critical, loading, error, refetch: fetchCritical };
}
