// app/center/dashboard/dashboards/hooks/usePrescriptions.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface PrescriptionsData {
  pending: number;
  urgent: number;
  list: Array<{
    id: string;
    patient: string;
    medication: string;
    prescribedAt: string;
    status: "pending" | "ready" | "picked-up";
    urgent: boolean;
  }>;
}

export function usePrescriptions(centerId?: string, userId?: string) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionsData>({
    pending: 0,
    urgent: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchPrescriptions = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/prescriptions/pending`,
          { userId },
        );
        setPrescriptions(data || { pending: 0, urgent: 0, list: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load prescriptions");
        setPrescriptions({ pending: 0, urgent: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchPrescriptions();
  }, [centerId, userId]);

  return { prescriptions, loading, error };
}
