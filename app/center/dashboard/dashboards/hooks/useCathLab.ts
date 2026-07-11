// app/center/dashboard/dashboards/hooks/useCathLab.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export interface CathLabData {
  total: number;
  inUse: number;
  available: number;
  nextCase?: string;
  procedures: Array<{
    id: string;
    patient: string;
    procedure: string;
    startTime: string;
    labNumber: string;
    status: "scheduled" | "in-progress" | "completed";
  }>;
}

export function useCathLab(centerId?: string, userId?: string) {
  const [cathLab, setCathLab] = useState<CathLabData>({
    total: 0,
    inUse: 0,
    available: 0,
    procedures: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchCathLab = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/cardiac/cathlab`,
          { userId },
        );
        setCathLab(
          data || { total: 0, inUse: 0, available: 0, procedures: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load cath lab data");
        setCathLab({ total: 0, inUse: 0, available: 0, procedures: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchCathLab();
  }, [centerId, userId]);

  return { cathLab, loading, error };
}
