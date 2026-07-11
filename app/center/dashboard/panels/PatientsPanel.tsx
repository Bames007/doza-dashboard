// app/center/dashboard/panels/PatientsPanel.tsx

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Users,
  Search,
  Eye,
  X,
  UserPlus,
  Clock,
  Activity,
  AlertCircle,
  ChevronRight,
  Bed,
  FileText,
  User,
  FileSignature,
  Microscope,
  Hospital,
  Lock,
  Pill,
  HeartPulse,
  FileCheck,
  Calendar,
  UserCircle,
  PlayCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Send,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { usePatients, usePatientTests } from "../dashboards/hooks/usePatients";
import { useAuditLog } from "../dashboards/hooks/useAuditLog";
import DeleteConfirm from "../components/DeleteConfirm";
import type { Patient } from "../dashboards/hooks/usePatients";

// Import modal components
import TestPanelModal from "../dashboards/components/patient_panel/TestPanelModal";
import NoteModal from "../dashboards/components/patient_panel/NoteModal";
import VitalsModal, {
  VitalsField,
} from "../dashboards/components/patient_panel/VitalsModal";
import PrescriptionModal from "../dashboards/components/patient_panel/PrescriptionModal";
import DispenseModal from "../dashboards/components/patient_panel/DispenseModal";
import PatientModal from "../dashboards/components/patient_panel/PatientModal";
import VitalsChartModal from "../dashboards/components/patient_panel/VitalsChartModal";

// ─── Helpers ──────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const getDateLabel = (dateStr: string) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(dateStr);
  const dateKey = d.toISOString().split("T")[0];
  const todayKey = today.toISOString().split("T")[0];
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return formatDate(dateStr);
};

