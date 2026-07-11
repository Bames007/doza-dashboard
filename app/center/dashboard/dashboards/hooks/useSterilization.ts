// app/center/dashboard/dashboards/hooks/useSterilization.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface SterilizationData {
  total: number;
  ready: number;
  inProgress: number;
  items: Array<{
    id: string;
    name: string;
    status: "ready" | "in-progress" | "needs-cleaning";
    lastCycle: string;
    cycleNumber?: string;
  }>;
}

export function useSterilization(centerId?: string, userId?: string) {
  const [sterilization, setSterilization] = useState<SterilizationData>({
    total: 0,
    ready: 0,
    inProgress: 0,
    items: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchSterilization = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/dental/sterilization`,
          { userId },
        );
        setSterilization(
          data || { total: 0, ready: 0, inProgress: 0, items: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load sterilization data");
        setSterilization({ total: 0, ready: 0, inProgress: 0, items: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchSterilization();
  }, [centerId, userId]);

  return { sterilization, loading, error };
}
