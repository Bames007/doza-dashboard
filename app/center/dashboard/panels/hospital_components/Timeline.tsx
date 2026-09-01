"use client";

import {
  formatTime,
  getDateLabel,
  formatDate,
  formatAge,
  getStatusLabel,
} from "../../utils/helpers";
import {
  FileSignature,
  FileText,
  HeartPulse,
  Microscope,
  Pill,
  Hospital,
  FileCheck,
  Send,
  Clock,
  Calendar,
  Eye,
  UserCircle,
  Activity,
  CreditCard,
  type LucideIcon,
  Check,
  LogOut,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import {
  type ExtendedPatient,
  type TimelineEvent,
  type Permissions,
  vitalsFields,
} from "../../types/hospital_patient";
import ActionButton from "./ActionButton";
import type { PatientCenterConfig } from "../../types/patientCenterConfig";

interface TimelineProps {
  selectedPatient: ExtendedPatient | null;
  timelineEvents: TimelineEvent[];
  groupedTimeline: Record<string, TimelineEvent[]>;
  selectedTimelineEvent: TimelineEvent | null;
  onSelectTimelineEvent: (event: TimelineEvent) => void;
  involvedMedics: string[];
  eventCounts: {
    doctorNotes: number;
    nursingNotes: number;
    vitalsHistory: number;
    prescriptions: number;
    tests: number;
  };
  permissions: Permissions;
  onShowVitalsModal: () => void;
  onShowNoteModal: (type: "doctor" | "nurse") => void;
  onShowTestModal: () => void;
  onShowPrescriptionModal: () => void;
  onDischarge: () => void;
  onRequestDischarge: () => void;
  onShowReferralModal: () => void;
  onDispenseRequest: (patientId: string, index: number) => void;
  onShowVitalsChart: () => void;
  onAdminister: (patientId: string, prescription: any) => void;
  onShowFollowUpAppointment?: () => void;
  onViewBillingDetails?: () => void;
  onDischargePatient?: () => void;
  onShowTakeHomeModal?: () => void;
  onEndSession?: () => void;
  patientConfig?: PatientCenterConfig;
  canViewDischargedPatients?: boolean;
}

export default function Timeline({
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
  onAdminister,
  onShowFollowUpAppointment,
  onViewBillingDetails,
  onDischargePatient,
  onShowTakeHomeModal,
  onEndSession,
  patientConfig,
  canViewDischargedPatients = false,
}: TimelineProps) {
  const config: PatientCenterConfig = patientConfig || {
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

  const isActive = selectedPatient?.status === "active";
  const isDischargePending = selectedPatient?.status === "discharge_pending";
  const isDischarged = selectedPatient?.status === "discharged";
  const isActiveOrPending = isActive || isDischargePending;
  const canModify = isActive || isDischargePending; // ✅ controls whether actions are allowed

  // ─── Restrict view for discharged patients ──────────────────────
  if (isDischarged && !canViewDischargedPatients) {
    return (
      <div className="lg:col-span-1 bg-white flex flex-col h-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Patient Discharged
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            This patient has been discharged. Only authorized personnel can view
            the full timeline.
          </p>
          <div className="mt-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status: Discharged
            </span>
          </div>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string): LucideIcon => {
    switch (type) {
      case "doctor-note":
        return FileSignature;
      case "nursing-note":
        return FileText;
      case "vitals":
        return HeartPulse;
      case "lab-test":
        return Microscope;
      case "prescription":
        return Pill;
      case "admission":
        return Hospital;
      case "discharge":
        return FileCheck;
      case "referral":
        return Send;
      case "billing":
        return CreditCard;
      default:
        return Clock;
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
      case "billing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const isNurseOrDoctor = permissions.canAdministerMedication;

  // ─── Check if all bills are paid ──────────────────────────────
  const allBillsPaid =
    !selectedPatient?.bills ||
    selectedPatient.bills.every(
      (bill) =>
        bill.status === "paid" ||
        bill.status === "hmo" ||
        bill.status === "discharged",
    );

  // ─── Build a set of administered prescription IDs ────────────────
  const administeredPrescriptionIds = new Set<string>();
  if (selectedPatient?.medicationAdministrations) {
    Object.values(selectedPatient.medicationAdministrations).forEach(
      (admin: any) => {
        if (admin.prescriptionId) {
          administeredPrescriptionIds.add(admin.prescriptionId);
        }
      },
    );
  }

  // ─── Empty state placeholder ──────────────────────────────────────
  const EmptyPlaceholder = () => {
    if (permissions.canViewBills) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            No billing events recorded
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            This patient currently has no invoices or payments.
          </p>
          {selectedPatient?.totalBilling !== undefined && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="col-span-2">
                Total Billed: ₦{selectedPatient.totalBilling.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          No events recorded
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Start adding notes, vitals, or tests to build a timeline.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <span>Dr Notes: {eventCounts.doctorNotes}</span>
          <span>Nurse Notes: {eventCounts.nursingNotes}</span>
          <span>Vitals: {eventCounts.vitalsHistory}</span>
          <span>Rxs: {eventCounts.prescriptions}</span>
          <span className="col-span-2">Tests: {eventCounts.tests}</span>
        </div>
      </div>
    );
  };

  if (!selectedPatient) {
    return (
      <div className="lg:col-span-1 bg-white flex flex-col h-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Select a patient
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Choose a patient from the list to view their timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-1 bg-white flex flex-col h-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate">
              {selectedPatient.fullName}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                #{selectedPatient.id.slice(-6)}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{formatAge(selectedPatient.dateOfBirth)}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="capitalize">{selectedPatient.patientType}</span>

              {permissions.canViewBills &&
                selectedPatient.totalBilling !== undefined && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <button
                      onClick={onViewBillingDetails}
                      className="font-semibold text-amber-600 hover:text-amber-800 hover:underline transition-colors focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded"
                    >
                      Total Billed: ₦{selectedPatient.totalBilling.toFixed(2)}
                    </button>
                  </>
                )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
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
            <span className="text-[9px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {timelineEvents.length} events
            </span>
          </div>
        </div>

        {/* ─── Discharge button (only if showDischarge is true) ─── */}
        {canModify &&
          permissions.canApproveBills &&
          isActiveOrPending &&
          allBillsPaid &&
          config.showDischarge && (
            <button
              onClick={onDischargePatient}
              className="w-full mb-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <FileCheck className="w-4 h-4" />
              {isDischargePending
                ? "Approve & Discharge"
                : "Discharge Patient (Fully Paid)"}
            </button>
          )}

        {/* ─── End Visit button (for centers without discharge) ─── */}
        {!config.showDischarge && isActive && onEndSession && (
          <button
            onClick={onEndSession}
            className="w-full mb-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <LogOut className="w-4 h-4" />
            End Visit
          </button>
        )}

        {/* ─── Take‑Home Medication ─────────────────────────────────── */}
        {canModify &&
          permissions.canPrescribe &&
          onShowTakeHomeModal &&
          config.showTakeHomeMedication && (
            <ActionButton
              onClick={onShowTakeHomeModal}
              label="+ Take-Home"
              color="blue"
            />
          )}

        {/* ─── Vitals History (always visible) ──────────────────── */}
        {permissions.canViewVitals &&
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

        {/* ─── Action Buttons ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {canModify && permissions.canUpdateVitals && (
            <ActionButton
              onClick={onShowVitalsModal}
              label="+ Vitals"
              color="blue"
            />
          )}
          {canModify && permissions.canAddDoctorNote && (
            <ActionButton
              onClick={() => onShowNoteModal("doctor")}
              label="+ Dr Note"
              color="emerald"
            />
          )}
          {canModify && permissions.canAddNursingNote && (
            <ActionButton
              onClick={() => onShowNoteModal("nurse")}
              label="+ Nurse Note"
              color="purple"
            />
          )}
          {canModify && permissions.canOrderTest && (
            <ActionButton
              onClick={onShowTestModal}
              label="+ Test"
              color="amber"
            />
          )}
          {canModify && permissions.canPrescribe && (
            <ActionButton
              onClick={onShowPrescriptionModal}
              label="+ Prescribe"
              color="rose"
            />
          )}
          {canModify && permissions.canReferPatient && config.showReferral && (
            <ActionButton
              onClick={onShowReferralModal}
              label="+ Refer"
              color="emerald"
            />
          )}
          {canModify &&
            permissions.canApproveDischarge &&
            isActive &&
            config.showDischarge && (
              <ActionButton
                onClick={onDischarge}
                label="Discharge"
                color="slate"
              />
            )}
          {canModify &&
            permissions.canRequestDischarge &&
            isActive &&
            !isDischargePending &&
            config.showDischarge && (
              <ActionButton
                onClick={onRequestDischarge}
                label="Request Discharge"
                color="amber"
              />
            )}
          {canModify &&
            permissions.canReferPatient &&
            onShowFollowUpAppointment &&
            config.showFollowUp && (
              <ActionButton
                onClick={onShowFollowUpAppointment}
                label="+ Follow-up"
                color="purple"
              />
            )}
        </div>

        {/* ─── Quick Vitals Display ────────────────────────────────── */}
        {permissions.canViewVitals && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {vitalsFields.slice(0, 6).map((field) => {
              const val = selectedPatient.vitals?.[field.id];
              return (
                <div
                  key={field.id}
                  className="bg-white p-1.5 rounded-lg border border-slate-200 text-center shadow-sm"
                >
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                    {field.label}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {val !== undefined && val !== null
                      ? `${val}${field.unit ? " " + field.unit : ""}`
                      : "--"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Team ────────────────────────────────────────────────── */}
        {involvedMedics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Team:
            </span>
            {involvedMedics.map((name) => (
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

      {/* ─── Timeline Events ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/30">
        {timelineEvents.length === 0 ? (
          <EmptyPlaceholder />
        ) : (
          <div className="relative space-y-4">
            {Object.entries(groupedTimeline).map(([dateKey, events]) => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm py-1.5 mb-2 text-xs font-bold text-slate-600 uppercase flex items-center gap-2 border-b border-slate-200/60">
                  <span className="w-1 h-3 bg-emerald-400 rounded-full" />
                  {getDateLabel(dateKey)}
                </div>
                <div className="space-y-2.5">
                  {events.map((event) => {
                    const isSelected = selectedTimelineEvent?.id === event.id;
                    const Icon = getEventIcon(event.type);
                    const colorClasses = getEventColor(event.type);

                    const isPrescription = event.type === "prescription";
                    const isDispensed =
                      isPrescription &&
                      event.data?._dispensedStatus &&
                      event.data._dispensedStatus !== "none";
                    const isAdministered =
                      isPrescription &&
                      administeredPrescriptionIds.has(
                        event.data?.id || event.id,
                      );
                    const showAdministerButton =
                      isDispensed && !isAdministered && isNurseOrDoctor;

                    return (
                      <div key={event.id} className="flex gap-4 relative">
                        <div className="w-14 shrink-0 text-right pt-2.5">
                          <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <div className="relative flex flex-col items-center w-8 shrink-0">
                          <div className="w-px bg-slate-200 h-2" />
                          <div
                            className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center border-2 border-white z-10 shadow-sm",
                              colorClasses,
                              isSelected &&
                                "ring-2 ring-emerald-500 ring-offset-1",
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="w-px flex-1 bg-slate-200" />
                        </div>
                        <div className="flex-1 pb-6 pt-0.5">
                          <div
                            onClick={() => onSelectTimelineEvent(event)}
                            className={cn(
                              "w-full text-left bg-white border rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
                              isSelected
                                ? "border-emerald-400 shadow-md ring-1 ring-emerald-400"
                                : "border-slate-200 shadow-sm hover:border-slate-300",
                            )}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectTimelineEvent(event);
                              }
                            }}
                          >
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">
                                  {event.actor.fullName}
                                </span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                                  {event.actor.role}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-slate-700">
                                {event.action}
                              </span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {event.description}
                                </p>
                                {event.type === "prescription" &&
                                  event.data?.source && (
                                    <span
                                      className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                                        event.data.source === "external"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-emerald-100 text-emerald-700",
                                      )}
                                    >
                                      {event.data.source === "external"
                                        ? "External"
                                        : "Hospital"}
                                    </span>
                                  )}
                              </div>
                            </div>

                            {isPrescription && isDispensed && (
                              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                                {isAdministered ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    <Check className="w-3.5 h-3.5" />
                                    Administered
                                  </span>
                                ) : showAdministerButton ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onAdminister) {
                                        onAdminister(selectedPatient.id, {
                                          id: event.data?.id || event.id,
                                          medication: event.data?.medication,
                                          dosage: event.data?.dosage,
                                          route: event.data?.route,
                                          instructions:
                                            event.data?.instructions,
                                        });
                                      }
                                    }}
                                    className="text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 animate-pulse"
                                  >
                                    Administer
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-500">
                                    Dispensed – awaiting action
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
