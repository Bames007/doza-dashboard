// app/center/dashboard/dashboards/hooks/useProcedures.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface ProceduresData {
  today: number;
  completed: number;
  scheduled: number;
  list: Array<{
    id: string;
    patient: string;
    procedure: string;
    time: string;
    status: "scheduled" | "in-progress" | "completed" | "cancelled";
  }>;
}

export function useProcedures(centerId?: string, userId?: string) {
  const [procedures, setProcedures] = useState<ProceduresData>({
    today: 0,
    completed: 0,
    scheduled: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchProcedures = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/procedures/today`,
          { userId },
        );
        setProcedures(
          data || { today: 0, completed: 0, scheduled: 0, list: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load procedures");
        setProcedures({ today: 0, completed: 0, scheduled: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchProcedures();
  }, [centerId, userId]);

  return { procedures, loading, error };
}
