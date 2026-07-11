// app/center/dashboard/hooks/useHospitalPharmacyMedicationDispensing.ts
"use client";

import { useMemo, useCallback } from "react";
import {
  usePrescriptions,
  PrescriptionWithPatient,
} from "./useHospitalPrescription";

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

export function useHospitalPharmacyMedicationDispensing(
  centerId?: string,
  userId?: string,
) {
  const { prescriptions, loading, refetch, updatePrescription } =
    usePrescriptions(centerId, userId);

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
            (p) => !p.dispensed || p.dispensedStatus === "none",
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

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter(
      (p) => !p.dispensed || p.dispensedStatus === "none",
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
    updatePrescription,
    filterPrescriptions,
    stats,
  };
}
