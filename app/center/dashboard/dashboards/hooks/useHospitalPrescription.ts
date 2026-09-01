// app/center/dashboard/hooks/useHospitalPrescriptions.ts

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePatients } from "./usePatients";

export interface PrescriptionWithPatient {
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
  dispensedQuantity?: number;
  dispensedTotal?: number;
  totalQuantity?: number;
  source?: "hospital" | "external";
  pharmacistNotes?: string;
  dispensedAt?: string;
  dispensedById?: string;
  index: number;
  price?: number;
}

export function usePrescriptions(centerId?: string, userId?: string) {
  const {
    patients,
    loading: patientsLoading,
    refetch: refetchPatients,
    updatePatient,
  } = usePatients(centerId, userId);

  const [prescriptions, setPrescriptions] = useState<PrescriptionWithPatient[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientsLoading) {
      setLoading(true);
      return;
    }
    if (!patients) {
      setPrescriptions([]);
      setLoading(false);
      return;
    }

    const flat: PrescriptionWithPatient[] = [];
    patients.forEach((patient) => {
      if (patient.prescriptions && Array.isArray(patient.prescriptions)) {
        patient.prescriptions.forEach((rx, index) => {
          // Cast to any to safely access new fields (if interface not updated)
          const r = rx as any;
          flat.push({
            id: `${patient.id}-${index}`,
            patientId: patient.id,
            patientName: patient.fullName,
            medication: r.medication || "",
            dosage: r.dosage || "",
            frequency: r.frequency || "",
            route: r.route || "",
            duration: r.duration || "",
            instructions: r.instructions || "",
            prescribedBy: r.prescribedBy || "",
            prescribedAt: r.prescribedAt || new Date().toISOString(),
            dispensed: r.dispensed || false,
            dispensedStatus: r.dispensedStatus || "none",
            dispensedQuantity: r.dispensedQuantity || 0,
            dispensedTotal: r.dispensedTotal || 0,
            totalQuantity: r.totalQuantity || 1,
            source: r.source || "hospital",
            pharmacistNotes: r.pharmacistNotes || "",
            dispensedAt: r.dispensedAt || "",
            dispensedById: r.dispensedById || "",
            index,
            price: r.price || 0,
          });
        });
      }
    });

    setPrescriptions(flat);
    setLoading(false);
  }, [patients, patientsLoading]);

  const refetch = useCallback(async () => {
    await refetchPatients();
  }, [refetchPatients]);

  const updatePrescription = useCallback(
    async (
      patientId: string,
      index: number,
      data: Partial<PrescriptionWithPatient>,
    ) => {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) throw new Error("Patient not found");
      const prescriptions = patient.prescriptions || [];
      if (index >= prescriptions.length)
        throw new Error("Prescription index out of bounds");

      const updatedPrescriptions = [...prescriptions];
      updatedPrescriptions[index] = {
        ...updatedPrescriptions[index],
        ...data,
      };
      await updatePatient(patientId, { prescriptions: updatedPrescriptions });
      await refetch();
    },
    [patients, updatePatient, refetch],
  );

  return {
    prescriptions,
    loading,
    refetch,
    updatePrescription,
  };
}
