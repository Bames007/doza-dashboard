// app/center/dashboard/dashboards/hooks/useExpiredDrugs.ts
import { useState, useEffect } from "react";
import { ExpiredDrug } from "../types";
import { apiFetch } from "@/app/lib/api";

export function useExpiredDrugs(centerId?: string, userId?: string) {
  const [expiredDrugs, setExpiredDrugs] = useState<ExpiredDrug[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }

    const fetchExpired = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/inventory?expiry=expired,expiring_soon`,
          { userId },
        );
        setExpiredDrugs(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load expired drugs");
        setExpiredDrugs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpired();
  }, [centerId, userId]);

  return { expiredDrugs, loading, error };
}
