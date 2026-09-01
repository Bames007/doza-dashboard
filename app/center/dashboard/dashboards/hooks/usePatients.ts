"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import logger from "@/app/utils/logger";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string): id is string => {
  return !!id && id !== "undefined";
};

// ─── Full Patient Interface ──────────────────────────────────────────

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  patientType: "inpatient" | "outpatient";
  status:
    | "active"
    | "inactive"
    | "discharge_pending"
    | "waiting"
    | "in-treatment"
    | "discharged";
  dozaUserId?: string;
  registeredAt: string;
  registeredBy: string;

  // Clinical data
  vitals?: Record<string, any>;
  vitalsHistory?: Array<{
    timestamp: string;
    recordedBy: string;
    recordedById: string;
    [key: string]: any;
  }>;
  doctorNotes?: Array<{
    authorId: string;
    authorName: string;
    timestamp: string;
    content: string;
  }>;
  nursingNotes?: Array<{
    authorId: string;
    authorName: string;
    timestamp: string;
    content: string;
  }>;
  diagnoses?: string[];
  allergies?: string[];
  prescriptions?: Array<{
    price: number;
    medication: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
    prescribedBy: string;
    prescribedAt: string;
    dispensed: boolean;
    dispensedStatus?:
      | "none"
      | "partial"
      | "full"
      | "out_of_stock"
      | "cancelled";
    dispensedQuantity?: number;
    pharmacistNotes?: string;
    dispensedAt?: string;
    dispensedById?: string;
    dispensedTotal?: number;
    totalQuantity?: number;
    source?: "hospital" | "external";
  }>;
  billingInfo?: {
    insuranceProvider?: string;
    policyNumber?: string;
    totalCharges?: number;
    amountPaid?: number;
    balance?: number;
  };
  admissionDate?: string;
  dischargeDate?: string;
  dischargeRequested?: boolean;
  dischargeRequestedBy?: string;
  dischargeRequestedAt?: string;
  emergencyContact?: string;
  dischargeSummary?: string;
  dischargeBy?: string;
  dischargeReason?: string;
  referral?: {
    toCenterId: string;
    toCenterName: string;
    reason: string;
    referredBy: string;
    referredAt: string;
    status: "pending" | "completed" | "cancelled";
  };

  // Emergency-specific fields
  acuity?: "1" | "2" | "3" | "4" | "5";
  triageTime?: string;
  bedAssigned?: string;
  waitTime?: number;
  needICU?: boolean;
  needVentilator?: boolean;
  arrivalTime?: string;
  chiefComplaint?: string;
}

// ─── LabTest Interface ──────────────────────────────────────────────

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
  result?: {
    value: string;
    unit?: string;
    referenceRange?: string;
    notes?: string;
    concludedByName?: string;
    concludedBy?: string;
    concludedAt?: string;
  };
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Patient Check‑ins Interface ────────────────────────────────────

export interface PatientCheckInsData {
  current: number;
  waiting: number;
  avgWaitTime: number;
  list: Array<{
    id: string;
    name: string;
    checkInTime: string;
    waitTime: number;
  }>;
}

// ─── Hook return types ──────────────────────────────────────────────

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

