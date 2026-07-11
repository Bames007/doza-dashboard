// app/center/dashboard/dashboards/hooks/useTreatments.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface TreatmentsData {
  active: number;
  completedToday: number;
  avgDaily: number;
  list: Array<{
    id: string;
    patient: string;
    procedure: string;
    tooth?: string;
    startTime: string;
    status: "in-progress" | "scheduled" | "completed";
    dentist: string;
  }>;
}

export function useTreatments(centerId?: string, userId?: string) {
  const [treatments, setTreatments] = useState<TreatmentsData>({
    active: 0,
    completedToday: 0,
    avgDaily: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchTreatments = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/dental/treatments`,
          { userId },
        );
        setTreatments(
          data || { active: 0, completedToday: 0, avgDaily: 0, list: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load treatments");
        setTreatments({ active: 0, completedToday: 0, avgDaily: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchTreatments();
  }, [centerId, userId]);

  return { treatments, loading, error };
}
