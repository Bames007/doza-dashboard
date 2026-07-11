// app/center/dashboard/dashboards/hooks/useBedOccupancy.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export function useBedOccupancy(centerId?: string, userId?: string) {
  const [occupancy, setOccupancy] = useState({
    total: 0,
    occupied: 0,
    rate: 0,
    history: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchOccupancy = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/facilities?type=ward`,
          { userId },
        );
        setOccupancy(data || { total: 0, occupied: 0, rate: 0, history: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load bed occupancy");
        setOccupancy({ total: 0, occupied: 0, rate: 0, history: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchOccupancy();
  }, [centerId, userId]);

  return { occupancy, loading, error };
}
