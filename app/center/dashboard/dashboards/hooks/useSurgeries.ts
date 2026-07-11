// app/center/dashboard/dashboards/hooks/useSurgeries.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface SurgeriesData {
  today: number;
  completed: number;
  upcoming: number;
  list: Array<{
    id: string;
    patient: string;
    procedure: string;
    surgeon: string;
    time: string;
    status: "scheduled" | "in-progress" | "completed";
  }>;
}

export function useSurgeries(centerId?: string, userId?: string) {
  const [surgeries, setSurgeries] = useState<SurgeriesData>({
    today: 0,
    completed: 0,
    upcoming: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchSurgeries = async () => {
      setLoading(true);
      setError("");
      try {
        const url = `/api/centers/${centerId}/surgeries?today=true`;
        const data = await apiFetch(url, { userId });
        const list = Array.isArray(data) ? data : [];
        const todayStr = new Date().toISOString().split("T")[0];
        const todayList = list.filter((s: any) => s.date?.startsWith(todayStr));
        setSurgeries({
          today: todayList.length,
          completed: list.filter((s: any) => s.status === "completed").length,
          upcoming: list.filter(
            (s: any) => s.status === "scheduled" || s.status === "pending",
          ).length,
          list,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load surgeries");
        setSurgeries({ today: 0, completed: 0, upcoming: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchSurgeries();
  }, [centerId, userId]);

  return { surgeries, loading, error };
}
