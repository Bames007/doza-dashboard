"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Bell,
  Calendar,
  Pill,
  TestTube,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ShoppingBag,
  Truck,
  MapPin,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/constants/constants";

type RequestType = "consultation" | "prescription" | "test";

interface DozaRequest {
  id: string;
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  dozaUserId: string;
  title: string;
  type: RequestType;
  startTime?: string;
  endTime?: string;
  notes?: string;
  status: "pending" | "scheduled" | "cancelled" | "completed";
  createdAt: string;
  medication?: string;
  dosage?: string;
  quantity?: number;
  testName?: string;
  responseNotes?: string;
  respondedAt?: string;
  fulfillmentMethod?: "pickup" | "delivery";
  deliveryAddress?: string;
}

// ─── Status styling — emerald/slate/amber/rose only ────────────────
const getStatusStyle = (status: DozaRequest["status"]) => {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    scheduled: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
};

const StatusBadge = ({ status }: { status: DozaRequest["status"] }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
      getStatusStyle(status),
    )}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-current" />
    {status}
  </span>
);

// ─── Type icon — emerald/slate only ────────────────────────────────
const TypeIcon = ({ type }: { type: RequestType }) => {
  const icons = {
    consultation: Calendar,
    prescription: Pill,
    test: TestTube,
  };
  const Icon = icons[type];
  return (
    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg shrink-0">
      <Icon className="w-4 h-4 text-emerald-600" />
    </div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────
const EmptyState = ({ filter }: { filter: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12 md:py-20 bg-white rounded-2xl border border-dashed border-slate-200"
  >
    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
      <Bell className="w-6 h-6 text-slate-300" />
    </div>
    <h3
      className={cn(
        "text-base md:text-lg font-bold text-slate-800 mb-1",
        bebasNeue.className,
      )}
    >
      No requests yet
    </h3>
    <p className="text-[11px] md:text-xs text-slate-500 max-w-xs mx-auto px-4">
      {filter === "all"
        ? "When users contact your center, requests appear here."
        : `No ${filter} requests found.`}
    </p>
  </motion.div>
);

// ─── Skeleton ─────────────────────────────────────────────────────
const SkeletonLoader = () => (
  <div className="space-y-2.5">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-3.5 border border-slate-200 animate-pulse h-24"
      />
    ))}
  </div>
);

