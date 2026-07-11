// app/center/dashboard/dashboards/hooks/useLowStock.ts
import { useState, useEffect } from "react";
import { Product } from "../types";
import { apiFetch } from "@/app/lib/api";

export function useLowStock(centerId?: string, userId?: string) {
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchLowStock = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(
          `/api/centers/${centerId}/inventory?lowStock=true`,
          { userId },
        );
        setLowStockItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Failed to load low stock items");
        setLowStockItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, [centerId, userId]);

  return { lowStockItems, loading, error };
}
