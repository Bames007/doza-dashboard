// app/center/dashboard/dashboards/hooks/useOpticalInventory.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface OpticalInventoryData {
  totalFrames: number;
  lowStock: number;
  models: number;
  frames: Array<{
    id: string;
    model: string;
    brand: string;
    quantity: number;
    reorderLevel: number;
    price: number;
  }>;
}

export function useOpticalInventory(centerId?: string, userId?: string) {
  const [inventory, setInventory] = useState<OpticalInventoryData>({
    totalFrames: 0,
    lowStock: 0,
    models: 0,
    frames: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchInventory = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/optical/inventory`,
          { userId },
        );
        setInventory(
          data || { totalFrames: 0, lowStock: 0, models: 0, frames: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load optical inventory");
        setInventory({ totalFrames: 0, lowStock: 0, models: 0, frames: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [centerId, userId]);

  return { inventory, loading, error };
}
