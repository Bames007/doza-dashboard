// app/types/prescription.ts
export interface Prescription {
  id: string;
  centerId: string;

  // Patient Information
  patientId?: string; // For Doza users
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: string | number;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
  patientAddress?: string;

  // Medical Information
  complaints: string;
  vitals: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  diagnosis?: string;

  // Prescription Details
  medications: PrescriptionMedication[];
  advice: string;
  notes?: string;

  // Prescriber Information
  prescribedBy: string; // User ID
  prescribedByName: string;
  prescribedByRole: "DOCTOR" | "NURSE" | "PHARMACIST";

  // Timing
  startDate: string;
  endDate?: string;
  nextRefillDate?: string;

  // Status
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";

  // Doza Features
  isDozaUser: boolean;
  dozaUserId?: string;
  remindersEnabled: boolean;
  lastReminderSent?: string;
  remindersSent?: number;

  // QR Code for non-Doza users
  qrCodeData?: string;
  slipPrinted: boolean;
  lastPrinted?: string;
  printedBy?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  // Optional fields
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface PrescriptionMedication {
  id: string;
  prescriptionId: string;
  productId: string;
  sku: string;
  name: string;
  genericName?: string;
  category?: string;

  // Dosage Information
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "Twice daily"
  duration: string; // e.g., "7 days"
  quantity: number;
  unit: string; // e.g., "tablets", "bottles"

  // Instructions
  instructions?: string;
  route: "ORAL" | "TOPICAL" | "INJECTION" | "INHALATION" | "OTHER";

  // Safety Information
  sideEffects?: string[];
  contraindications?: string[];
  warnings?: string[];

  // Stock Information
  stock?: number;
  batchNumber?: string;
  expiryDate?: string;

  // Dispensing
  dispensed: boolean;
  dispensedBy?: string;
  dispensedAt?: string;
  dispensedQuantity?: number;
  dispensedByName?: string;
}

export interface PrescriptionAudit {
  id: string;
  prescriptionId: string;
  centerId: string;
  userId: string;
  userName: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "DISPENSED"
    | "CANCELLED"
    | "COMPLETED"
    | "REMINDER_SENT"
    | "SLIP_PRINTED";
  details: string;
  metadata?: any;
  timestamp: string;
  changes?: string[];
}

export interface PatientPrescriptionHistory {
  patientId?: string;
  patientPhone: string;
  isDozaUser: boolean;
  prescriptions: Prescription[];
  lastVisit?: string;
  totalPrescriptions: number;
  patientProfile?: {
    name: string;
    phone: string;
    email?: string;
    gender?: string;
    age?: string | number;
    avatar?: string;
    bloodGroup?: string;
    genotype?: string;
    allergies?: string;
    emergencyContacts?: {
      primary: { name: string; phone: string };
      secondary: { name: string; phone: string };
    };
  };
}

export interface PatientSearchResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  age?: string | number;
  isDozaUser: boolean;
  profile: {
    avatar?: string;
    bloodGroup?: string;
    genotype?: string;
    lastVisit?: string;
    prescriptionCount: number;
  };
}

export interface CreatePrescriptionRequest {
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  patientAge?: string | number;
  patientGender?: "MALE" | "FEMALE" | "OTHER";
  patientAddress?: string;
  complaints: string;
  vitals?: {
    bloodPressure?: string;
    temperature?: string;
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  diagnosis?: string;
  medications: Omit<
    PrescriptionMedication,
    "id" | "prescriptionId" | "dispensed"
  >[];
  advice?: string;
  notes?: string;
  prescribedByName: string;
  prescribedByRole: "DOCTOR" | "NURSE" | "PHARMACIST";
  startDate?: string;
  endDate?: string;
  nextRefillDate?: string;
  remindersEnabled?: boolean;
  centerName?: string;
}
