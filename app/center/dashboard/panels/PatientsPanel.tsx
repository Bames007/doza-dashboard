// app/center/dashboard/panels/PatientsPanel.tsx

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Activity,
  Bed,
  User,
  RefreshCw,
  Loader2,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { usePatients, usePatientTests } from "../dashboards/hooks/usePatients";
import { useAuditLog } from "../dashboards/hooks/useAuditLog";
import DeleteConfirm from "../components/DeleteConfirm";

// ─── Import extracted components ──────────────────────────────────
import PatientList from "./hospital_components/PatientList";
import Timeline from "./hospital_components/Timeline";
import DetailView from "./hospital_components/DetailView";
import StatCard from "./hospital_components/StatCard";
import PatientSkeleton from "./hospital_components/PatientSkeleton";
import ReferralModal from "./hospital_components/ReferralModal";

// ─── Import modal components ──────────────────────────────────────
import TestPanelModal from "../dashboards/components/patient_panel/TestPanelModal";
import NoteModal from "../dashboards/components/patient_panel/NoteModal";
import VitalsModal from "../dashboards/components/patient_panel/VitalsModal";
import PrescriptionModal from "../dashboards/components/patient_panel/PrescriptionModal";
import DispenseModal from "../dashboards/components/patient_panel/DispenseModal";
import PatientModal from "../dashboards/components/patient_panel/PatientModal";
import VitalsChartModal from "../dashboards/components/patient_panel/VitalsChartModal";
import DozaUserSearchModal from "../components/DozaUserSearchModal";
import DischargeModal from "../components/DischargeModal";
import AdministerModal from "../dashboards/components/patient_panel/AdministerModal";
import FollowUpAppointmentModal from "./hospital_components/FollowupAppointmentModal";

// ─── Import helpers and types ─────────────────────────────────────
import {
  ExtendedPatient,
  TimelineEvent,
  Permissions,
} from "../types/hospital_patient";
import { vitalsFields } from "../types/hospital_patient";
import { formatDate } from "../utils/helpers";
import BillingDetailsModal from "./hospital_components/BillingDetailsModal";
import TakeHomeMedicationModal from "./hospital_components/TakeHomeMedicationModal";

// ─── Centre‑type configuration ────────────────────────────────────
import {
  patientCenterConfigs,
  PatientCenterConfig,
} from "../types/patientCenterConfig";
import logger from "@/app/utils/logger";
import { mutate } from "swr";

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
  if (r.includes("accountant") || r.includes("billing")) return "accountant";
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

