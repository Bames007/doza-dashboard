import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string =>
  !!id && id !== "undefined" && id !== "null";

export interface AmbulanceArrival {
  id: string;
  provider: string;
  eta: string;
  patientName?: string;
  chiefComplaint?: string;
  priority: "high" | "medium" | "low";
}

export interface AmbulanceArrivalsData {
  incoming: number;
  within10: number;
  avg: number;
  list: AmbulanceArrival[];
}

export function useAmbulanceArrivals(centerId?: string, userId?: string) {
  const [arrivals, setArrivals] = useState<AmbulanceArrivalsData>({
    incoming: 0,
    within10: 0,
    avg: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchArrivals = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/emergency/ambulance`,
        { userId },
      );
      setArrivals(data || { incoming: 0, within10: 0, avg: 0, list: [] });
    } catch (err: any) {
      setError(err.message || "Failed to load ambulance arrivals");
      setArrivals({ incoming: 0, within10: 0, avg: 0, list: [] });
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  return { arrivals, loading, error, refetch: fetchArrivals };
}
