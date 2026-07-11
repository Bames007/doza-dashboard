// app/center/dashboards/hooks/useInventoryTriggers.ts
import { useState } from "react";
import { apiFetch } from "@/app/lib/api";

export function useInventoryTriggers(centerId?: string, userId?: string) {
  const [loading, setLoading] = useState(false);

  const checkLowStock = async (autoCreate = false) => {
    if (!centerId || !userId) return;
    setLoading(true);
    try {
      const result = await apiFetch(
        `/api/centers/${centerId}/inventory/triggers/low-stock?autoCreate=${autoCreate}`,
        { userId },
      );
      return result;
    } catch (error) {
      console.error("Failed to check low stock", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { checkLowStock, loading };
}
