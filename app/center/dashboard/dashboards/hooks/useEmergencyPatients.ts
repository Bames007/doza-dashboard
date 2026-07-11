import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";

export interface EmergencyPatient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  chiefComplaint: string;
  acuity: "1" | "2" | "3" | "4" | "5";
  status: "waiting" | "in-treatment" | "discharged";
  bedAssigned?: string;
  arrivalTime: string;
  triageTime?: string;
  vitalSigns?: {
    bp?: string;
    hr?: number;
    rr?: number;
    o2sat?: number;
    temp?: number;
  };
  needICU: boolean;
  needVentilator: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useEmergencyPatients(centerId?: string, userId?: string) {
  const [patients, setPatients] = useState<EmergencyPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/emergency/patients`,
        { userId },
      );
      setPatients(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (
    data: Omit<EmergencyPatient, "id" | "createdAt" | "updatedAt">,
  ) => {
    const result = await apiPost(
      `/api/centers/${centerId}/emergency/patients`,
      data,
      { userId },
    );
    await fetchPatients();
    return result;
  };

  const updatePatient = async (id: string, data: Partial<EmergencyPatient>) => {
    const result = await apiPut(
      `/api/centers/${centerId}/emergency/patients/${id}`,
      data,
      { userId },
    );
    await fetchPatients();
    return result;
  };

  const deletePatient = async (id: string) => {
    await apiDelete(`/api/centers/${centerId}/emergency/patients/${id}`, {
      userId,
    });
    await fetchPatients();
  };

  return {
    patients,
    loading,
    error,
    refetch: fetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
  };
}
