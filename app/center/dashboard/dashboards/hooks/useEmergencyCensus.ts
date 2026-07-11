// app/center/dashboard/dashboards/hooks/useEmergencyCensus.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string =>
  !!id && id !== "undefined" && id !== "null";

export interface EmergencyCensusData {
  current: number;
  capacity: number;
  waiting: number;
  boarding: number;
  avgWaitTime: number;
  waitTimeChange: number;
  patients: Array<{
    id: string;
    name: string;
    acuity: "1" | "2" | "3" | "4" | "5";
    chiefComplaint: string;
    arrivalTime: string;
    waitTime: number;
    bedAssigned?: string;
  }>;
}

export function useEmergencyCensus(centerId?: string, userId?: string) {
  const [census, setCensus] = useState<EmergencyCensusData>({
    current: 0,
    capacity: 0,
    waiting: 0,
    boarding: 0,
    avgWaitTime: 0,
    waitTimeChange: 0,
    patients: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCensus = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/centers/${centerId}/emergency/census`, {
        userId,
      });
      setCensus(
        data || {
          current: 0,
          capacity: 0,
          waiting: 0,
          boarding: 0,
          avgWaitTime: 0,
          waitTimeChange: 0,
          patients: [],
        },
      );
    } catch (err: any) {
      setError(err.message || "Failed to load emergency census");
      setCensus({
        current: 0,
        capacity: 0,
        waiting: 0,
        boarding: 0,
        avgWaitTime: 0,
        waitTimeChange: 0,
        patients: [],
      });
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchCensus();
  }, [fetchCensus]);

  return { census, loading, error, refetch: fetchCensus };
}