const formatAge = (dob: string) => {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} years`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "inactive":
      return "text-slate-600 bg-slate-100 border-slate-200";
    case "discharge_pending":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-slate-600 bg-slate-100 border-slate-200";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Discharged";
    case "discharge_pending":
      return "Discharge Pending";
    default:
      return status;
  }
};

// ─── Role Normalization ──────────────────────────────────────────────

const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (
    r.includes("medical officer") ||
    r.includes("doctor") ||
    r.includes("physician")
  )
    return "doctor";
  if (r.includes("nurse")) return "nurse";
  if (r.includes("lab technician") || r.includes("lab tech"))
    return "lab_technician";
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (
    r.includes("admin") ||
    r.includes("manager") ||
    r.includes("owner") ||
    r.includes("director")
  )
    return "admin";
  if (r.includes("support") || r.includes("reception")) return "support";
  return "support";
};

// ─── Extended Patient Type ──────────────────────────────────────────

type ExtendedPatient = Patient & {
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
};

// ─── Permission Hook ──────────────────────────────────────────────────

type UserRole =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "hospital_nurse"
  | "pharmacy_nurse"
  | "pharmacist"
  | "lab_technician"
  | "receptionist"
  | "center_owner"
  | "center_head"
  | "billing"
  | "support";

interface Permissions {
  canViewPatientList: boolean;
  canViewDemographics: boolean;
  canViewAllergies: boolean;
  canViewProblemList: boolean;
  canViewMedications: boolean;
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
}

export function usePatientPermissions(role?: string): Permissions {
  const normalized = normalizeRole(role);
  const roleLower = normalized.toLowerCase();

  const base: Permissions = {
    canViewPatientList: false,
    canViewDemographics: false,
    canViewAllergies: false,
    canViewProblemList: false,
    canViewMedications: false,
    canViewDoctorNotes: false,
    canViewNursingNotes: false,
    canViewVitals: false,
    canViewTestOrders: false,
    canViewTestResults: false,
    canViewPrescriptions: false,
    canViewBilling: false,
    canAddPatient: false,
    canAddDoctorNote: false,
    canAddNursingNote: false,
    canUpdateVitals: false,
    canOrderTest: false,
    canEnterTestResult: false,
    canPrescribe: false,
    canDispense: false,
    canRequestDischarge: false,
    canApproveDischarge: false,
    canEditPatient: false,
    canDeletePatient: false,
    canViewAudit: false,
    canAcceptTest: false,
    canReferPatient: false,
  };

  base.canViewPatientList = true;
  base.canViewDemographics = true;

  if (roleLower === "doctor" || roleLower === "hospital_admin") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewNursingNotes = true;
    base.canViewVitals = true;
    base.canViewTestOrders = true;
    base.canViewTestResults = true;
    base.canViewPrescriptions = true;
    base.canAddDoctorNote = true;
    base.canOrderTest = true;
    base.canPrescribe = true;
    base.canRequestDischarge = true;
    base.canApproveDischarge = true;
    base.canEditPatient = true;
    base.canViewAudit = true;
    base.canReferPatient = true;
  }

  if (roleLower === "nurse") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewNursingNotes = true;
    base.canViewVitals = true;
    base.canViewTestOrders = true;
    base.canViewTestResults = true;
    base.canViewPrescriptions = true;
    base.canAddNursingNote = true;
    base.canUpdateVitals = true;
    base.canRequestDischarge = true;
    base.canAddPatient = true;
    base.canEditPatient = true;
  }

  if (roleLower === "lab_technician") {
    base.canViewTestOrders = true;
    base.canViewTestResults = true;
    base.canEnterTestResult = true;
    base.canAcceptTest = true;
  }

  if (roleLower === "pharmacist") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewPrescriptions = true;
    base.canDispense = true;
  }

  if (roleLower === "admin" || roleLower === "owner") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewNursingNotes = true;
    base.canViewVitals = true;
    base.canViewTestOrders = true;
    base.canViewTestResults = true;
    base.canViewPrescriptions = true;
    base.canViewBilling = true;
    base.canAddPatient = true;
    base.canEditPatient = true;
    base.canDeletePatient = true;
    base.canApproveDischarge = true;
    base.canViewAudit = true;
    base.canReferPatient = true;
  }

  if (roleLower === "billing") {
    base.canViewDemographics = true;
    base.canViewBilling = true;
  }

  if (roleLower === "support" || roleLower === "reception") {
    base.canViewDemographics = true;
  }

  return base;
}

// ─── Vitals Fields Configuration ──────────────────────────────────

const vitalsFields: VitalsField[] = [
  {
    id: "bloodPressureSystolic",
    label: "Systolic",
    unit: "mmHg",
    placeholder: "120",
  },
  {
    id: "bloodPressureDiastolic",
    label: "Diastolic",
    unit: "mmHg",
    placeholder: "80",
  },
  { id: "heartRate", label: "Heart Rate", unit: "bpm", placeholder: "72" },
  {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    placeholder: "36.5",
    step: 0.1,
  },
  {
    id: "oxygenSaturation",
    label: "O₂ Saturation",
    unit: "%",
    placeholder: "98",
    min: 0,
    max: 100,
  },
  {
    id: "respiratoryRate",
    label: "Respiratory Rate",
    unit: "/min",
    placeholder: "16",
  },
  { id: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", placeholder: "120" },
  { id: "weight", label: "Weight", unit: "kg", placeholder: "70", step: 0.1 },
  { id: "height", label: "Height", unit: "cm", placeholder: "175", step: 0.1 },
  { id: "bmi", label: "BMI", unit: "", placeholder: "22.9", step: 0.1 },
];

// ─── Timeline Event Interface ──────────────────────────────────────

interface TimelineEvent {
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
    | "referral";
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

// ─── Timeline Hook ──────────────────────────────────────────────────

function usePatientTimeline(
  patient: ExtendedPatient | null,
  tests: any[],
  userRole: string,
  permissions: Permissions,
  currentUser?: { id: string; fullName: string },
): TimelineEvent[] {
  return useMemo(() => {
    if (!patient) return [];

    const events: TimelineEvent[] = [];

    // Admission
    if (patient.admissionDate) {
      events.push({
        id: `admission-${patient.id}`,
        type: "admission",
        timestamp: patient.admissionDate,
        actor: {
          id: patient.registeredBy || "system",
          fullName: "System",
          role: "System",
        },
        action: "admitted",
        description: `Admitted as ${patient.patientType || "outpatient"}`,
        data: { patientType: patient.patientType },
        permissions: { canView: ["*"], canEdit: [] },
      });
    }

    // Doctor notes
    if (patient.doctorNotes?.length) {
      patient.doctorNotes.forEach((note, idx) => {
        events.push({
          id: `doctor-note-${patient.id}-${idx}`,
          type: "doctor-note",
          timestamp: note.timestamp,
          actor: {
            id: note.authorId,
            fullName: note.authorName || "Doctor",
            role: "Doctor",
          },
          action: "added a doctor's note",
          description:
            note.content.substring(0, 80) +
            (note.content.length > 80 ? "…" : ""),
          data: note,
          permissions: {
            canView: ["doctor", "nurse", "admin", "pharmacist"],
            canEdit: ["doctor"],
          },
        });
      });
    }

    // Nursing notes
    if (patient.nursingNotes?.length) {
      patient.nursingNotes.forEach((note, idx) => {
        events.push({
          id: `nursing-note-${patient.id}-${idx}`,
          type: "nursing-note",
          timestamp: note.timestamp,
          actor: {
            id: note.authorId,
            fullName: note.authorName || "Nurse",
            role: "Nurse",
          },
          action: "added a nursing note",
          description:
            note.content.substring(0, 80) +
            (note.content.length > 80 ? "…" : ""),
          data: note,
          permissions: {
            canView: ["doctor", "nurse", "admin"],
            canEdit: ["nurse"],
          },
        });
      });
    }

    // Vitals History
    if (patient.vitalsHistory?.length) {
      patient.vitalsHistory.forEach((record, idx) => {
        const parts: string[] = [];
        vitalsFields.forEach((field) => {
          const val = record[field.id];
          if (val !== undefined && val !== null) {
            parts.push(
              `${field.label} ${val}${field.unit ? " " + field.unit : ""}`,
            );
          }
        });
        const vitalsStr = parts.join(" • ") || "Vitals updated";

        events.push({
          id: `vitals-${patient.id}-${idx}`,
          type: "vitals",
          timestamp: record.timestamp || patient.registeredAt,
          actor: {
            id: record.recordedById || patient.registeredBy || "system",
            fullName: record.recordedBy || "System",
            role: "Nurse",
          },
          action: "recorded vitals",
          description: vitalsStr,
          data: record,
          permissions: {
            canView: ["doctor", "nurse", "admin"],
            canEdit: ["nurse"],
          },
        });
      });
    }

    // Lab tests
    const patientTests = tests.filter((t) => t.patientId === patient.id);
    patientTests.forEach((test) => {
      let statusExtra = "";
      if (test.status === "processing" && test.acceptedBy) {
        statusExtra = ` (accepted by ${test.acceptedBy})`;
      } else if (test.status === "completed" && test.completedBy) {
        statusExtra = ` (completed by ${test.completedBy})`;
      } else if (test.status === "pending") {
        statusExtra = " (pending)";
      }

      let doctorName = test.orderedByName;
      if (!doctorName && currentUser && test.orderedBy === currentUser.id) {
        doctorName = currentUser.fullName;
      }
      if (!doctorName) {
        doctorName = "Doctor";
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `Test ${test.id} (${test.testType}) is missing orderedByName. Ordered by: ${test.orderedBy || "unknown"}`,
          );
        }
      }

      const eventTimestamp =
        test.createdAt || test.collectionDate || new Date().toISOString();

      events.push({
        id: `lab-test-${test.id}`,
        type: "lab-test",
        timestamp: eventTimestamp,
        actor: {
          id: test.orderedBy || "system",
          fullName: doctorName,
          role: "Doctor",
        },
        action: `ordered a lab test${statusExtra}`,
        description: `${test.testType} - ${test.status}${test.collectionDate ? ` (Collection: ${formatDate(test.collectionDate)})` : ""}`,
        data: test,
        permissions: {
          canView: ["doctor", "nurse", "lab_technician", "admin"],
          canEdit: ["lab_technician"],
        },
      });
    });

    // Prescriptions – no emojis, just status
    if (patient.prescriptions?.length) {
      patient.prescriptions.forEach((rx, idx) => {
        let actionText = "prescribed medication";
        if (rx.dispensedStatus && rx.dispensedStatus !== "none") {
          actionText = `dispensed (${rx.dispensedStatus})`;
        }
        events.push({
          id: `prescription-${patient.id}-${idx}`,
          type: "prescription",
          timestamp: rx.prescribedAt || patient.registeredAt,
          actor: {
            id: rx.prescribedBy || "system",
            fullName: rx.prescribedBy || "Doctor",
            role: "Doctor",
          },
          action: actionText,
          description: `${rx.medication} ${rx.dosage}`,
          data: {
            ...rx,
            _dispensedStatus: rx.dispensedStatus || "none",
          },
          permissions: {
            canView: ["doctor", "nurse", "pharmacist", "admin"],
            canEdit: ["pharmacist"],
          },
        });
      });
    }

    // Discharge with summary
    if (patient.dischargeDate) {
      const summary = patient.dischargeSummary
        ? ` – Summary: ${patient.dischargeSummary.substring(0, 60)}${patient.dischargeSummary.length > 60 ? "…" : ""}`
        : "";
      events.push({
        id: `discharge-${patient.id}`,
        type: "discharge",
        timestamp: patient.dischargeDate,
        actor: {
          id: patient.dischargeRequestedBy || "system",
          fullName: patient.dischargeRequestedBy || "System",
          role: "Doctor",
        },
        action: "discharged patient",
        description: `Patient discharged${summary}`,
        data: { summary: patient.dischargeSummary },
        permissions: {
          canView: ["doctor", "nurse", "admin", "billing"],
          canEdit: [],
        },
      });
    }

    // Referral
    if (patient.referral) {
      events.push({
        id: `referral-${patient.id}`,
        type: "referral",
        timestamp: patient.referral.referredAt || patient.registeredAt,
        actor: {
          id: patient.referral.referredBy || "system",
          fullName: patient.referral.referredBy || "System",
          role: "Doctor",
        },
        action: `referred patient to ${patient.referral.toCenterName}`,
        description: `Reason: ${patient.referral.reason} – Status: ${patient.referral.status}`,
        data: patient.referral,
        permissions: {
          canView: ["doctor", "nurse", "admin", "billing"],
          canEdit: [],
        },
      });
    }

    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const filtered = events.filter((event) => {
      const canView = event.permissions.canView;
      if (canView.includes("*")) return true;
      return canView.some((r) => userRole.toLowerCase().includes(r));
    });

    return filtered;
  }, [patient, tests, userRole, permissions, currentUser]);
}

// ─── Main Panel Component ──────────────────────────────────────────

export default function PatientsPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const permissions = usePatientPermissions(user?.role);

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    patients,
    loading: patientsLoading,
    refetch: refetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
  } = usePatients(center?.id, user?.id);

  const {
    tests: patientTests,
    refetch: refetchTests,
    createTest,
    updateTest,
  } = usePatientTests(center?.id, user?.id);

  // ─── State ────────────────────────────────────────────────────────
  const initialVitalsForm = vitalsFields.reduce(
    (acc, field) => {
      acc[field.id] = "";
      return acc;
    },
    {} as Record<string, string>,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [selectedTimelineEvent, setSelectedTimelineEvent] =
    useState<TimelineEvent | null>(null);
  const [fullPatient, setFullPatient] = useState<ExtendedPatient | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<ExtendedPatient | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [showTestModal, setShowTestModal] = useState<ExtendedPatient | null>(
    null,
  );
  const [showNoteModal, setShowNoteModal] = useState<{
    patientId: string;
    type: "doctor" | "nurse";
  } | null>(null);
  const [showVitalsModal, setShowVitalsModal] =
    useState<ExtendedPatient | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] =
    useState<ExtendedPatient | null>(null);
  const [showReferralModal, setShowReferralModal] =
    useState<ExtendedPatient | null>(null);
  const [dispenseModal, setDispenseModal] = useState<{
    patientId: string;
    prescriptionIndex: number;
  } | null>(null);

  // ─── Vitals Chart Modal state ────────────────────────────────────
  const [showVitalsChartModal, setShowVitalsChartModal] = useState(false); // ✅ moved inside component

  const [noteContent, setNoteContent] = useState("");
  const [vitalsForm, setVitalsForm] =
    useState<Record<string, string>>(initialVitalsForm);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "",
    duration: "",
    instructions: "",
  });
  const [testResultForm, setTestResultForm] = useState({
    value: "",
    unit: "",
    referenceRange: "",
    notes: "",
  });
  const [referralForm, setReferralForm] = useState({
    toCenterId: "",
    reason: "",
  });
  const [availableCenters, setAvailableCenters] = useState<any[]>([]);

  // Fetch test catalog
  const [testCatalog, setTestCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      if (!center?.id) return;
      setCatalogLoading(true);
      try {
        const res = await fetch(`/api/centers/${center.id}/tests`, {
          headers: { "x-user-id": user?.id || "" },
        });
        const data = await res.json();
        if (data.success) setTestCatalog(data.data || []);
      } catch (error) {
        console.error("Failed to fetch test catalog", error);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
  }, [center?.id, user?.id]);

  // ─── Fetch available centers for referral ──────────────────────
  useEffect(() => {
    const fetchCenters = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/centers/network`, {
          headers: { "x-user-id": user.id },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          const filtered = data.data.filter((c: any) => c.id !== center?.id);
          setAvailableCenters(filtered);
        } else {
          setAvailableCenters([]);
        }
      } catch (error) {
        setAvailableCenters([]);
      }
    };
    if (permissions.canReferPatient) {
      fetchCenters();
    }
  }, [center?.id, user?.id, permissions.canReferPatient]);

  // ─── Refetch tests when selected patient changes ──────────────
  useEffect(() => {
    if (selectedPatientId && center?.id && user?.id) {
      refetchTests(selectedPatientId);
    }
  }, [selectedPatientId, center?.id, user?.id, refetchTests]);

  // ─── Fetch full patient details ─────────────────────────────────
  useEffect(() => {
    const fetchFullPatient = async () => {
      if (!selectedPatientId || !center?.id || !user?.id) {
        setFullPatient(null);
        return;
      }
      try {
        const res = await fetch(
          `/api/centers/${center.id}/patients/${selectedPatientId}`,
          {
            headers: { "x-user-id": user.id },
          },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.success) {
          setFullPatient(data.data as ExtendedPatient);
        } else {
          const listPatient = patients.find((p) => p.id === selectedPatientId);
          if (listPatient) setFullPatient(listPatient as ExtendedPatient);
        }
      } catch (err) {
        const listPatient = patients.find((p) => p.id === selectedPatientId);
        if (listPatient) setFullPatient(listPatient as ExtendedPatient);
      }
    };
    fetchFullPatient();
  }, [selectedPatientId, center?.id, user?.id, patients]);

  const refreshFullPatient = async () => {
    if (!selectedPatientId || !center?.id || !user?.id) return;
    try {
      const res = await fetch(
        `/api/centers/${center.id}/patients/${selectedPatientId}`,
        {
          headers: { "x-user-id": user.id },
        },
      );
      const data = await res.json();
      if (data.success) setFullPatient(data.data);
    } catch (e) {
      /* ignore */
    }
  };

  // ─── Refresh handler ──────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchPatients();
      if (selectedPatientId) {
        await refetchTests(selectedPatientId);
        await refreshFullPatient();
      } else {
        await refetchTests();
      }
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ─── Computed ────────────────────────────────────────────────────
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.phone?.includes(term) ||
        p.id.toLowerCase().includes(term) ||
        p.patientType?.toLowerCase().includes(term),
    );
  }, [patients, searchTerm]);

  const selectedPatient =
    fullPatient ||
    (patients.find((p) => p.id === selectedPatientId) as ExtendedPatient) ||
    null;

  const timelineEvents = usePatientTimeline(
    selectedPatient,
    patientTests,
    normalizedRole,
    permissions,
    user,
  );

  const groupedTimeline = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    timelineEvents.forEach((event) => {
      const dateKey = new Date(event.timestamp).toISOString().split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return groups;
  }, [timelineEvents]);

  const involvedMedics = useMemo(() => {
    if (!selectedPatient) return [];
    const authors = new Set<string>();

    (selectedPatient.doctorNotes || []).forEach((n) =>
      authors.add(n.authorName),
    );
    (selectedPatient.nursingNotes || []).forEach((n) =>
      authors.add(n.authorName),
    );

    patientTests
      .filter((t) => t.patientId === selectedPatientId)
      .forEach((t) => {
        if (t.orderedByName) authors.add(t.orderedByName);
      });

    patientTests
      .filter((t) => t.patientId === selectedPatientId)
      .forEach((t) => {
        if (t.acceptedBy) authors.add(t.acceptedBy);
        if (t.completedBy) authors.add(t.completedBy);
      });

    return Array.from(authors);
  }, [selectedPatient, patientTests, selectedPatientId]);

  const eventCounts = useMemo(
    () => ({
      doctorNotes: selectedPatient?.doctorNotes?.length || 0,
      nursingNotes: selectedPatient?.nursingNotes?.length || 0,
      vitalsHistory: selectedPatient?.vitalsHistory?.length || 0,
      prescriptions: selectedPatient?.prescriptions?.length || 0,
      tests: patientTests.filter((t) => t.patientId === selectedPatientId)
        .length,
    }),
    [selectedPatient, patientTests, selectedPatientId],
  );

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setSelectedTimelineEvent(null);
    logAction("view", "patient", patientId, `Viewed patient`);
  };

  const handleSelectTimelineEvent = (event: TimelineEvent) =>
    setSelectedTimelineEvent(event);

  const handleCreateTest = async (
    patientId: string,
    patientName: string,
    testId: string,
    testName: string,
    sampleType: string,
  ) => {
    try {
      await createTest({
        patientId,
        patientName,
        testType: testName,
        sampleType: sampleType || "",
        collectionDate: new Date().toISOString().split("T")[0],
        status: "pending",
        orderedBy: user?.id,
        orderedByName: user?.fullName || "Doctor",
      });
      setShowTestModal(null);
      await refetchTests(patientId);
      await refreshFullPatient();
      logAction("create", "lab-test", patientId, `Ordered test ${testName}`);
    } catch (err) {
      alert("Failed to create test");
    }
  };

  const handleAcceptTest = async (testId: string) => {
    try {
      await updateTest(testId, {
        status: "processing",
        acceptedBy: user?.fullName || "Lab Technician",
        acceptedAt: new Date().toISOString(),
        acceptedById: user?.id,
      });
      await refetchTests(selectedPatientId || undefined);
      await refreshFullPatient();
      logAction("update", "lab-test", testId, "Accepted lab test");
    } catch (err) {
      alert("Failed to accept test");
    }
  };

  const handleAddNote = async (patientId: string, type: "doctor" | "nurse") => {
    if (!noteContent.trim()) return;
    try {
      const field = type === "doctor" ? "doctorNotes" : "nursingNotes";
      const currentNotes = selectedPatient?.[field] || [];
      const newNote = {
        authorId: user?.id || "",
        authorName: user?.fullName || "Unknown",
        timestamp: new Date().toISOString(),
        content: noteContent,
      };
      await updatePatient(patientId, {
        [field]: [...currentNotes, newNote],
      } as any);
      setNoteContent("");
      setShowNoteModal(null);
      await refetchPatients();
      await refreshFullPatient();
      logAction("update", "patient", patientId, `Added ${type} note`);
    } catch (err) {
      alert("Failed to add note");
    }
  };

  const handleAddVitals = async (patientId: string) => {
    const newVitals: Record<string, any> = {};
    vitalsFields.forEach((field) => {
      const value = vitalsForm[field.id];
      if (value !== undefined && value !== "") {
        const num = parseFloat(value);
        newVitals[field.id] = isNaN(num) ? value : num;
      }
    });
    if (Object.keys(newVitals).length === 0) {
      alert("Please fill in at least one vital sign.");
      return;
    }
    try {
      const currentPatient = patients.find(
        (p) => p.id === patientId,
      ) as ExtendedPatient;
      if (!currentPatient) throw new Error("Patient not found");
      const currentVitals = currentPatient.vitals || {};
      const mergedVitals = { ...currentVitals, ...newVitals };
      const historyEntry = {
        timestamp: new Date().toISOString(),
        recordedBy: user?.fullName || "Unknown",
        recordedById: user?.id || "system",
        ...mergedVitals,
      };
      const currentHistory = currentPatient.vitalsHistory || [];
      const updatedHistory = [...currentHistory, historyEntry];
      await updatePatient(patientId, {
        vitals: mergedVitals,
        vitalsHistory: updatedHistory,
      } as any);
      setShowVitalsModal(null);
      setVitalsForm(initialVitalsForm);
      await refetchPatients();
      await refreshFullPatient();
      logAction("update", "patient", patientId, "Updated vitals");
    } catch (err) {
      alert("Failed to update vitals");
    }
  };

  const handleAddPrescription = async (
    patientId: string,
    data: {
      medication: string;
      dosage: string;
      frequency: string;
      route: string;
      duration: string;
      instructions: string;
    },
  ) => {
    const newRx = {
      ...data,
      prescribedBy: user?.fullName || "Unknown",
      prescribedAt: new Date().toISOString(),
      dispensed: false,
      dispensedStatus: "none" as const,
    };
    try {
      const currentPatient = patients.find((p) => p.id === patientId);
      const currentRx = currentPatient?.prescriptions || [];
      await updatePatient(patientId, {
        prescriptions: [...currentRx, newRx],
      });
      setShowPrescriptionModal(null);
      await refetchPatients();
      await refreshFullPatient();
      logAction(
        "create",
        "prescription",
        patientId,
        `Prescribed ${data.medication}`,
      );
    } catch (err) {
      alert("Failed to add prescription");
    }
  };

  const handleDispensePrescription = async (
    patientId: string,
    prescriptionIndex: number,
    dispenseData: {
      status: "full" | "partial" | "out_of_stock" | "cancelled";
      quantity?: number;
      notes?: string;
    },
  ) => {
    const patient = patients.find((p) => p.id === patientId) as ExtendedPatient;
    if (!patient || !patient.prescriptions) return;
    const updatedPrescriptions = [...patient.prescriptions];
    const rx = updatedPrescriptions[prescriptionIndex];
    if (!rx) return;
    updatedPrescriptions[prescriptionIndex] = {
      ...rx,
      dispensed: true,
      dispensedStatus: dispenseData.status,
      dispensedQuantity: dispenseData.quantity,
      pharmacistNotes: dispenseData.notes,
      dispensedAt: new Date().toISOString(),
      dispensedById: user?.id,
    };
    try {
      await updatePatient(patientId, {
        prescriptions: updatedPrescriptions,
      } as any);
      await refetchPatients();
      await refreshFullPatient();
      logAction(
        "update",
        "prescription",
        patientId,
        `Dispensed ${rx.medication} – ${dispenseData.status}${dispenseData.quantity ? ` (${dispenseData.quantity} units)` : ""}`,
      );
      setDispenseModal(null);
    } catch (err) {
      alert("Failed to update prescription");
    }
  };

  const handleUpdateTestResult = async (testId: string, resultData: any) => {
    await updateTest(testId, {
      ...resultData,
      status: "completed",
      completedBy: user?.fullName || "Unknown",
      completedAt: new Date().toISOString(),
      result: {
        ...resultData.result,
        concludedBy: user?.fullName || "Unknown",
        concludedByName: user?.fullName || "Unknown",
      },
    });
    await refetchTests(selectedPatientId || undefined);
    await refreshFullPatient();
    setTestResultForm({ value: "", unit: "", referenceRange: "", notes: "" });
  };

  // ─── Discharge with summary ──────────────────────────────────────
  const handleDischargePatient = async (patientId: string) => {
    const summary = prompt(
      "Enter discharge summary (optional):",
      selectedPatient?.dischargeSummary || "",
    );
    if (summary === null) return;
    if (!confirm("Discharge this patient? This will mark them as inactive."))
      return;
    try {
      await updatePatient(patientId, {
        status: "inactive",
        dischargeDate: new Date().toISOString(),
        dischargeRequested: false,
        dischargeSummary: summary || "",
      } as any);
      await refetchPatients();
      await refreshFullPatient();
      const patient = patients.find((p) => p.id === patientId);
      logAction(
        "update",
        "patient",
        patientId,
        `Discharged patient ${patient?.fullName}${summary ? " with summary" : ""}`,
      );
    } catch (err) {
      alert("Failed to discharge patient");
    }
  };

  const handleRequestDischarge = async (patientId: string) => {
    if (
      !confirm(
        "Request discharge for this patient? This will be sent for approval.",
      )
    )
      return;
    try {
      await updatePatient(patientId, {
        dischargeRequested: true,
        dischargeRequestedBy: user?.fullName || "Unknown",
        dischargeRequestedAt: new Date().toISOString(),
        status: "discharge_pending",
      } as any);
      await refetchPatients();
      await refreshFullPatient();
      const patient = patients.find((p) => p.id === patientId);
      logAction(
        "update",
        "patient",
        patientId,
        `Requested discharge for ${patient?.fullName}`,
      );
    } catch (err) {
      alert("Failed to request discharge");
    }
  };

  // ─── Referral ─────────────────────────────────────────────────────
  const handleReferPatient = async (patientId: string) => {
    const { toCenterId, reason } = referralForm;
    if (!toCenterId || !reason.trim()) {
      alert("Please select a center and enter a reason.");
      return;
    }
    try {
      const targetCenter = availableCenters.find((c) => c.id === toCenterId);
      await updatePatient(patientId, {
        referral: {
          toCenterId,
          toCenterName: targetCenter?.centerName || "Unknown",
          reason: reason.trim(),
          referredBy: user?.fullName || "Unknown",
          referredAt: new Date().toISOString(),
          status: "pending",
        },
      } as any);
      setShowReferralModal(null);
      setReferralForm({ toCenterId: "", reason: "" });
      await refetchPatients();
      await refreshFullPatient();
      logAction(
        "update",
        "patient",
        patientId,
        `Referred patient to ${targetCenter?.centerName || "Unknown"}`,
      );
    } catch (err) {
      alert("Failed to refer patient");
    }
  };

  const handleDispenseRequest = (
    patientId: string,
    prescriptionIndex: number,
  ) => {
    setDispenseModal({ patientId, prescriptionIndex });
  };

  if (patientsLoading) return <PatientSkeleton />;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* ─── Header ────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Patient Management
              </span>
              <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {patients.length} patients
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Patients
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-md">
              Manage patient records, timelines, and clinical notes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Refresh data"
              aria-label="Refresh data"
            >
              {isRefreshing ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <RefreshCw className="w-5 h-5 text-slate-700" />
              )}
            </button>
            {permissions.canAddPatient && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Patient
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={patients.length}
            icon={Users}
            color="emerald"
          />
          <StatCard
            label="Active"
            value={patients.filter((p) => p.status === "active").length}
            icon={Activity}
            color="blue"
          />
          <StatCard
            label="Inpatients"
            value={patients.filter((p) => p.patientType === "inpatient").length}
            icon={Bed}
            color="purple"
          />
          <StatCard
            label="Outpatients"
            value={
              patients.filter((p) => p.patientType === "outpatient").length
            }
            icon={User}
            color="rose"
          />
        </div>

        {/* 3‑Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PatientList
            patients={filteredPatients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={handleSelectPatient}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            permissions={permissions}
          />

          <Timeline
            selectedPatient={selectedPatient}
            timelineEvents={timelineEvents}
            groupedTimeline={groupedTimeline}
            selectedTimelineEvent={selectedTimelineEvent}
            onSelectTimelineEvent={handleSelectTimelineEvent}
            involvedMedics={involvedMedics}
            eventCounts={eventCounts}
            permissions={permissions}
            onShowVitalsModal={() =>
              selectedPatient && setShowVitalsModal(selectedPatient)
            }
            onShowNoteModal={(type: "doctor" | "nurse") =>
              selectedPatient &&
              setShowNoteModal({ patientId: selectedPatient.id, type })
            }
            onShowTestModal={() =>
              selectedPatient && setShowTestModal(selectedPatient)
            }
            onShowPrescriptionModal={() =>
              selectedPatient && setShowPrescriptionModal(selectedPatient)
            }
            onDischarge={() =>
              selectedPatient && handleDischargePatient(selectedPatient.id)
            }
            onRequestDischarge={() =>
              selectedPatient && handleRequestDischarge(selectedPatient.id)
            }
            onShowReferralModal={() =>
              permissions.canReferPatient &&
              selectedPatient &&
              setShowReferralModal(selectedPatient)
            }
            onDispenseRequest={handleDispenseRequest}
            onShowVitalsChart={() => setShowVitalsChartModal(true)} // ✅ new prop
          />

          <DetailView
            selectedTimelineEvent={selectedTimelineEvent}
            permissions={permissions}
            user={user}
            normalizedRole={normalizedRole}
            testResultForm={testResultForm}
            setTestResultForm={setTestResultForm}
            onUpdateTestResult={handleUpdateTestResult}
            onAcceptTest={handleAcceptTest}
            onDispenseRequest={handleDispenseRequest}
            selectedPatientId={selectedPatientId}
            refreshTimeline={refreshFullPatient}
            patientTests={patientTests}
          />
        </div>

        {/* ─── Modals ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(showAddModal || editingPatient) && (
            <PatientModal
              patient={editingPatient}
              onClose={() => {
                setShowAddModal(false);
                setEditingPatient(null);
              }}
              onSave={async (data: any) => {
                if (editingPatient) {
                  await updatePatient(editingPatient.id, data);
                  logAction(
                    "update",
                    "patient",
                    editingPatient.id,
                    "Updated patient",
                  );
                } else {
                  const newPatient = await addPatient(data);
                  logAction(
                    "create",
                    "patient",
                    newPatient.id,
                    "Created patient",
                  );
                }
                setShowAddModal(false);
                setEditingPatient(null);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTestModal && (
            <TestPanelModal
              patient={showTestModal}
              onClose={() => setShowTestModal(null)}
              onCreate={handleCreateTest}
              testCatalog={testCatalog}
              catalogLoading={catalogLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNoteModal && (
            <NoteModal
              patientId={showNoteModal.patientId}
              type={showNoteModal.type}
              noteContent={noteContent}
              setNoteContent={setNoteContent}
              onSave={() =>
                handleAddNote(showNoteModal.patientId, showNoteModal.type)
              }
              onClose={() => {
                setShowNoteModal(null);
                setNoteContent("");
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVitalsModal && (
            <VitalsModal
              patient={showVitalsModal}
              vitalsForm={vitalsForm}
              setVitalsForm={setVitalsForm}
              fields={vitalsFields}
              onSave={() => handleAddVitals(showVitalsModal.id)}
              onClose={() => {
                setShowVitalsModal(null);
                setVitalsForm(initialVitalsForm);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPrescriptionModal && (
            <PrescriptionModal
              patient={showPrescriptionModal}
              onClose={() => {
                setShowPrescriptionModal(null);
              }}
              onSave={async (data) => {
                await handleAddPrescription(showPrescriptionModal.id, data);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showReferralModal && selectedPatient && (
            <ReferralModal
              patient={selectedPatient}
              onClose={() => {
                setShowReferralModal(null);
                setReferralForm({ toCenterId: "", reason: "" });
              }}
              centers={availableCenters}
              form={referralForm}
              setForm={setReferralForm}
              onSubmit={handleReferPatient}
            />
          )}
        </AnimatePresence>

        {showDeleteConfirm && (
          <DeleteConfirm
            onConfirm={() => deletePatient(showDeleteConfirm)}
            onCancel={() => setShowDeleteConfirm(null)}
          />
        )}

        {/* ─── Vitals Chart Modal ──────────────────────────────────── */}
        <AnimatePresence>
          {showVitalsChartModal && selectedPatient && (
            <VitalsChartModal
              isOpen={showVitalsChartModal}
              onClose={() => setShowVitalsChartModal(false)}
              patientName={selectedPatient.fullName}
              vitalsHistory={selectedPatient.vitalsHistory || []}
            />
          )}
        </AnimatePresence>

        {/* Dispense Modal */}
        <AnimatePresence>
          {dispenseModal && selectedPatient && (
            <DispenseModal
              patientName={selectedPatient.fullName}
              medication={
                selectedPatient.prescriptions?.[dispenseModal.prescriptionIndex]
                  ?.medication || "Unknown"
              }
              onClose={() => setDispenseModal(null)}
              onDispense={async (data) => {
                await handleDispensePrescription(
                  dispenseModal.patientId,
                  dispenseModal.prescriptionIndex,
                  data,
                );
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────

// ─── StatCard ──────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={cn(
              "text-2xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Patient List ──────────────────────────────────────────────────

function PatientList({
  patients,
  selectedPatientId,
  onSelectPatient,
  searchTerm,
  setSearchTerm,
  permissions,
}: any) {
  return (
    <div className="lg:col-span-1 bg-white flex flex-col rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Patients
          </span>
          <span className="flex items-center justify-center bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-inset ring-slate-200">
            {patients.length}
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 placeholder:text-slate-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
            aria-label="Search patients"
          />
        </div>
      </div>

      <div className="max-h-[550px] overflow-y-auto flex-1 divide-y divide-slate-50">
        {patients.length === 0 ? (
          <div className="p-8 m-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No patients found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search
            </p>
          </div>
        ) : (
          patients.map((patient: any) => {
            const isSelected = selectedPatientId === patient.id;
            const isActive = patient.status === "active";
            const isDischargePending = patient.status === "discharge_pending";
            const allergies = patient.allergies || [];
            const hasAllergies = allergies.length > 0;
            return (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={cn(
                  "w-full relative text-left px-4 py-3.5 transition-all duration-200 group flex items-start gap-3.5 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                  isSelected
                    ? "bg-emerald-50/50"
                    : "bg-white hover:bg-slate-50",
                )}
                aria-current={isSelected ? "true" : undefined}
              >
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full shadow-[1px_0_4px_rgba(16,185,129,0.4)]" />
                )}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                    {patient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                      isActive
                        ? "bg-emerald-400"
                        : isDischargePending
                          ? "bg-amber-400"
                          : "bg-slate-400",
                    )}
                  />
                  {hasAllergies && (
                    <div
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm"
                      title="Has Allergies"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={cn(
                        "font-bold text-sm truncate transition-colors",
                        isSelected
                          ? "text-emerald-900"
                          : "text-slate-900 group-hover:text-emerald-700",
                      )}
                    >
                      {patient.fullName}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0 border",
                        getStatusColor(patient.status),
                      )}
                    >
                      {getStatusLabel(patient.status)}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600">
                    <span className="font-mono font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
                      #{patient.id.slice(-6)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span
                      className={cn(
                        "font-medium",
                        patient.patientType === "inpatient"
                          ? "text-amber-700"
                          : "text-blue-700",
                      )}
                    >
                      {patient.patientType || "OPD"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-slate-500">
                      {formatDate(patient.registeredAt)}
                    </span>
                  </div>
                  {hasAllergies && (
                    <div className="mt-2 flex">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        ALLERGIES NOTED
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 mt-3 shrink-0 transition-all duration-300",
                    isSelected
                      ? "text-emerald-500 translate-x-1"
                      : "text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                  )}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Timeline ──────────────────────────────────────────────────────

function Timeline({
  selectedPatient,
  timelineEvents,
  groupedTimeline,
  selectedTimelineEvent,
  onSelectTimelineEvent,
  involvedMedics,
  eventCounts,
  permissions,
  onShowVitalsModal,
  onShowNoteModal,
  onShowTestModal,
  onShowPrescriptionModal,
  onDischarge,
  onRequestDischarge,
  onShowReferralModal,
  onDispenseRequest,
  onShowVitalsChart,
}: any) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "doctor-note":
        return <FileSignature className="w-4 h-4" />;
      case "nursing-note":
        return <FileText className="w-4 h-4" />;
      case "vitals":
        return <HeartPulse className="w-4 h-4" />;
      case "lab-test":
        return <Microscope className="w-4 h-4" />;
      case "prescription":
        return <Pill className="w-4 h-4" />;
      case "admission":
        return <Hospital className="w-4 h-4" />;
      case "discharge":
        return <FileCheck className="w-4 h-4" />;
      case "referral":
        return <Send className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "doctor-note":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "nursing-note":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "vitals":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "lab-test":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "prescription":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "admission":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "discharge":
        return "bg-slate-50 text-slate-700 border-slate-200";
      case "referral":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const isActive = selectedPatient?.status === "active";
  const isDischargePending = selectedPatient?.status === "discharge_pending";
  const isInpatient = selectedPatient?.patientType === "inpatient";

  const EmptyState = ({ icon: Icon, title, description, children }: any) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm mt-1 max-w-xs text-slate-500">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="lg:col-span-1 bg-white flex flex-col h-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {selectedPatient && (
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {selectedPatient.fullName}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-mono">
                  #{selectedPatient.id.slice(-6)}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{formatAge(selectedPatient.dateOfBirth)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="capitalize">
                  {selectedPatient.patientType}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  isActive
                    ? "bg-emerald-100 text-emerald-800"
                    : isDischargePending
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700",
                )}
              >
                {getStatusLabel(selectedPatient.status)}
              </span>
              <span className="text-[9px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                {timelineEvents.length} events
              </span>
            </div>
          </div>

          {/* ─── Vitals Chart button ──────────────────────────────── */}
          {selectedPatient &&
            selectedPatient.vitalsHistory &&
            selectedPatient.vitalsHistory.length > 0 && (
              <button
                onClick={onShowVitalsChart}
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mb-3"
              >
                <Activity className="w-3.5 h-3.5 inline mr-1.5" />
                View Vitals History
              </button>
            )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {permissions.canUpdateVitals && (
              <ActionButton
                onClick={onShowVitalsModal}
                label="+ Vitals"
                color="blue"
              />
            )}
            {permissions.canAddDoctorNote && (
              <ActionButton
                onClick={() => onShowNoteModal("doctor")}
                label="+ Dr Note"
                color="emerald"
              />
            )}
            {permissions.canAddNursingNote && (
              <ActionButton
                onClick={() => onShowNoteModal("nurse")}
                label="+ Nurse Note"
                color="purple"
              />
            )}
            {permissions.canOrderTest && (
              <ActionButton
                onClick={onShowTestModal}
                label="+ Test"
                color="amber"
              />
            )}
            {permissions.canPrescribe && (
              <ActionButton
                onClick={onShowPrescriptionModal}
                label="+ Prescribe"
                color="rose"
              />
            )}
            {permissions.canReferPatient && (
              <ActionButton
                onClick={onShowReferralModal}
                label="+ Refer"
                color="emerald"
              />
            )}
            {permissions.canApproveDischarge && isActive && isInpatient && (
              <ActionButton
                onClick={onDischarge}
                label="Discharge"
                color="slate"
              />
            )}
            {permissions.canRequestDischarge &&
              isActive &&
              isInpatient &&
              !isDischargePending && (
                <ActionButton
                  onClick={onRequestDischarge}
                  label="Request Discharge"
                  color="amber"
                />
              )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {vitalsFields.slice(0, 6).map((field) => {
              const val = selectedPatient.vitals?.[field.id];
              return (
                <div
                  key={field.id}
                  className="bg-white p-1.5 rounded-lg border border-slate-200 text-center"
                >
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                    {field.label}
                  </div>
                  <div className="text-xs font-medium text-slate-800">
                    {val !== undefined && val !== null
                      ? `${val}${field.unit ? " " + field.unit : ""}`
                      : "--"}
                  </div>
                </div>
              );
            })}
          </div>

          {involvedMedics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Team:
              </span>
              {involvedMedics.map((name: string) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200"
                >
                  <UserCircle className="w-3 h-3" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {!selectedPatient ? (
          <EmptyState
            icon={Eye}
            title="Select a patient"
            description="Choose a patient from the list to view their timeline."
          />
        ) : timelineEvents.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No events recorded yet"
            description="Start adding notes, vitals, or tests to build a timeline."
          >
            <div className="mt-4 text-xs bg-white px-3 py-1.5 rounded-lg text-slate-600 shadow-sm">
              Data received: DrNotes: {eventCounts.doctorNotes}, NurseNotes:{" "}
              {eventCounts.nursingNotes}, Vitals: {eventCounts.vitalsHistory},
              Rxs: {eventCounts.prescriptions}, Tests: {eventCounts.tests}
            </div>
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {(
              Object.entries(groupedTimeline) as [string, TimelineEvent[]][]
            ).map(([dateKey, events]) => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 bg-slate-50 py-1 mb-2 text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {getDateLabel(dateKey)}
                </div>
                <div className="space-y-2.5">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelectTimelineEvent(event)}
                      className={cn(
                        "w-full bg-white p-3 rounded-xl border shadow-sm text-left transition-all hover:shadow-md focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                        selectedTimelineEvent?.id === event.id
                          ? "ring-2 ring-emerald-500 border-transparent"
                          : "border-slate-200 hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "p-1.5 rounded-lg border",
                            getEventColor(event.type),
                          )}
                        >
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {event.actor.fullName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {event.actor.role}
                            </span>
                            <span className="text-[10px] text-slate-600">
                              • {event.action}
                            </span>
                            {/* Prescription status badge – no emoji */}
                            {event.type === "prescription" &&
                              event.data?._dispensedStatus &&
                              event.data._dispensedStatus !== "none" && (
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                                    event.data._dispensedStatus === "full" &&
                                      "bg-emerald-100 text-emerald-800",
                                    event.data._dispensedStatus === "partial" &&
                                      "bg-amber-100 text-amber-800",
                                    event.data._dispensedStatus ===
                                      "out_of_stock" &&
                                      "bg-rose-100 text-rose-800",
                                    event.data._dispensedStatus ===
                                      "cancelled" &&
                                      "bg-slate-200 text-slate-700",
                                  )}
                                >
                                  {event.data._dispensedStatus}
                                </span>
                              )}
                            <span className="text-[10px] text-slate-500 ml-auto whitespace-nowrap">
                              {formatTime(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 mt-0.5 leading-relaxed line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ onClick, label, color }: any) {
  const styles: any = {
    blue: "border-blue-300 text-blue-800 bg-blue-50/50 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500",
    emerald:
      "border-emerald-300 text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 focus:ring-2 focus:ring-emerald-500",
    purple:
      "border-purple-300 text-purple-800 bg-purple-50/50 hover:bg-purple-100 focus:ring-2 focus:ring-purple-500",
    amber:
      "border-amber-300 text-amber-800 bg-amber-50/50 hover:bg-amber-100 focus:ring-2 focus:ring-amber-500",
    rose: "border-rose-300 text-rose-800 bg-rose-50/50 hover:bg-rose-100 focus:ring-2 focus:ring-rose-500",
    slate:
      "border-slate-300 text-slate-800 bg-slate-50/50 hover:bg-slate-100 focus:ring-2 focus:ring-slate-500",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all active:scale-95 focus:outline-none",
        styles[color],
      )}
    >
      {label}
    </button>
  );
}

// ─── Detail View ──────────────────────────────────────────────────

function DetailView({
  selectedTimelineEvent,
  permissions,
  user,
  normalizedRole,
  testResultForm,
  setTestResultForm,
  onUpdateTestResult,
  onAcceptTest,
  onDispenseRequest,
  selectedPatientId,
  refreshTimeline,
  patientTests,
}: any) {
  const [isEditingResult, setIsEditingResult] = useState(false);

  const EmptyState = ({ icon: Icon, title, message }: any) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-slate-500">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
      <p className="text-sm mt-1 text-slate-500">{message}</p>
    </div>
  );

  if (!selectedTimelineEvent) {
    return (
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
          Details
        </div>
        <EmptyState
          icon={FileText}
          title="No event selected"
          message="Select a timeline event to view its details."
        />
      </div>
    );
  }

  let event = selectedTimelineEvent;
  if (event.type === "lab-test") {
    const freshTest = patientTests?.find((t: any) => t.id === event.data.id);
    if (freshTest) {
      event = {
        ...event,
        data: freshTest,
        description: `${freshTest.testType} - ${freshTest.status}`,
        action: `ordered a lab test${freshTest.acceptedBy ? ` (accepted by ${freshTest.acceptedBy})` : freshTest.completedBy ? ` (completed by ${freshTest.completedBy})` : freshTest.status === "pending" ? " (pending)" : ""}`,
      };
    }
  }

  const canView =
    event.permissions.canView.includes("*") ||
    event.permissions.canView.some((r: string) =>
      normalizedRole.toLowerCase().includes(r),
    );

  if (!canView) {
    return (
      <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="px-4 py-3 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
          Access Denied
        </div>
        <EmptyState
          icon={Lock}
          title="Restricted Access"
          message="You do not have permission to view this content."
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (event.type) {
      case "doctor-note":
      case "nursing-note": {
        const note = event.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                <FileSignature className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  {event.type === "doctor-note"
                    ? "Doctor's Note"
                    : "Nursing Note"}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  {event.actor.fullName} • {formatDate(event.timestamp)} •{" "}
                  {formatTime(event.timestamp)}
                </p>
              </div>
            </div>
            <div className="prose prose-sm prose-slate max-w-none bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                {note.content}
              </p>
            </div>
          </div>
        );
      }

      case "vitals": {
        const v = event.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700 border border-blue-200">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Vitals</h4>
                  <p className="text-[11px] text-slate-600">
                    {formatDate(event.timestamp)} at{" "}
                    {formatTime(event.timestamp)}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {vitalsFields.map((field: any) => {
                const val = v[field.id];
                if (val === undefined || val === null) return null;
                return (
                  <div
                    key={field.id}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm"
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-0.5">
                      {field.label}
                    </span>
                    <span className="font-bold text-lg text-slate-800">
                      {val}
                      <span className="text-xs text-slate-500 font-normal ml-1">
                        {field.unit}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case "lab-test": {
        const test = event.data;
        const isLabTech = normalizedRole === "lab_technician";
        const canAccept =
          isLabTech && test.status === "pending" && permissions.canAcceptTest;
        const canComplete = isLabTech && test.status === "processing";

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                <Microscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{test.testType}</h4>
                <p className="text-[11px] text-slate-600">
                  Ordered by {event.actor.fullName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                  test.status === "completed"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : test.status === "processing"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-slate-100 text-slate-700",
                )}
              >
                {test.status.toUpperCase()}
              </span>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Sample: {test.sampleType || "N/A"}
              </span>
              {test.acceptedBy && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Accepted by {test.acceptedBy}
                </span>
              )}
              {test.completedBy && (
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Completed by {test.completedBy}
                </span>
              )}
            </div>

            {test.result && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200">
                <p className="text-[10px] uppercase font-bold text-emerald-800/60 mb-1">
                  Results
                </p>
                <div className="text-2xl font-black text-emerald-900">
                  {test.result.value}
                  <span className="text-sm font-medium ml-1 opacity-60">
                    {test.result.unit}
                  </span>
                </div>
                {test.result.notes && (
                  <p className="text-sm text-emerald-800 mt-2 italic">
                    "{test.result.notes}"
                  </p>
                )}
              </div>
            )}

            {canAccept && (
              <button
                onClick={async () => {
                  await onAcceptTest(test.id);
                  if (refreshTimeline) refreshTimeline();
                }}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <PlayCircle className="w-4 h-4" /> Accept & Start Test
              </button>
            )}

            {canComplete && (
              <div className="space-y-3 mt-4 border-t border-slate-200 pt-4">
                <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Complete Test – Enter Results
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="test-value"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Value *
                    </label>
                    <input
                      id="test-value"
                      type="text"
                      placeholder="e.g. 120"
                      value={testResultForm.value}
                      onChange={(e) =>
                        setTestResultForm({
                          ...testResultForm,
                          value: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      aria-describedby="test-value-help"
                    />
                    <p
                      id="test-value-help"
                      className="text-xs text-slate-500 mt-1"
                    >
                      Enter the numeric result
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="test-unit"
                      className="block text-xs font-medium text-slate-700 mb-1"
                    >
                      Unit
                    </label>
                    <input
                      id="test-unit"
                      type="text"
                      placeholder="e.g. mg/dL"
                      value={testResultForm.unit}
                      onChange={(e) =>
                        setTestResultForm({
                          ...testResultForm,
                          unit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="test-ref"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Reference Range
                  </label>
                  <input
                    id="test-ref"
                    type="text"
                    placeholder="e.g. 70–100"
                    value={testResultForm.referenceRange}
                    onChange={(e) =>
                      setTestResultForm({
                        ...testResultForm,
                        referenceRange: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="test-notes"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    id="test-notes"
                    placeholder="Any additional observations"
                    value={testResultForm.notes}
                    onChange={(e) =>
                      setTestResultForm({
                        ...testResultForm,
                        notes: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <button
                  onClick={async () => {
                    await onUpdateTestResult(test.id, {
                      result: {
                        value: testResultForm.value,
                        unit: testResultForm.unit,
                        referenceRange: testResultForm.referenceRange,
                        notes: testResultForm.notes,
                        concludedBy: user?.fullName || "Unknown",
                        concludedByName: user?.fullName || "Unknown",
                        concludedAt: new Date().toISOString(),
                      },
                    });
                    if (refreshTimeline) refreshTimeline();
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Complete & Submit Result
                </button>
              </div>
            )}

            {test.status === "completed" && test.result && (
              <div className="text-xs text-slate-600 mt-2">
                Reported by{" "}
                {test.result.concludedByName ||
                  test.result.concludedBy ||
                  "Unknown"}{" "}
                on{" "}
                {test.result.concludedAt
                  ? formatDate(test.result.concludedAt)
                  : "N/A"}
              </div>
            )}
          </div>
        );
      }

      case "prescription": {
        const rx = event.data;
        const isPharmacist = normalizedRole === "pharmacist";
        const canDispense = isPharmacist && permissions.canDispense;
        const isAlreadyDispensed =
          rx.dispensedStatus && rx.dispensedStatus !== "none";

        // Extract index from event id: prescription-{patientId}-{index}
        const parts = event.id.split("-");
        const rxIndex = parseInt(parts[parts.length - 1], 10);

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-700 border border-rose-200">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">
                  Prescription Details
                </h4>
                <p className="text-[11px] text-slate-600">
                  By {event.actor.fullName}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y">
              {[
                { l: "Medication", v: rx.medication },
                { l: "Dosage", v: rx.dosage },
                { l: "Frequency", v: rx.frequency },
                { l: "Route", v: rx.route },
                { l: "Duration", v: rx.duration },
              ].map((item, i) => (
                <div key={i} className="flex justify-between px-4 py-3">
                  <span className="text-xs text-slate-500 font-medium">
                    {item.l}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {item.v}
                  </span>
                </div>
              ))}
              <div className="px-4 py-3 bg-slate-50 rounded-b-xl">
                <span className="text-xs text-slate-500 block mb-1">
                  Instructions
                </span>
                <p className="text-sm text-slate-700 italic">
                  "{rx.instructions || "No special instructions"}"
                </p>
              </div>
            </div>

            {/* Dispense Status – no emoji */}
            {rx.dispensedStatus && rx.dispensedStatus !== "none" && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <span className="text-xs font-medium text-slate-500">
                  Dispense Status:
                </span>
                <span
                  className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    rx.dispensedStatus === "full" &&
                      "bg-emerald-100 text-emerald-800",
                    rx.dispensedStatus === "partial" &&
                      "bg-amber-100 text-amber-800",
                    rx.dispensedStatus === "out_of_stock" &&
                      "bg-rose-100 text-rose-800",
                    rx.dispensedStatus === "cancelled" &&
                      "bg-slate-200 text-slate-700",
                  )}
                >
                  {rx.dispensedStatus}
                </span>
                {rx.dispensedQuantity && (
                  <span className="ml-2 text-xs text-slate-600">
                    Qty: {rx.dispensedQuantity}
                  </span>
                )}
                {rx.pharmacistNotes && (
                  <p className="mt-1 text-xs text-slate-600 italic">
                    {rx.pharmacistNotes}
                  </p>
                )}
                {rx.dispensedAt && (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Dispensed on {formatDate(rx.dispensedAt)} at{" "}
                    {formatTime(rx.dispensedAt)}
                  </p>
                )}
              </div>
            )}

            {canDispense && !isAlreadyDispensed && (
              <button
                onClick={() => {
                  if (selectedPatientId) {
                    onDispenseRequest(selectedPatientId, rxIndex);
                  }
                }}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-200 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              >
                Dispense Medication
              </button>
            )}
          </div>
        );
      }

      case "discharge": {
        const data = event.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 border border-slate-200">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Discharge Summary</h4>
                <p className="text-[11px] text-slate-600">
                  {event.actor.fullName} • {formatDate(event.timestamp)}
                </p>
              </div>
            </div>
            {data.summary && (
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {data.summary}
                </p>
              </div>
            )}
            {!data.summary && (
              <div className="text-sm text-slate-500 italic">
                No summary provided
              </div>
            )}
          </div>
        );
      }

      case "referral": {
        const data = event.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 border border-emerald-200">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Referral</h4>
                <p className="text-[11px] text-slate-600">
                  {event.actor.fullName} • {formatDate(event.timestamp)}
                </p>
              </div>
            </div>
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/60 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Destination</span>
                <span className="font-medium text-slate-800">
                  {data.toCenterName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <span
                  className={cn(
                    "font-medium",
                    data.status === "pending"
                      ? "text-amber-700"
                      : data.status === "completed"
                        ? "text-emerald-700"
                        : "text-rose-700",
                  )}
                >
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">
                  Reason
                </span>
                <p className="text-sm text-slate-800">{data.reason}</p>
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center text-slate-500 text-sm py-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Event details not available
          </div>
        );
    }
  };

  return (
    <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Details
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
          {event.type}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>
    </div>
  );
}

// ─── Referral Modal ────────────────────────────────────────────────

function ReferralModal({
  patient,
  onClose,
  centers,
  form,
  setForm,
  onSubmit,
}: any) {
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(patient.id);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            id="referral-modal-title"
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Refer Patient – {patient.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="refer-center"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Receiving Center *
            </label>
            <select
              id="refer-center"
              ref={firstInputRef}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all bg-white"
              value={form.toCenterId}
              onChange={(e) => setForm({ ...form, toCenterId: e.target.value })}
              aria-describedby="refer-center-help"
            >
              <option value="">Select a center</option>
              {centers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.centerName} ({c.centerType})
                </option>
              ))}
            </select>
            <p id="refer-center-help" className="text-xs text-slate-500 mt-1">
              Choose the destination facility for this referral
            </p>
          </div>

          <div>
            <label
              htmlFor="refer-reason"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Reason for Referral *
            </label>
            <textarea
              id="refer-reason"
              required
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 transition-all resize-none bg-white"
              placeholder="e.g., Specialist consultation, advanced imaging, etc."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              aria-describedby="refer-reason-help"
            />
            <p id="refer-reason-help" className="text-xs text-slate-500 mt-1">
              Provide a clear clinical justification
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Sending..." : "Refer Patient"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

const PatientSkeleton = () => (
  <div className="space-y-6 px-4 sm:px-0">
    <div className="flex flex-col gap-3">
      <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
      <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
      <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse sm:w-36" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-7 w-10 bg-slate-200 rounded mt-1" />
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
      <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
      <div className="bg-white rounded-2xl border border-slate-200/80 animate-pulse h-96" />
    </div>
  </div>
);