interface UsePatientCheckInsReturn {
  checkIns: PatientCheckInsData;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

// ─── usePatients ────────────────────────────────────────────────────

export function usePatients(
  centerId?: string,
  userId?: string,
  department?: string, // "emergency" or undefined
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
      const url = department
        ? `/api/centers/${centerId}/patients?department=${department}`
        : `/api/centers/${centerId}/patients`;
      const res = await fetch(url, {
        headers: { "x-user-id": userId },
      });
      const data = await res.json();
      if (data.success) {
        setPatients(data.data || []);
      } else {
        setError(data.error || "Failed to load patients");
        logger.error("Failed to fetch patients", data.error);
      }
    } catch (err: any) {
      setError(err.message || "Network error");
      logger.error("usePatients fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId, department]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = useCallback(
    async (data: any): Promise<Patient> => {
      if (!isValidId(centerId) || !isValidId(userId)) {
        throw new Error("Center ID and User ID are required");
      }
      const res = await fetch(`/api/centers/${centerId}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to add patient");
      setPatients((prev) => [...prev, result.data]);
      return result.data;
    },
    [centerId, userId],
  );

  const updatePatient = useCallback(
    async (id: string, data: Partial<Patient>): Promise<Patient> => {
      if (!isValidId(centerId) || !isValidId(userId)) {
        throw new Error("Center ID and User ID are required");
      }
      const res = await fetch(`/api/centers/${centerId}/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to update patient");
      setPatients((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return result.data;
    },
    [centerId, userId],
  );

  const deletePatient = useCallback(
    async (id: string): Promise<void> => {
      if (!isValidId(centerId) || !isValidId(userId)) {
        throw new Error("Center ID and User ID are required");
      }
      const res = await fetch(`/api/centers/${centerId}/patients/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to delete patient");
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

// ─── usePatientTests ─────────────────────────────────────────────────

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
        const res = await fetch(url, { headers: { "x-user-id": userId } });
        const data = await res.json();
        if (data.success) {
          setTests(data.data || []);
        } else {
          setError(data.error || "Failed to load tests");
          logger.error("Failed to fetch tests", data.error);
        }
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
      if (!isValidId(centerId) || !isValidId(userId)) {
        throw new Error("Center ID and User ID are required");
      }
      const res = await fetch(`/api/centers/${centerId}/lab-tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to create test");

      const newTest = result.data;
      if (!newTest.orderedByName && data.orderedByName) {
        newTest.orderedByName = data.orderedByName;
      }
      if (!newTest.orderedBy && data.orderedBy) {
        newTest.orderedBy = data.orderedBy;
      }
      if (!newTest.panel && data.panel) {
        newTest.panel = data.panel;
      }

      setTests((prev) => [...prev, newTest]);
      return newTest;
    },
    [centerId, userId],
  );

  const updateTest = useCallback(
    async (id: string, data: any): Promise<LabTest> => {
      if (!isValidId(centerId) || !isValidId(userId)) {
        throw new Error("Center ID and User ID are required");
      }
      const res = await fetch(`/api/centers/${centerId}/lab-tests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success)
        throw new Error(result.error || "Failed to update test");
      setTests((prev) => prev.map((t) => (t.id === id ? result.data : t)));
      return result.data;
    },
    [centerId, userId],
  );

  return {
    tests,
    loading,
    error,
    refetch: fetchTests,
    createTest,
    updateTest,
  };
}

// ─── usePatientCheckIns ─────────────────────────────────────────────

export function usePatientCheckIns(
  centerId?: string,
  userId?: string,
): UsePatientCheckInsReturn {
  const [checkIns, setCheckIns] = useState<PatientCheckInsData>({
    current: 0,
    waiting: 0,
    avgWaitTime: 0,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCheckIns = useCallback(async () => {
    if (!isValidId(centerId) || !userId) {
      setLoading(false);
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(
        `/api/centers/${centerId}/patients/checkins`,
        {
          userId,
          signal: controller.signal,
        },
      );
      setCheckIns(data || { current: 0, waiting: 0, avgWaitTime: 0, list: [] });
      logger.debug({ centerId }, "Patient check-ins fetched");
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to load check-ins");
      logger.error("usePatientCheckIns error", err);
    } finally {
      setLoading(false);
      if (abortControllerRef.current === controller)
        abortControllerRef.current = null;
    }
  }, [centerId, userId]);

  useEffect(() => {
    fetchCheckIns();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchCheckIns]);

  const refetch = useCallback(() => fetchCheckIns(), [fetchCheckIns]);

  return { checkIns, loading, error, refetch };
}
