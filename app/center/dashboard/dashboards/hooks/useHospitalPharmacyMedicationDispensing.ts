// app/center/dashboard/hooks/useHospitalPharmacyMedicationDispensing.ts

"use client";

import { useMemo, useCallback } from "react";
import { usePrescriptions } from "./useHospitalPrescription";

export type DispensingFilter = {
  search?: string;
  status?:
    | "all"
    | "pending"
    | "full"
    | "partial"
    | "out_of_stock"
    | "cancelled";
  sortBy?: "patient" | "drug" | "prescribedAt" | "dispensedAt" | "status";
  sortOrder?: "asc" | "desc";
};

// Extended prescription type with quantity tracking
export interface DispensingPrescription {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
  prescribedBy: string;
  prescribedAt: string;
  dispensed: boolean;
  dispensedStatus?: "none" | "partial" | "full" | "out_of_stock" | "cancelled";
  dispensedQuantity?: number; // last dispensed quantity
  dispensedTotal?: number; // cumulative dispensed
  totalQuantity?: number; // prescribed total
  pharmacistNotes?: string;
  dispensedAt?: string;
  dispensedById?: string;
  index: number;
  price?: number;
}

export function useHospitalPharmacyMedicationDispensing(
  centerId?: string,
  userId?: string,
) {
  const {
    prescriptions: basePrescriptions,
    loading,
    refetch,
    updatePrescription,
  } = usePrescriptions(centerId, userId);

  // Enhance prescriptions with quantity tracking
  const prescriptions = useMemo(() => {
    return basePrescriptions.map((p) => {
      // If the prescription already has totalQuantity and dispensedTotal, use them
      // Otherwise, compute defaults
      const totalQty = (p as any).totalQuantity || 1;
      const dispensedTotal = (p as any).dispensedTotal || 0;
      const remaining = Math.max(0, totalQty - dispensedTotal);
      return {
        ...p,
        totalQuantity: totalQty,
        dispensedTotal: dispensedTotal,
        remaining,
        // Determine status based on remaining quantity
        // We keep the existing dispensedStatus but could override if needed
      };
    });
  }, [basePrescriptions]);

  const filterPrescriptions = useCallback(
    (filters: DispensingFilter) => {
      let result = [...prescriptions];

      if (filters.search) {
        const term = filters.search.toLowerCase();
        result = result.filter(
          (p) =>
            p.patientName.toLowerCase().includes(term) ||
            p.medication.toLowerCase().includes(term),
        );
      }

      if (filters.status && filters.status !== "all") {
        if (filters.status === "pending") {
          result = result.filter(
            (p) =>
              !p.dispensed ||
              p.dispensedStatus === "none" ||
              (p.remaining && p.remaining > 0),
          );
        } else {
          result = result.filter((p) => p.dispensedStatus === filters.status);
        }
      }

      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortOrder = filters.sortOrder || "desc";
        result.sort((a, b) => {
          let aVal: any, bVal: any;
          switch (sortField) {
            case "patient":
              aVal = a.patientName;
              bVal = b.patientName;
              break;
            case "drug":
              aVal = a.medication;
              bVal = b.medication;
              break;
            case "prescribedAt":
              aVal = new Date(a.prescribedAt).getTime();
              bVal = new Date(b.prescribedAt).getTime();
              break;
            case "dispensedAt":
              aVal = a.dispensedAt ? new Date(a.dispensedAt).getTime() : 0;
              bVal = b.dispensedAt ? new Date(b.dispensedAt).getTime() : 0;
              break;
            case "status":
              const statusOrder = {
                none: 0,
                pending: 0,
                full: 1,
                partial: 2,
                out_of_stock: 3,
                cancelled: 4,
              };
              const aStatus = a.dispensedStatus || "none";
              const bStatus = b.dispensedStatus || "none";
              aVal = statusOrder[aStatus] ?? 0;
              bVal = statusOrder[bStatus] ?? 0;
              break;
            default:
              aVal = a[sortField as keyof typeof a];
              bVal = b[sortField as keyof typeof b];
          }
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      } else {
        result.sort(
          (a, b) =>
            new Date(b.prescribedAt).getTime() -
            new Date(a.prescribedAt).getTime(),
        );
      }
      return result;
    },
    [prescriptions],
  );

  // Override update to handle dispensedTotal
  const updatePrescriptionWithDispense = useCallback(
    async (patientId: string, index: number, data: any) => {
      // If updating dispensedTotal, we need to merge with existing
      if (data.dispensedTotal !== undefined) {
        // We'll store dispensedTotal in the prescription object
        // The base update will overwrite the whole prescription, so we need to fetch current first
        // But we can just call updatePrescription with the new data
        // However, the base update expects partial data; we'll pass the updated fields
        // We need to ensure that the prescription object in the patient has the fields.
        // We'll call updatePrescription with the updated prescription item.
        // Since we don't have direct access to the patient's prescriptions array, we'll let the base hook handle it.
        // But the base hook's updatePrescription expects a patientId and index, and data to merge.
        // We'll pass the updated fields including dispensedTotal and dispensed.
        await updatePrescription(patientId, index, data);
      } else {
        await updatePrescription(patientId, index, data);
      }
      // Refetch to sync
      await refetch();
    },
    [updatePrescription, refetch],
  );

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter(
      (p) =>
        !p.dispensed ||
        p.dispensedStatus === "none" ||
        (p.remaining && p.remaining > 0),
    ).length;
    const full = prescriptions.filter(
      (p) => p.dispensedStatus === "full",
    ).length;
    const partial = prescriptions.filter(
      (p) => p.dispensedStatus === "partial",
    ).length;
    const outOfStock = prescriptions.filter(
      (p) => p.dispensedStatus === "out_of_stock",
    ).length;
    const cancelled = prescriptions.filter(
      (p) => p.dispensedStatus === "cancelled",
    ).length;
    return { total, pending, full, partial, outOfStock, cancelled };
  }, [prescriptions]);

  return {
    prescriptions,
    loading,
    refetch,
    updatePrescription: updatePrescriptionWithDispense,
    filterPrescriptions,
    stats,
  };
}
