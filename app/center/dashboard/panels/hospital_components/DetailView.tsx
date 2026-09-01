// app/center/dashboard/components/patient_panel/DetailView.tsx

"use client";

import { useState } from "react";
import {
  FileText,
  Lock,
  AlertCircle,
  HeartPulse,
  Microscope,
  Pill,
  FileCheck,
  Send,
  CheckCircle2,
  PlayCircle,
  Clock,
  CreditCard, // <-- added
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { formatDate, formatTime } from "../../utils/helpers";
import { vitalsFields } from "../../types/hospital_patient";
import type {
  Permissions,
  TimelineEvent,
  ExtendedPatient,
} from "../../types/hospital_patient";

interface DetailViewProps {
  selectedTimelineEvent: TimelineEvent | null;
  permissions: Permissions;
  user: any;
  normalizedRole: string;
  testResultForm: any;
  setTestResultForm: any;
  onUpdateTestResult: any;
  onAcceptTest: any;
  onDispenseRequest: any;
  selectedPatientId: string | null;
  refreshTimeline: () => void;
  patientTests: any[];
}

export default function DetailView({
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
}: DetailViewProps) {
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
                <FileText className="w-5 h-5" />
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
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
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
              {vitalsFields.map((field) => {
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
                    />
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
          </div>
        );
      }

      case "prescription": {
        const rx = event.data;
        const isPharmacist = normalizedRole === "pharmacist";
        const canDispense = isPharmacist && permissions.canDispense;
        const isAlreadyDispensed =
          rx.dispensedStatus && rx.dispensedStatus !== "none";

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

      // ─── ✅ New billing case ──────────────────────────────────────
      case "billing": {
        const bill = event.data;
        const total = bill.total || bill.amount || 0;
        const items = bill.items || [];

        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Invoice</h4>
                <p className="text-[11px] text-slate-600">
                  {event.actor.fullName} • {formatDate(event.timestamp)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between px-4 py-3">
                      <span className="text-sm text-slate-700">
                        {item.description}
                      </span>
                      <span className="font-semibold text-slate-800">
                        ₦{(item.amount * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="bg-slate-50 px-4 py-3 flex justify-between font-bold">
                    <span className="text-slate-400">Total</span>
                    <span className="text-amber-600">₦{total.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-sm text-slate-500">
                  No items in this bill.
                </div>
              )}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                Status:{" "}
                <span className="font-medium capitalize">{bill.status}</span>
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