// ─── Permission Hook ────────────────────────────────────────────────
export function usePatientPermissions(role?: string): Permissions {
  const normalized = normalizeRole(role);
  const roleLower = normalized.toLowerCase();

  const base: Permissions = {
    canViewPatientList: false,
    canViewDemographics: false,
    canViewAllergies: false,
    canViewProblemList: false,
    canViewMedications: false,
    canAdministerMedication: false,
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
    canViewBills: false,
    canApproveBills: false,
    canFinalizeDischarge: false,
  };

  base.canViewPatientList = true;
  base.canViewDemographics = true;

  if (roleLower === "doctor" || roleLower === "admin") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewNursingNotes = true;
    base.canViewVitals = true;
    base.canAdministerMedication = true;
    base.canViewTestOrders = true;
    base.canViewTestResults = true;
    base.canViewPrescriptions = true;
    base.canAddDoctorNote = true;
    base.canOrderTest = true;
    base.canPrescribe = true;
    base.canRequestDischarge = true;
    base.canEditPatient = true;
    base.canViewAudit = true;
    base.canReferPatient = true;
    base.canViewBills = true;
  }

  if (roleLower === "nurse") {
    base.canViewAllergies = true;
    base.canViewProblemList = true;
    base.canViewMedications = true;
    base.canViewDoctorNotes = true;
    base.canViewNursingNotes = true;
    base.canViewVitals = true;
    base.canViewTestOrders = true;
    base.canAdministerMedication = true;
    base.canViewTestResults = true;
    base.canViewPrescriptions = true;
    base.canAddNursingNote = true;
    base.canUpdateVitals = true;
    base.canAddPatient = true;
    base.canEditPatient = true;
    base.canViewBills = true;
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

  if (roleLower === "accountant" || roleLower === "billing") {
    base.canViewDemographics = true;
    base.canViewBilling = true;
    base.canViewBills = true;
    base.canApproveBills = true;
    base.canViewPrescriptions = true;
    base.canViewTestResults = true;
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
    base.canViewBills = true;
    base.canApproveBills = true;
    base.canFinalizeDischarge = true;
  }

  if (roleLower === "support" || roleLower === "reception") {
    base.canViewDemographics = true;
  }

  return base;
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

    // Billing / Invoices
    if (patient.bills && patient.bills.length > 0) {
      patient.bills.forEach((bill, idx) => {
        events.push({
          id: `billing-${patient.id}-${idx}`,
          type: "billing",
          timestamp:
            new Date(bill.createdAt).toISOString() || patient.registeredAt,
          actor: {
            id: bill.createdBy || "system",
            fullName: bill.createdByName || "System",
            role: "Billing",
          },
          action: bill.status === "paid" ? "paid invoice" : "created invoice",
          description: `Invoice – ₦${bill.total?.toFixed(2) || "0.00"}`,
          data: bill,
          permissions: {
            canView: ["accountant", "admin", "owner", "billing"],
            canEdit: ["accountant"],
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

    // Prescriptions
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

    // Medication Administrations
    if (patient.medicationAdministrations) {
      Object.values(patient.medicationAdministrations).forEach((admin: any) => {
        events.push({
          id: `med-admin-${admin.createdAt}`,
          type: "medication-admin",
          timestamp: admin.administeredAt || admin.createdAt,
          actor: {
            id: admin.administeredById || "system",
            fullName: admin.administeredBy || "Nurse",
            role: "Nurse",
          },
          action: "administered medication",
          description: `${admin.medication} ${admin.dose}`,
          data: {
            ...admin,
            _prescriptionId: admin.prescriptionId,
          },
          permissions: {
            canView: ["doctor", "nurse", "admin"],
            canEdit: [],
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

  // ─── Centre‑specific configuration ───────────────────────────────
  const centerType = center?.centerType || "hospital";
  const patientConfig: PatientCenterConfig =
    patientCenterConfigs[centerType] || patientCenterConfigs.hospital;

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  // ✅ Mobile master-detail view state
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [mobileDetailTab, setMobileDetailTab] = useState<
    "timeline" | "details"
  >("timeline");
  const touchStartX = useRef(0);

  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedTimelineEvent, setSelectedTimelineEvent] =
    useState<TimelineEvent | null>(null);
  const [fullPatient, setFullPatient] = useState<ExtendedPatient | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Modal states ────────────────────────────────────────────────
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
  const [showAdministerModal, setShowAdministerModal] = useState<{
    patientId: string;
    prescription: any;
  } | null>(null);
  const [showVitalsChartModal, setShowVitalsChartModal] = useState(false);
  const [showDozaSearchModal, setShowDozaSearchModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState<{
    patientId: string;
    patientName: string;
    dozaUserId?: string;
  } | null>(null);

  // ─── Take‑Home specific states ─────────────────────────────────
  const [showTakeHomeModal, setShowTakeHomeModal] = useState(false);
  const [isSubmittingTakeHome, setIsSubmittingTakeHome] = useState(false);

  // ─── Form states ──────────────────────────────────────────────────
  const [noteContent, setNoteContent] = useState("");
  const [vitalsForm, setVitalsForm] = useState<Record<string, string>>(
    vitalsFields.reduce((acc, f) => ({ ...acc, [f.id]: "" }), {}),
  );
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
  const [testCatalog, setTestCatalog] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // ─── Helper: Add bill item ─────────────────────────────────────
  const addBillItem = useCallback(
    async (
      patientId: string,
      item: {
        type: "prescription" | "lab_test" | "consultation" | "bed" | "other";
        description: string;
        amount: number;
        quantity?: number;
      },
    ) => {
      if (!center?.id || !user?.id) return;
      try {
        const res = await fetch(
          `/api/centers/${center.id}/patients/${patientId}/bills`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.id,
              "x-user-name": user.fullName || "Unknown",
              "x-user-role": user.role || "staff",
            },
            body: JSON.stringify({
              items: [item],
              notes: `Auto‑generated from ${item.type}`,
            }),
          },
        );
        const data = await res.json();
        if (!data.success) console.error("Failed to add bill item", data.error);
        if (selectedPatientId) {
          refreshFullPatient();
        }
      } catch (error) {
        console.error("Error adding bill item", error);
      }
    },
    [center?.id, user, selectedPatientId],
  );

  // ─── Effects ──────────────────────────────────────────────────────
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

  useEffect(() => {
    if (selectedPatientId && center?.id && user?.id) {
      refetchTests(selectedPatientId);
    }
  }, [selectedPatientId, center?.id, user?.id, refetchTests]);

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

  // ─── Refresh ──────────────────────────────────────────────────────
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

  const selectedPatient = (fullPatient ||
    patients.find((p) => p.id === selectedPatientId)) as ExtendedPatient | null;

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
    setMobileDetailTab("timeline");

    // ✅ On mobile, transition to detail view
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileView("detail");
    }

    logAction("view", "patient", patientId, `Viewed patient`);
  };

  // ✅ Mobile back to list
  const handleBackToList = () => {
    setMobileView("list");
    setSelectedTimelineEvent(null);
    setMobileDetailTab("timeline");
  };

  const handleViewBillingDetails = () => setShowBillingModal(true);

  const handleDischargePatient = async () => {
    if (!selectedPatient) {
      logger.warn("No patient selected for discharge");
      return;
    }

    if (
      !confirm(`Discharge ${selectedPatient.fullName}? This action is final.`)
    ) {
      logger.info(
        { patientId: selectedPatient.id },
        "Discharge cancelled by user",
      );
      return;
    }

    try {
      await updatePatient(selectedPatient.id, {
        status: "discharged",
        dischargeDate: new Date().toISOString(),
        dischargeBy: user?.fullName || "Unknown",
        dischargeReason: "Billing cleared – final discharge",
      } as any);

      logger.info(
        {
          patientId: selectedPatient.id,
          dischargeBy: user?.fullName,
        },
        "Patient status updated to discharged",
      );

      try {
        const sessionRes = await fetch(
          `/api/centers/${center.id}/patients/${selectedPatient.id}/end-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user?.id,
            },
          },
        );

        if (!sessionRes.ok) {
          const errorText = await sessionRes.text();
          logger.warn(
            {
              patientId: selectedPatient.id,
              status: sessionRes.status,
              error: errorText,
            },
            "Failed to end session – patient was discharged anyway",
          );
        } else {
          logger.info(
            {
              patientId: selectedPatient.id,
              centerId: center.id,
            },
            "Session ended successfully",
          );
        }
      } catch (sessionErr) {
        logger.error(
          {
            patientId: selectedPatient.id,
            error:
              sessionErr instanceof Error
                ? sessionErr.message
                : String(sessionErr),
          },
          "Error ending session",
        );
      }

      await refreshFullPatient();
      await refetchPatients();

      logAction(
        "discharge",
        "patient",
        selectedPatient.id,
        `Patient discharged by accountant (billing cleared) – session ended`,
      );

      alert("Patient discharged successfully.");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error(
        {
          patientId: selectedPatient.id,
          error: errorMsg,
        },
        "Failed to discharge patient",
      );
      alert("Failed to discharge patient. Please try again.");
    }
  };

  const handleSelectTimelineEvent = (event: TimelineEvent) =>
    setSelectedTimelineEvent(event);

  const handleCreateTest = async (
    patientId: string,
    patientName: string,
    testId: string,
    testName: string,
    sampleType: string,
    price: number,
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
        price: 0,
      });
      await addBillItem(patientId, {
        type: "lab_test",
        description: `Lab Test: ${testName}`,
        amount: price,
        quantity: 1,
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
      });
      setNoteContent("");
      setShowNoteModal(null);
      await refetchPatients();
      await refreshFullPatient();
      logAction("update", "patient", patientId, `Added ${type} note`);
    } catch (err) {
      alert("Failed to add note");
    }
  };

  const handleTakeHomeMedication = async (data: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions: string;
      source: "hospital" | "external";
    }>;
    notes: string;
  }) => {
    setIsSubmittingTakeHome(true);
    try {
      const currentPatient = patients.find((p) => p.id === selectedPatient?.id);
      const currentPrescriptions = currentPatient?.prescriptions || [];

      const newPrescriptions = data.medications.map((med) => {
        const rx: any = {
          medication: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions || data.notes,
          prescribedBy: user?.fullName || "Unknown",
          prescribedAt: new Date().toISOString(),
          dispensed: med.source === "external",
          dispensedStatus: med.source === "external" ? "full" : "none",
          source: med.source,
          totalQuantity: med.quantity,
          dispensedTotal: med.source === "external" ? med.quantity : 0,
          billed: false,
        };
        return rx;
      });

      await updatePatient(selectedPatient!.id, {
        prescriptions: [...currentPrescriptions, ...newPrescriptions],
      });

      await refreshFullPatient();
      await refetchPatients();
      logAction(
        "create",
        "prescription",
        selectedPatient!.id,
        `Prescribed ${data.medications.length} take-home medication(s)`,
      );
      setShowTakeHomeModal(false);
      alert(`Take-home medication prescribed. Pharmacy will process and bill.`);
    } catch (err) {
      console.error(err);
      alert("Failed to prescribe take-home medication.");
    } finally {
      setIsSubmittingTakeHome(false);
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
      });
      setShowVitalsModal(null);
      setVitalsForm(
        vitalsFields.reduce((acc, f) => ({ ...acc, [f.id]: "" }), {}),
      );
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
      drugId: string;
      sellingPrice: number;
    },
  ) => {
    const newRx = {
      medication: data.medication,
      dosage: data.dosage,
      frequency: data.frequency,
      route: data.route,
      duration: data.duration,
      instructions: data.instructions,
      drugId: data.drugId,
      price: data.sellingPrice,
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
      await addBillItem(patientId, {
        type: "prescription",
        description: `Prescription: ${data.medication} ${data.dosage}`,
        amount: data.sellingPrice || 0,
        quantity: 1,
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
    const rx = patient.prescriptions[prescriptionIndex];
    if (!rx) return;

    if (
      dispenseData.quantity &&
      dispenseData.quantity > 0 &&
      dispenseData.status !== "cancelled"
    ) {
      try {
        const drugRes = await fetch(
          `/api/centers/${center.id}/hospital_pharmacy/inventory`,
          {
            headers: { "x-user-id": user.id },
          },
        );
        const drugData = await drugRes.json();
        const drug = drugData.data.find(
          (d: any) => d.name.toLowerCase() === rx.medication.toLowerCase(),
        );
        if (drug) {
          await fetch(
            `/api/centers/${center.id}/hospital_pharmacy/inventory/adjust`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-id": user.id,
              },
              body: JSON.stringify({
                drugId: drug.id,
                delta: -dispenseData.quantity,
                note: `Dispensed for patient ${patient.fullName}`,
              }),
            },
          );
        }
      } catch (err) {
        alert("Failed to update inventory. Please check stock.");
        return;
      }
    }

    const updatedPrescriptions = [...patient.prescriptions];
    updatedPrescriptions[prescriptionIndex] = {
      ...rx,
      dispensed: true,
      dispensedStatus: dispenseData.status,
      dispensedQuantity: dispenseData.quantity,
      pharmacistNotes: dispenseData.notes,
      dispensedAt: new Date().toISOString(),
      dispensedById: user.id,
    };

    try {
      await updatePatient(patientId, { prescriptions: updatedPrescriptions });
      await refetchPatients();
      await refreshFullPatient();
      logAction(
        "update",
        "prescription",
        patientId,
        `Dispensed ${rx.medication}`,
      );
      setDispenseModal(null);
    } catch (err) {
      alert("Failed to update patient record.");
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
      });
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

  const handleEndSession = async () => {
    if (!selectedPatient || !center?.id) {
      logger.warn("No patient selected or center missing");
      return;
    }

    if (!confirm(`End the current visit for ${selectedPatient.fullName}?`)) {
      return;
    }

    try {
      const status = patientConfig.showDischarge ? "discharged" : "inactive";
      const res = await fetch(
        `/api/centers/${center.id}/patients/${selectedPatient.id}/end-session?status=${status}`,
        {
          method: "POST",
          headers: { "x-user-id": user?.id || "" },
        },
      );
      const data = await res.json();
      if (data.success) {
        await updatePatient(selectedPatient.id, { status });
        await refetchPatients();
        await refreshFullPatient();
        logger.info(
          { patientId: selectedPatient.id, newStatus: status },
          "Visit ended successfully",
        );
      } else {
        alert(data.error || "Failed to end visit");
      }
    } catch (err) {
      console.error("End session error:", err);
      alert("Network error. Please try again.");
    }
  };

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
      });
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

  const handleOpenFollowUp = (patientId: string, patientName: string) => {
    const patient = patients.find((p) => p.id === patientId);
    setShowFollowUpModal({
      patientId,
      patientName,
      dozaUserId: patient?.dozaUserId || undefined,
    });
  };

  if (patientsLoading) return <PatientSkeleton />;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className={cn("min-h-screen bg-[#F8FAFC] pb-24", poppins.className)}>
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        {/* ─── Compact mobile-aware header ─────────────────────────── */}
        <header className="pt-3 md:pt-6 mb-3 md:mb-6">
          {/* Row 1: eyebrow + refresh */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
                Patient Management
              </span>
              <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                {patients.length}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 shrink-0"
              aria-label="Refresh"
            >
              {isRefreshing ? (
                <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin text-emerald-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-600" />
              )}
            </button>
          </div>

          {/* Row 2: title + actions */}
          <div className="flex items-end justify-between gap-2 mb-3 md:mb-4">
            <h1
              className={cn(
                "text-2xl md:text-5xl text-slate-900 leading-none tracking-tight",
                bebasNeue.className,
              )}
            >
              Patients
            </h1>
            {permissions.canAddPatient && (
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <button
                  onClick={() => setShowDozaSearchModal(true)}
                  className="flex items-center gap-1.5 px-2.5 md:px-4 py-2 md:py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-all text-[11px] md:text-sm font-semibold"
                >
                  <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">From </span>Doza
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-[11px] md:text-sm font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Row 3: stats — horizontal scroll on mobile, grid on desktop */}
          <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-5 gap-2 md:gap-3 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {patientConfig.stats.total && (
              <StatCard
                label="Total"
                value={patients.length}
                icon={Users}
                color="emerald"
              />
            )}
            {patientConfig.stats.active && (
              <StatCard
                label="Active"
                value={patients.filter((p) => p.status === "active").length}
                icon={Activity}
                color="blue"
              />
            )}
            {patientConfig.stats.inpatient && (
              <StatCard
                label="Inpatients"
                value={
                  patients.filter((p) => p.patientType === "inpatient").length
                }
                icon={Bed}
                color="purple"
              />
            )}
            {patientConfig.stats.outpatient && (
              <StatCard
                label="Outpatients"
                value={
                  patients.filter((p) => p.patientType === "outpatient").length
                }
                icon={User}
                color="rose"
              />
            )}
            <StatCard
              label="Discharged"
              value={patients.filter((p) => p.status === "discharged").length}
              icon={CheckCircle}
              color="teal"
            />
          </div>
        </header>

        {/* ─── Master-detail layout ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Patient list — full width on mobile list view */}
          <div
            className={cn(
              "lg:block",
              mobileView === "list" ? "block" : "hidden",
            )}
          >
            <PatientList
              patients={filteredPatients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={handleSelectPatient}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          </div>

          {/* Detail pane */}
          <div
            className={cn(
              "lg:contents",
              mobileView === "detail" ? "block" : "hidden",
            )}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - touchStartX.current;
              if (dx > 80 && touchStartX.current < 30) {
                handleBackToList();
              }
            }}
          >
            {/* ── MOBILE STICKY HEADER (patient + back + tabs) ───────── */}
            {selectedPatient && (
              <div className="lg:hidden sticky top-0 z-20 -mx-3 px-3 pt-2 pb-0 bg-[#F8FAFC]">
                {/* Back + patient name */}
                <div className="flex items-center gap-2 mb-2.5">
                  <button
                    onClick={handleBackToList}
                    className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center active:bg-slate-100 transition-colors"
                    aria-label="Back to patients"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-700" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-[15px] font-bold text-slate-900 truncate leading-tight">
                        {selectedPatient.fullName}
                      </h2>
                      <span
                        className={cn(
                          "shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border",
                          selectedPatient.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : selectedPatient.status === "discharged"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-amber-50 text-amber-700 border-amber-200",
                        )}
                      >
                        {selectedPatient.status || "active"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono truncate leading-tight mt-0.5">
                      #{selectedPatient.id.slice(0, 8).toUpperCase()}
                      {selectedPatient.patientType && (
                        <>
                          {" · "}
                          <span className="capitalize">
                            {selectedPatient.patientType}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Tab bar — Timeline / Details */}
                <div className="flex items-center gap-1 border-b border-slate-200">
                  <button
                    onClick={() => setMobileDetailTab("timeline")}
                    className={cn(
                      "relative px-3 py-2 text-xs font-bold transition-colors",
                      mobileDetailTab === "timeline"
                        ? "text-emerald-700"
                        : "text-slate-500",
                    )}
                  >
                    Timeline
                    {eventCounts.doctorNotes +
                      eventCounts.nursingNotes +
                      eventCounts.vitalsHistory +
                      eventCounts.prescriptions +
                      eventCounts.tests >
                      0 && (
                      <span className="ml-1 text-[9px] font-semibold text-slate-400">
                        {eventCounts.doctorNotes +
                          eventCounts.nursingNotes +
                          eventCounts.vitalsHistory +
                          eventCounts.prescriptions +
                          eventCounts.tests}
                      </span>
                    )}
                    {mobileDetailTab === "timeline" && (
                      <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setMobileDetailTab("details")}
                    className={cn(
                      "relative px-3 py-2 text-xs font-bold transition-colors",
                      mobileDetailTab === "details"
                        ? "text-emerald-700"
                        : "text-slate-500",
                    )}
                  >
                    Details
                    {selectedTimelineEvent && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block align-middle" />
                    )}
                    {mobileDetailTab === "details" && (
                      <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-emerald-600 rounded-full" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── TIMELINE pane ──────────────────────────────────── */}
            <div
              className={cn(
                "lg:block",
                mobileView === "detail" && mobileDetailTab === "timeline"
                  ? "block mt-3"
                  : "hidden",
              )}
            >
              <Timeline
                selectedPatient={selectedPatient}
                timelineEvents={timelineEvents}
                groupedTimeline={groupedTimeline}
                onShowTakeHomeModal={() => setShowTakeHomeModal(true)}
                selectedTimelineEvent={selectedTimelineEvent}
                onSelectTimelineEvent={(event) => {
                  handleSelectTimelineEvent(event);
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 1024
                  ) {
                    setMobileDetailTab("details");
                  }
                }}
                involvedMedics={involvedMedics}
                eventCounts={eventCounts}
                permissions={permissions}
                patientConfig={patientConfig}
                onEndSession={handleEndSession}
                canViewDischargedPatients={!patientConfig.showDischarge}
                onShowVitalsModal={() =>
                  selectedPatient && setShowVitalsModal(selectedPatient)
                }
                onShowNoteModal={(type) =>
                  selectedPatient &&
                  setShowNoteModal({ patientId: selectedPatient.id, type })
                }
                onShowTestModal={() =>
                  selectedPatient && setShowTestModal(selectedPatient)
                }
                onShowPrescriptionModal={() =>
                  selectedPatient && setShowPrescriptionModal(selectedPatient)
                }
                onDischarge={() => setShowDischargeModal(true)}
                onRequestDischarge={() =>
                  selectedPatient && handleRequestDischarge(selectedPatient.id)
                }
                onShowReferralModal={() =>
                  permissions.canReferPatient &&
                  selectedPatient &&
                  setShowReferralModal(selectedPatient)
                }
                onDispenseRequest={handleDispenseRequest}
                onShowVitalsChart={() => setShowVitalsChartModal(true)}
                onAdminister={(patientId, prescription) =>
                  setShowAdministerModal({ patientId, prescription })
                }
                onShowFollowUpAppointment={
                  selectedPatient
                    ? () =>
                        handleOpenFollowUp(
                          selectedPatient.id,
                          selectedPatient.fullName,
                        )
                    : undefined
                }
                onViewBillingDetails={handleViewBillingDetails}
                onDischargePatient={handleDischargePatient}
              />
            </div>

            {/* ── DETAILS pane ───────────────────────────────────── */}
            <div
              className={cn(
                "lg:block",
                mobileView === "detail" && mobileDetailTab === "details"
                  ? "block mt-3"
                  : "hidden",
              )}
            >
              {/* Empty state hint for mobile when nothing is selected */}
              {!selectedTimelineEvent && (
                <div className="lg:hidden flex flex-col items-center justify-center text-center py-12 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-6 h-6 text-slate-400"
                    >
                      <path d="M9 12h6m-3-3v6M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">
                    No event selected
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-[220px]">
                    Go back to the{" "}
                    <button
                      onClick={() => setMobileDetailTab("timeline")}
                      className="text-emerald-600 font-semibold underline"
                    >
                      Timeline
                    </button>{" "}
                    and tap an entry to see full details
                  </p>
                </div>
              )}

              <div className={cn(!selectedTimelineEvent && "hidden lg:block")}>
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
            </div>
          </div>
        </div>

        {/* ─── Modals (unchanged) ──────────────────────────────────── */}
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
                  if (
                    patientConfig.addBedChargeOnCreate &&
                    newPatient.patientType === "inpatient"
                  ) {
                    await addBillItem(newPatient.id, {
                      type: "bed",
                      description: "Bed charge – daily rate",
                      amount: 5000,
                      quantity: 1,
                    });
                  }
                }
                setShowAddModal(false);
                setEditingPatient(null);
              }}
              centerConfig={patientConfig}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTakeHomeModal &&
            selectedPatient &&
            patientConfig.showTakeHomeMedication && (
              <TakeHomeMedicationModal
                isOpen={showTakeHomeModal}
                onClose={() => setShowTakeHomeModal(false)}
                patientId={selectedPatient.id}
                patientName={selectedPatient.fullName}
                onSubmit={handleTakeHomeMedication}
                isSubmitting={isSubmittingTakeHome}
                centerId={center?.id || ""}
                user={user}
              />
            )}
        </AnimatePresence>

        <AnimatePresence>
          {showBillingModal && selectedPatient && (
            <BillingDetailsModal
              isOpen={showBillingModal}
              onClose={() => setShowBillingModal(false)}
              bills={selectedPatient?.bills || []}
              total={selectedPatient?.totalBilling || 0}
              patientName={selectedPatient?.fullName || "Unknown"}
              patientId={selectedPatient?.id || ""}
              centerId={center?.id || ""}
              userId={user?.id || ""}
              userFullName={user?.fullName || "Unknown"}
              userRole={user?.role || "staff"}
              onUpdate={refreshFullPatient}
              permissions={{
                canApproveBills: permissions.canApproveBills,
                canApproveDischarge: permissions.canApproveDischarge,
              }}
              onDischargePatient={handleDischargePatient}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDozaSearchModal && (
            <DozaUserSearchModal
              isOpen={showDozaSearchModal}
              onClose={() => setShowDozaSearchModal(false)}
              centerId={center?.id}
              onSessionStart={() => {
                const patientListKey = `/api/centers/${center?.id}/patients`;
                mutate(patientListKey, undefined, { revalidate: true });
                mutate(`${patientListKey}?emergency`, undefined, {
                  revalidate: true,
                });
                refetchPatients();
                if (selectedPatientId) {
                  refreshFullPatient();
                  refetchTests(selectedPatientId);
                }
              }}
              showPatientType={patientConfig.showInpatientToggle}
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
                setVitalsForm(
                  vitalsFields.reduce((acc, f) => ({ ...acc, [f.id]: "" }), {}),
                );
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPrescriptionModal && (
            <PrescriptionModal
              patient={showPrescriptionModal}
              onClose={() => setShowPrescriptionModal(null)}
              onSave={async (data) => {
                await handleAddPrescription(showPrescriptionModal.id, data);
              }}
              centerId={center?.id}
              user={user}
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

        <AnimatePresence>
          {showAdministerModal && selectedPatient && (
            <AdministerModal
              isOpen={!!showAdministerModal}
              onClose={() => setShowAdministerModal(null)}
              patientId={showAdministerModal.patientId}
              patientName={selectedPatient.fullName}
              prescription={showAdministerModal.prescription}
              centerId={center?.id}
              user={user}
              onSuccess={() => {
                refreshFullPatient();
                setShowAdministerModal(null);
              }}
            />
          )}
        </AnimatePresence>

        {showDeleteConfirm && (
          <DeleteConfirm
            onConfirm={() => deletePatient(showDeleteConfirm)}
            onCancel={() => setShowDeleteConfirm(null)}
          />
        )}

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

        <AnimatePresence>
          {dispenseModal && selectedPatient && (
            <DispenseModal
              patientName={selectedPatient.fullName}
              medication={
                selectedPatient.prescriptions?.[dispenseModal.prescriptionIndex]
                  ?.medication || "Unknown"
              }
              prescription={
                selectedPatient.prescriptions?.[
                  dispenseModal.prescriptionIndex
                ] || {}
              }
              prescriptionIndex={dispenseModal.prescriptionIndex}
              patientId={dispenseModal.patientId}
              centerId={center?.id}
              user={user}
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

        <AnimatePresence>
          {showDischargeModal &&
            selectedPatient &&
            patientConfig.showDischarge && (
              <DischargeModal
                isOpen={showDischargeModal}
                onClose={() => setShowDischargeModal(false)}
                patient={selectedPatient}
                centerId={center?.id}
                user={user}
                onSuccess={() => {
                  refetchPatients();
                  refreshFullPatient();
                  setShowDischargeModal(false);
                }}
              />
            )}
        </AnimatePresence>

        <AnimatePresence>
          {showFollowUpModal && patientConfig.showFollowUp && (
            <FollowUpAppointmentModal
              isOpen={!!showFollowUpModal}
              onClose={() => setShowFollowUpModal(null)}
              patientId={showFollowUpModal.patientId}
              patientName={showFollowUpModal.patientName}
              patientDozaUserId={showFollowUpModal.dozaUserId}
              centerId={center?.id}
              user={user}
              onSuccess={() => {
                setShowFollowUpModal(null);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
