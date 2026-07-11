// app/center/dashboard/hooks/useHospitalPharmacyInventory.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";
import logger from "@/app/utils/logger";

export interface PharmacyDrug {
  id: string;
  name: string;
  strength?: string;
  form:
    | "Tablet"
    | "Capsule"
    | "Syrup"
    | "Injection"
    | "Cream"
    | "Drops"
    | "Inhaler"
    | "Other";
  packSize: number;
  unit: string;
  quantity: number;
  reorderPoint: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  location?: string;
  category?: string;
  costPerUnit?: number;
  sellingPrice?: number;
  status: "in-stock" | "low-stock" | "out-of-stock" | "expired";
  lastUpdated: string;
  createdAt: string;
}

interface UsePharmacyInventoryReturn {
  drugs: PharmacyDrug[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  addDrug: (
    data: Omit<PharmacyDrug, "id" | "status" | "lastUpdated" | "createdAt">,
  ) => Promise<PharmacyDrug>;
  updateDrug: (
    id: string,
    data: Partial<PharmacyDrug>,
  ) => Promise<PharmacyDrug>;
  deleteDrug: (id: string) => Promise<void>;
  adjustStock: (
    id: string,
    delta: number,
    note?: string,
  ) => Promise<PharmacyDrug>;
}

export function usePharmacyInventory(
  centerId?: string,
  userId?: string,
): UsePharmacyInventoryReturn {
  const [drugs, setDrugs] = useState<PharmacyDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDrugs = useCallback(async () => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/hospital_pharmacy/inventory`,
        { userId },
      );
      setDrugs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Network error");
      logger.error("usePharmacyInventory fetch error", err);
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  const addDrug = useCallback(
    async (
      data: Omit<PharmacyDrug, "id" | "status" | "lastUpdated" | "createdAt">,
    ) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiPost(
        `/api/centers/${centerId}/hospital_pharmacy/inventory`,
        data,
        { userId },
      );
      setDrugs((prev) => [...prev, result]);
      return result;
    },
    [centerId, userId],
  );

  const updateDrug = useCallback(
    async (id: string, data: Partial<PharmacyDrug>) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiPut(
        `/api/centers/${centerId}/hospital_pharmacy/inventory/${id}`,
        data,
        { userId },
      );
      setDrugs((prev) => prev.map((d) => (d.id === id ? result : d)));
      return result;
    },
    [centerId, userId],
  );

  const deleteDrug = useCallback(
    async (id: string) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      await apiDelete(
        `/api/centers/${centerId}/hospital_pharmacy/inventory/${id}`,
        { userId },
      );
      setDrugs((prev) => prev.filter((d) => d.id !== id));
    },
    [centerId, userId],
  );

  const adjustStock = useCallback(
    async (id: string, delta: number, note?: string) => {
      if (!centerId || !userId)
        throw new Error("Center ID and User ID required");
      const result = await apiFetch(
        `/api/centers/${centerId}/hospital_pharmacy/inventory/adjust`,
        {
          userId,
          method: "POST",
          body: JSON.stringify({ drugId: id, delta, note }),
        },
      );
      setDrugs((prev) => prev.map((d) => (d.id === id ? result : d)));
      return result;
    },
    [centerId, userId],
  );

  return {
    drugs,
    loading,
    error,
    refetch: fetchDrugs,
    addDrug,
    updateDrug,
    deleteDrug,
    adjustStock,
  };
}
