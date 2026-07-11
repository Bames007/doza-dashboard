export interface Patient {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  registeredAt: string;
  status?: "active" | "inactive" | "pending";
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

  // Ordering info
  orderedBy?: string; // user ID
  orderedByName?: string; // full name of doctor who ordered

  // Acceptance info
  acceptedBy?: string; // full name of lab tech who accepted
  acceptedAt?: string;
  acceptedById?: string;

  // Completion info
  completedBy?: string; // full name of lab tech who completed
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

export interface QC {
  id: string;
  testType: string;
  controlName: string;
  lotNumber: string;
  expiryDate?: string;
  instrument?: string;
  operator?: string;
  performedAt: string;
  performedBy: string;
  result: "pass" | "fail" | "pending";
  value?: string;
  unit?: string;
  notes?: string;
  createdAt: string;
}
