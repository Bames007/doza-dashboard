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
  pharmacistNotes?: string;
  dispensedAt?: string;
  dispensedById?: string;
  index: number;
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
          flat.push({
            id: `${patient.id}-${index}`,
            patientId: patient.id,
            patientName: patient.fullName,
            ...rx,
            index,
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
      updatedPrescriptions[index] = { ...updatedPrescriptions[index], ...data };
      await updatePatient(patientId, { prescriptions: updatedPrescriptions });
      await refetch();
    },
    [patients, updatePatient, refetch],
  );

  return { prescriptions, loading, refetch, updatePrescription };
}
