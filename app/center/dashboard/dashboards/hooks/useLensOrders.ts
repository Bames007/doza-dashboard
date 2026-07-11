// app/center/dashboard/dashboards/hooks/useLensOrders.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface LensOrdersData {
  pending: number;
  processing: number;
  ready: number;
  list: Array<{
    id: string;
    patient: string;
    prescription: string;
    orderedAt: string;
    status: "pending" | "processing" | "ready" | "delivered";
  }>;
}

export function useLensOrders(centerId?: string, userId?: string) {
  const [orders, setOrders] = useState<LensOrdersData>({
    pending: 0,
    processing: 0,
    ready: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/optical/orders`, {
          userId,
        });
        setOrders(data || { pending: 0, processing: 0, ready: 0, list: [] });
      } catch (err: any) {
        setError(err.message || "Failed to load lens orders");
        setOrders({ pending: 0, processing: 0, ready: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [centerId, userId]);

  return { orders, loading, error };
}
