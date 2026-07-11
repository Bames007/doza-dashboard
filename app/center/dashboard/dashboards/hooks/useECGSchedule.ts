// app/center/dashboard/dashboards/hooks/useECGSchedule.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export interface ECGScheduleData {
  waiting: number;
  avgWaitTime: number;
  queue: Array<{
    id: string;
    patient: string;
    orderedAt: string;
    priority: "routine" | "urgent";
  }>;
}

export function useECGSchedule(centerId?: string, userId?: string) {
  const [ecg, setEcg] = useState<ECGScheduleData>({
    waiting: 0,
    avgWaitTime: 0,
    queue: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchECG = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/cardiac/ecg`, {
          userId,
        });
        setEcg(data || { waiting: 0, avgWaitTime: 0, queue: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load ECG schedule");
        setEcg({ waiting: 0, avgWaitTime: 0, queue: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchECG();
  }, [centerId, userId]);

  return { ecg, loading, error };
}
