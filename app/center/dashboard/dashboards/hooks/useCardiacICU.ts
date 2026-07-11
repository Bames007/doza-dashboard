// app/center/dashboard/dashboards/hooks/useCardiacICU.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export interface CardiacICUData {
  total: number;
  occupied: number;
  ventilated: number;
  available: number;
  patients: Array<{
    id: string;
    name: string;
    bed: string;
    ventilator: boolean;
    admitTime: string;
    condition: "stable" | "critical" | "recovering";
  }>;
}

export function useCardiacICU(centerId?: string, userId?: string) {
  const [icu, setIcu] = useState<CardiacICUData>({
    total: 0,
    occupied: 0,
    ventilated: 0,
    available: 0,
    patients: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchIcu = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/cardiac/icu`, {
          userId,
        });
        setIcu(
          data || {
            total: 0,
            occupied: 0,
            ventilated: 0,
            available: 0,
            patients: [],
          },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load cardiac ICU data");
        setIcu({
          total: 0,
          occupied: 0,
          ventilated: 0,
          available: 0,
          patients: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIcu();
  }, [centerId, userId]);

  return { icu, loading, error };
}