// ─── Main Panel ───────────────────────────────────────────────────
export default function DozaRequestsPanel() {
  const { center, user } = useDashboard();
  const [requests, setRequests] = useState<DozaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const [modalData, setModalData] = useState<{
    requestId: string;
    action: "accept" | "reject";
  } | null>(null);
  const [modalNotes, setModalNotes] = useState("");

  const centerId = center?.id;

  useEffect(() => {
    if (centerId) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerId]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/centers/${centerId}/doza-requests`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error("Failed to fetch requests");
      const data = await res.json();
      setRequests(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!modalData) return;
    const { requestId, action } = modalData;
    setActionLoading(requestId);
    try {
      const res = await fetch(`/api/centers/${centerId}/doza-requests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify({ requestId, action, notes: modalNotes }),
      });
      if (!res.ok) throw new Error("Failed to update request");
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                status: action === "accept" ? "scheduled" : "cancelled",
                responseNotes: modalNotes,
                respondedAt: new Date().toISOString(),
              }
            : req,
        ),
      );
      setModalData(null);
      setModalNotes("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(
    (req) => filter === "all" || req.type === filter,
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const activeFilterCount = filter !== "all" ? 1 : 0;

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-6xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + count + refresh */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Doza Network
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {requests.length}
            </span>
            {pendingCount > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {pendingCount} pending
              </span>
            )}
          </div>
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 text-slate-600",
                loading && "animate-spin",
              )}
            />
          </button>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Requests
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Book appointments, dispense medication, or schedule tests
        </p>

        {/* Row 3: filter chips — horizontal scroll */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {[
            { value: "all" as const, label: "All", count: requests.length },
            {
              value: "consultation" as const,
              label: "Consultations",
              count: requests.filter((r) => r.type === "consultation").length,
            },
            {
              value: "prescription" as const,
              label: "Medication",
              count: requests.filter((r) => r.type === "prescription").length,
            },
            {
              value: "test" as const,
              label: "Tests",
              count: requests.filter((r) => r.type === "test").length,
            },
          ].map((tab) => {
            const isActive = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 text-[9px] md:text-[10px] font-semibold tabular-nums",
                    isActive ? "text-emerald-100" : "text-slate-400",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────────── */}
      {loading ? (
        <SkeletonLoader />
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center"
        >
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors"
          >
            Try again
          </button>
        </motion.div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-2.5">
          {filteredRequests.map((req) => {
            const isExpanded = expandedId === req.id;
            const isPending = req.status === "pending";

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className={cn(
                  "bg-white rounded-2xl border transition-all overflow-hidden",
                  isExpanded
                    ? "border-emerald-200 shadow-sm"
                    : "border-slate-200",
                )}
              >
                {/* Header row — clickable to expand */}
                <div
                  className="p-3 md:p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex items-start gap-2.5 md:gap-3">
                    <TypeIcon type={req.type} />

                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate flex-1">
                          {req.title ||
                            `${req.type.charAt(0).toUpperCase() + req.type.slice(1)} request`}
                        </h3>
                        <StatusBadge status={req.status} />
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] md:text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 min-w-0">
                          <User className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{req.patientName}</span>
                        </span>
                        {req.patientPhone && (
                          <a
                            href={`tel:${req.patientPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span className="tabular-nums">
                              {req.patientPhone}
                            </span>
                          </a>
                        )}
                        <span className="flex items-center gap-1 tabular-nums">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(req.createdAt).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                        {req.fulfillmentMethod && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide">
                            {req.fulfillmentMethod === "pickup" ? (
                              <ShoppingBag className="w-2.5 h-2.5" />
                            ) : (
                              <Truck className="w-2.5 h-2.5" />
                            )}
                            {req.fulfillmentMethod}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-1 shrink-0"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </div>

                  {/* Pending actions — visible without expanding on mobile */}
                  {isPending && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalData({
                            requestId: req.id,
                            action: "accept",
                          });
                          setModalNotes("");
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalData({
                            requestId: req.id,
                            action: "reject",
                          });
                          setModalNotes("");
                        }}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 md:px-4 pb-3 md:pb-4 space-y-2.5 border-t border-slate-100 pt-3">
                        {/* Notes */}
                        {req.notes && (
                          <div className="bg-slate-50 rounded-xl p-2.5">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                              Patient Notes
                            </p>
                            <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed">
                              {req.notes}
                            </p>
                          </div>
                        )}

                        {/* Consultation */}
                        {req.type === "consultation" && req.startTime && (
                          <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                                Requested Appointment
                              </p>
                              <p className="text-[11px] md:text-xs font-bold text-slate-900 mt-0.5 tabular-nums">
                                {new Date(req.startTime).toLocaleString(
                                  undefined,
                                  {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Prescription */}
                        {req.type === "prescription" && (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              {req.medication && (
                                <div className="bg-slate-50 rounded-xl p-2.5">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                    Medication
                                  </p>
                                  <p className="text-[11px] md:text-xs font-bold text-slate-800 truncate">
                                    {req.medication}
                                  </p>
                                </div>
                              )}
                              {req.dosage && (
                                <div className="bg-slate-50 rounded-xl p-2.5">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                    Dosage
                                  </p>
                                  <p className="text-[11px] md:text-xs font-bold text-slate-800 truncate">
                                    {req.dosage}
                                  </p>
                                </div>
                              )}
                              {req.quantity && (
                                <div className="bg-slate-50 rounded-xl p-2.5">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                    Quantity
                                  </p>
                                  <p className="text-[11px] md:text-xs font-bold text-slate-800 tabular-nums">
                                    {req.quantity}
                                  </p>
                                </div>
                              )}
                            </div>
                            {req.deliveryAddress && (
                              <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                                    Delivery Address
                                  </p>
                                  <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed">
                                    {req.deliveryAddress}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Test */}
                        {req.type === "test" && req.testName && (
                          <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                            <TestTube className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide">
                                Requested Test
                              </p>
                              <p className="text-[11px] md:text-xs font-bold text-slate-900 mt-0.5">
                                {req.testName}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        {req.responseNotes && (
                          <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
                            <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wide mb-1">
                              Your Response
                            </p>
                            <p className="text-[11px] md:text-xs text-emerald-900 leading-relaxed">
                              {req.responseNotes}
                            </p>
                            {req.respondedAt && (
                              <p className="text-[9px] text-emerald-600 mt-1 tabular-nums">
                                {new Date(req.respondedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Footer actions */}
                        <div className="flex gap-1.5 pt-1">
                          <button className="flex-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                          <button className="flex-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                            <ExternalLink className="w-3 h-3" />
                            Patient
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Action Modal (bottom sheet) ─────────────────────── */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={() => setModalData(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar for mobile */}
              <div className="sm:hidden pt-2 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
                <h3
                  className={cn(
                    "text-base sm:text-lg font-bold text-slate-900",
                    bebasNeue.className,
                  )}
                >
                  {modalData.action === "accept"
                    ? "Accept Request"
                    : "Decline Request"}
                </h3>
                <button
                  onClick={() => setModalData(null)}
                  className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5">
                <p className="text-[11px] sm:text-xs text-slate-500 mb-3">
                  Add an optional note for the patient (visible to them).
                </p>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none"
                  placeholder={
                    modalData.action === "accept"
                      ? "e.g., Please come at 2 PM tomorrow with your ID…"
                      : "e.g., We're fully booked that day, please try next week…"
                  }
                  autoFocus
                />
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => setModalData(null)}
                  className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={actionLoading === modalData.requestId}
                  className={cn(
                    "w-full sm:flex-1 py-2.5 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5",
                    modalData.action === "accept"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700",
                  )}
                >
                  {actionLoading === modalData.requestId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Processing…
                    </>
                  ) : modalData.action === "accept" ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Accept
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
