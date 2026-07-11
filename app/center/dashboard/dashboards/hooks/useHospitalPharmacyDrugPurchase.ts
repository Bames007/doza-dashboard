// app/center/dashboard/hooks/useHospitalPharmacyDrugPurchase.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";
import logger from "@/app/utils/logger";

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  items: Array<{
    drugName: string;
    strength?: string;
    form: string;
    quantity: number;
    unit: string;
    costPerUnit: number;
    totalCost: number;
  }>;
  totalAmount: number;
  status: "draft" | "pending" | "approved" | "received" | "cancelled";
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

interface UseDrugPurchaseReturn {
  orders: PurchaseOrder[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  createOrder: (
    data: Omit<PurchaseOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">,
  ) => Promise<PurchaseOrder>;
  updateOrder: (
    id: string,
    data: Partial<PurchaseOrder>,
  ) => Promise<PurchaseOrder>;
  deleteOrder: (id: string) => Promise<void>;
  approveOrder: (id: string) => Promise<PurchaseOrder>;
  receiveOrder: (id: string) => Promise<PurchaseOrder>;
}

export function useDrugPurchase(
  centerId?: string,
  userId?: string,
): UseDrugPurchaseReturn {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/hospital_pharmacy/purchases`,
        { userId },
      );
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Network error");
      logger.error("useDrugPurchase fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(
    async (
      data: Omit<
        PurchaseOrder,
        "id" | "orderNumber" | "createdAt" | "updatedAt"
      >,
    ) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiPost(
        `/api/centers/${centerId}/hospital_pharmacy/purchases`,
        data,
        { userId },
      );
      setOrders((prev) => [result, ...prev]);
      return result;
    },
    [centerId, userId],
  );

  const updateOrder = useCallback(
    async (id: string, data: Partial<PurchaseOrder>) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiPut(
        `/api/centers/${centerId}/hospital_pharmacy/purchases/${id}`,
        data,
        { userId },
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? result : o)));
      return result;
    },
    [centerId, userId],
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      await apiDelete(
        `/api/centers/${centerId}/hospital_pharmacy/purchases/${id}`,
        { userId },
      );
      setOrders((prev) => prev.filter((o) => o.id !== id));
    },
    [centerId, userId],
  );

  const approveOrder = useCallback(
    async (id: string) => {
      return updateOrder(id, { status: "approved", approvedBy: userId });
    },
    [updateOrder, userId],
  );

  const receiveOrder = useCallback(
    async (id: string) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiFetch(
        `/api/centers/${centerId}/hospital_pharmacy/purchases/${id}/receive`,
        {
          userId,
          method: "POST",
        },
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? result : o)));
      return result;
    },
    [centerId, userId],
  );

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    approveOrder,
    receiveOrder,
  };
}
