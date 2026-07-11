// app/center/dashboard/dashboards/hooks/useDentalInventory.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string | null): id is string => {
  return !!id && id !== "undefined" && id !== "null";
};

export interface DentalInventoryData {
  lowStock: number;
  critical: number;
  criticalItems: Array<{
    id: string;
    name: string;
    quantity: number;
    reorderLevel: number;
    category: string;
    supplier?: string;
  }>;
}

export function useDentalInventory(centerId?: string, userId?: string) {
  const [inventory, setInventory] = useState<DentalInventoryData>({
    lowStock: 0,
    critical: 0,
    criticalItems: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }

    const fetchInventory = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/dental/inventory/lowstock`,
          { userId },
        );
        setInventory(data || { lowStock: 0, critical: 0, criticalItems: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load dental inventory");
        setInventory({ lowStock: 0, critical: 0, criticalItems: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [centerId, userId]);

  return { inventory, loading, error };
}
