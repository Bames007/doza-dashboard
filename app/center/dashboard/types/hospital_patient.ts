// app/center/dashboard/components/patient_panel/types.ts

import type { Patient } from "../dashboards/hooks/usePatients";

export type ExtendedPatient = Patient & {
  prescriptions?: Array<{
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
    price?: number;
  }>;
  allergies?: string[];
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
  vitals?: Record<string, any>;
  vitalsHistory?: Array<{
    timestamp: string;
    recordedBy: string;
    recordedById: string;
    [key: string]: any;
  }>;
  referral?: {
    toCenterId: string;
    toCenterName: string;
    reason: string;
    referredBy: string;
    referredAt: string;
    status: "pending" | "completed" | "cancelled";
  };
  dischargeSummary?: string;
  tests?: Array<{
    testType: string;
    status: string;
    price?: number;
    result?: { value: string; unit: string };
  }>;
  medicationAdministrations?: Record<string, any>;
  bills?: Array<{
    id: string;
    items: Array<{
      type: "prescription" | "lab_test" | "consultation" | "bed" | "other";
      description: string;
      amount: number;
      quantity?: number;
    }>;
    total: number;
    status: "pending" | "approved" | "paid" | "discharged" | "hmo";
    notes?: string;
    createdBy: string;
    createdByName: string;
    createdAt: number;
    updatedAt?: number;
  }>;

  totalBilling?: number;
};

export interface TimelineEvent {
  id: string;
  type:
    | "doctor-note"
    | "nursing-note"
    | "vitals"
    | "lab-test"
    | "prescription"
    | "admission"
    | "discharge"
    | "billing"
    | "referral"
    | "medication-admin";
  timestamp: string;
  actor: {
    id: string;
    fullName: string;
    role: string;
    avatar?: string;
  };
  action: string;
  description: string;
  data: any;
  permissions: {
    canView: string[];
    canEdit: string[];
  };
}

export interface Permissions {
  canViewPatientList: boolean;
  canViewDemographics: boolean;
  canViewAllergies: boolean;
  canViewProblemList: boolean;
  canViewMedications: boolean;
  canAdministerMedication: boolean;
  canViewDoctorNotes: boolean;
  canViewNursingNotes: boolean;
  canViewVitals: boolean;
  canViewTestOrders: boolean;
  canViewTestResults: boolean;
  canViewPrescriptions: boolean;
  canViewBilling: boolean;
  canAddPatient: boolean;
  canAddDoctorNote: boolean;
  canAddNursingNote: boolean;
  canUpdateVitals: boolean;
  canOrderTest: boolean;
  canEnterTestResult: boolean;
  canPrescribe: boolean;
  canDispense: boolean;
  canRequestDischarge: boolean;
  canApproveDischarge: boolean;
  canEditPatient: boolean;
  canDeletePatient: boolean;
  canViewAudit: boolean;
  canAcceptTest: boolean;
  canReferPatient: boolean;
  canViewBills: boolean;
  canApproveBills: boolean;
  canFinalizeDischarge: boolean;
}

export const vitalsFields = [
  { id: "bloodPressureSystolic", label: "Systolic", unit: "mmHg" },
  { id: "bloodPressureDiastolic", label: "Diastolic", unit: "mmHg" },
  { id: "heartRate", label: "Heart Rate", unit: "bpm" },
  { id: "temperature", label: "Temperature", unit: "°C" },
  { id: "oxygenSaturation", label: "O₂ Saturation", unit: "%" },
  { id: "respiratoryRate", label: "Respiratory Rate", unit: "/min" },
  { id: "bloodSugar", label: "Blood Sugar", unit: "mg/dL" },
  { id: "weight", label: "Weight", unit: "kg" },
  { id: "height", label: "Height", unit: "cm" },
  { id: "bmi", label: "BMI", unit: "" },
];
