// app/center/dashboard/dashboards/hooks/usePatientVitals.ts
import { useState, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";
import logger from "@/app/utils/logger";

export type VitalsInput = Record<string, any>;

export function usePatientVitals(centerId?: string, userId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateVitals = useCallback(
    async (patientId: string, vitals: VitalsInput) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID are required");
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(
          `/api/centers/${centerId}/patients/${patientId}/vitals`,
          {
            userId,
            method: "PUT",
            body: JSON.stringify(vitals),
          },
        );
        setLoading(false);
        return result;
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        logger.error("usePatientVitals error", err);
        throw err;
      }
    },
    [centerId, userId],
  );

  return { updateVitals, loading, error };
}
