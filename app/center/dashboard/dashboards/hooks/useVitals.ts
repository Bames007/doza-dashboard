// app/center/dashboard/dashboards/hooks/useVitals.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface VitalsData {
  today: number;
  change: number;
  recent: Array<{
    id: string;
    patient: string;
    bp: string;
    hr: number;
    temp: string;
    time: string;
  }>;
}

export function useVitals(centerId?: string, userId?: string) {
  const [vitals, setVitals] = useState<VitalsData>({
    today: 0,
    change: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchVitals = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/vitals/recent`, {
          userId,
        });
        setVitals(data || { today: 0, change: 0, recent: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load vitals");
        setVitals({ today: 0, change: 0, recent: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchVitals();
  }, [centerId, userId]);

  return { vitals, loading, error };
}
