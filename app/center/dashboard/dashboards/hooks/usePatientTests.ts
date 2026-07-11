// app/center/dashboard/dashboards/hooks/usePatients.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/app/lib/api";
import logger from "@/app/utils/logger";

const isValidId = (id?: string): id is string => !!id && id !== "undefined";

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  patientType: "inpatient" | "outpatient";
  status: "active" | "inactive" | "discharge_pending";
  registeredAt: string;
  registeredBy: string;
  vitals?: any;
  doctorNotes?: any[];
  nursingNotes?: any[];
  diagnoses?: string[];
  billingInfo?: any;
  admissionDate?: string;
  dischargeDate?: string;
  dischargeRequested?: boolean;
  dischargeRequestedBy?: string;
  dischargeRequestedAt?: string;
  emergencyContact?: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  panel?: string;
  sampleType?: string;
  collectionDate: string;
  status: "pending" | "processing" | "completed" | "rejected" | "cancelled";
  orderedBy?: string;
  orderedByName?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  acceptedById?: string;
  completedBy?: string;
  completedAt?: string;
  result?: any;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

interface UsePatientsReturn {
  patients: Patient[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  addPatient: (data: any) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
}

interface UsePatientTestsReturn {
  tests: LabTest[];
  loading: boolean;
  error: string;
  refetch: (patientId?: string) => Promise<void>;
  createTest: (data: any) => Promise<LabTest>;
  updateTest: (id: string, data: any) => Promise<LabTest>;
}

export function usePatients(
  centerId?: string,
  userId?: string,
): UsePatientsReturn {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = useCallback(async () => {
    if (!isValidId(centerId) || !isValidId(userId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/api/centers/${centerId}/patients`, {
        userId,
      });
      setPatients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Network error");
      logger.error("usePatients fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = useCallback(
    async (data: any): Promise<Patient> => {
      if (!isValidId(centerId) || !isValidId(userId))
        throw new Error("Center ID and User ID are required");
      const result = await apiPost(`/api/centers/${centerId}/patients`, data, {
        userId,
      });
      setPatients((prev) => [...prev, result]);
      return result;
    },
    [centerId, userId],
  );

  const updatePatient = useCallback(
    async (id: string, data: Partial<Patient>): Promise<Patient> => {
      if (!isValidId(centerId) || !isValidId(userId))
        throw new Error("Center ID and User ID are required");
      const result = await apiPut(
        `/api/centers/${centerId}/patients/${id}`,
        data,
        { userId },
      );
      setPatients((prev) => prev.map((p) => (p.id === id ? result : p)));
      return result;
    },
    [centerId, userId],
  );

  const deletePatient = useCallback(
    async (id: string): Promise<void> => {
      if (!isValidId(centerId) || !isValidId(userId))
        throw new Error("Center ID and User ID are required");
      await apiDelete(`/api/centers/${centerId}/patients/${id}`, { userId });
      setPatients((prev) => prev.filter((p) => p.id !== id));
    },
    [centerId, userId],
  );

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

export function usePatientTests(
  centerId?: string,
  userId?: string,
): UsePatientTestsReturn {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTests = useCallback(
    async (patientId?: string) => {
      if (!isValidId(centerId) || !isValidId(userId)) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const url = patientId
          ? `/api/centers/${centerId}/lab-tests?patientId=${patientId}`
          : `/api/centers/${centerId}/lab-tests`;
        const data = await apiFetch(url, { userId });
        setTests(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Network error");
        logger.error("usePatientTests fetch error", err);
      } finally {
        setLoading(false);
      }
    },
    [centerId, userId],
  );

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const createTest = useCallback(
    async (data: any): Promise<LabTest> => {
      if (!isValidId(centerId) || !isValidId(userId))
        throw new Error("Center ID and User ID are required");
      const result = await apiPost(`/api/centers/${centerId}/lab-tests`, data, {
        userId,
      });
      setTests((prev) => [...prev, result]);
      return result;
    },
    [centerId, userId],
  );

  const updateTest = useCallback(
    async (id: string, data: any): Promise<LabTest> => {
      if (!isValidId(centerId) || !isValidId(userId))
        throw new Error("Center ID and User ID are required");
      const result = await apiPut(
        `/api/centers/${centerId}/lab-tests/${id}`,
        data,
        { userId },
      );
      setTests((prev) => prev.map((t) => (t.id === id ? result : t)));
      return result;
    },
    [centerId, userId],
  );

  return { tests, loading, error, refetch: fetchTests, createTest, updateTest };
}
