// app/center/dashboard/dashboards/hooks/useAppointmentStats.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";
import { Appointment } from "../../types/appointment";

interface AppointmentStats {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
}

const isValidId = (id?: string): id is string => {
  return !!id && id !== "undefined";
};

export const useAppointmentStats = (centerId?: string, userId?: string) => {
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const today = new Date().toISOString().split("T")[0];
        const data = await apiFetch(
          `/api/centers/${centerId}/appointments?date=${today}`,
          { userId },
        );
        const apps: Appointment[] = Array.isArray(data) ? data : [];
        setStats({
          total: apps.length,
          pending: apps.filter((a) =>
            ["scheduled", "confirmed"].includes(a.status),
          ).length,
          completed: apps.filter((a) => a.status === "completed").length,
          cancelled: apps.filter((a) => a.status === "cancelled").length,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load appointment stats");
        setStats({ total: 0, pending: 0, completed: 0, cancelled: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [centerId, userId]);

  return { stats, loading, error };
};
