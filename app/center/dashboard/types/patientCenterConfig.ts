export type AdmissionMode = "full" | "outpatient_only" | "none";

export interface PatientCenterConfig {
  admissionMode: AdmissionMode;
  showInpatientToggle: boolean; // in add/edit modal & OTP modal
  addBedChargeOnCreate: boolean;
  showDischarge: boolean;
  showTakeHomeMedication: boolean;
  showReferral: boolean;
  showFollowUp: boolean;
  showBilling: boolean;
  stats: {
    total: boolean;
    active: boolean;
    inpatient: boolean;
    outpatient: boolean;
  };
  // Can also include centre‑specific extra fields in the patient form
  extraFields?: string[]; // e.g., "acuity" for emergency, "toothNumber" for dental
}

const defaultHospitalConfig: PatientCenterConfig = {
  admissionMode: "full",
  showInpatientToggle: true,
  addBedChargeOnCreate: true,
  showDischarge: true,
  showTakeHomeMedication: true,
  showReferral: true,
  showFollowUp: true,
  showBilling: true,
  stats: { total: true, active: true, inpatient: true, outpatient: true },
};

export const patientCenterConfigs: Record<string, PatientCenterConfig> = {
  hospital: defaultHospitalConfig,
  clinic: {
    ...defaultHospitalConfig,
    admissionMode: "outpatient_only",
    addBedChargeOnCreate: false,
    showTakeHomeMedication: false,
    showFollowUp: false,
    stats: { total: true, active: true, inpatient: false, outpatient: true },
  },
  medical_center: {
    ...defaultHospitalConfig,
    admissionMode: "outpatient_only",
    addBedChargeOnCreate: false,
    showTakeHomeMedication: false,
    showFollowUp: false,
    stats: { total: true, active: true, inpatient: false, outpatient: true },
  },
  diagnostic_lab: {
    admissionMode: "none",
    showInpatientToggle: false,
    addBedChargeOnCreate: false,
    showDischarge: false,
    showTakeHomeMedication: false,
    showReferral: true,
    showFollowUp: false,
    showBilling: true,
    stats: { total: true, active: false, inpatient: false, outpatient: false },
  },
  pharmacy: {
    admissionMode: "none",
    showInpatientToggle: false,
    addBedChargeOnCreate: false,
    showDischarge: false,
    showTakeHomeMedication: false,
    showReferral: false,
    showFollowUp: false,
    showBilling: true,
    stats: { total: true, active: false, inpatient: false, outpatient: false },
  },
  dental_clinic: {
    admissionMode: "none",
    showInpatientToggle: false,
    addBedChargeOnCreate: false,
    showDischarge: false,
    showTakeHomeMedication: false,
    showReferral: true,
    showFollowUp: false,
    showBilling: true,
    stats: { total: true, active: false, inpatient: false, outpatient: false },
  },
  optical_center: {
    admissionMode: "none",
    showInpatientToggle: false,
    addBedChargeOnCreate: false,
    showDischarge: false,
    showTakeHomeMedication: false,
    showReferral: true,
    showFollowUp: false,
    showBilling: true,
    stats: { total: true, active: false, inpatient: false, outpatient: false },
  },
  cardiac_center: {
    ...defaultHospitalConfig,
    showTakeHomeMedication: false,
    showFollowUp: false,
  },
  emergency: {
    ...defaultHospitalConfig,
    showTakeHomeMedication: false,
    showFollowUp: false,
  },
};
