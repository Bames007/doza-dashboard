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
  MessageCircle,
  Filter,
  ShoppingBag,
  Truck,
  MapPin,
  AlertCircle,
  ChevronDown,
  RefreshCw,
  Search,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Stethoscope,
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

// ─── Micro‑animated components ──────────────────────────────────
const GlowBadge = ({ status }: { status: DozaRequest["status"] }) => {
  const config = {
    pending:
      "bg-amber-100 text-amber-800 border-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.3)]",
    scheduled:
      "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.3)]",
    cancelled:
      "bg-rose-100 text-rose-800 border-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.3)]",
    completed:
      "bg-blue-100 text-blue-800 border-blue-300 shadow-[0_0_6px_rgba(59,130,246,0.3)]",
  }[status];

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${config} flex items-center gap-1.5`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      {status}
    </motion.span>
  );
};

const TypeIcon = ({ type }: { type: RequestType }) => {
  const icons = {
    consultation: Calendar,
    prescription: Pill,
    test: TestTube,
  };
  const Icon = icons[type];
  return (
    <div className="p-2.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-sm">
      <Icon className="w-5 h-5 text-slate-600" />
    </div>
  );
};

const EmptyState = ({ filter }: { filter: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"
  >
    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4">
      <Bell className="w-10 h-10 text-slate-300" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-1">No requests yet</h3>
    <p className="text-sm text-slate-500 max-w-xs mx-auto">
      {filter === "all"
        ? "When users search and contact your center, they’ll appear here."
        : `No ${filter} requests found.`}
    </p>
  </motion.div>
);

const SkeletonLoader = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function DozaRequestsPanel() {
  const { center, user } = useDashboard();
  const [requests, setRequests] = useState<DozaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RequestType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal state
  const [modalData, setModalData] = useState<{
    requestId: string;
    action: "accept" | "reject";
  } | null>(null);
  const [modalNotes, setModalNotes] = useState("");

  const centerId = center?.id;

  useEffect(() => {
    if (centerId) fetchRequests();
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

  return (
    <div className={cn("p-4 md:p-6 max-w-6xl mx-auto", poppins.className)}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
              Doza Health Network
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl font-black text-slate-900 leading-[1.1]",
              bebasNeue.className,
            )}
          >
            Requests
            <span className="text-emerald-500 ml-2">({requests.length})</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Manage incoming inquiries – book appointments, dispense medication,
            or schedule tests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRequests}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/30 appearance-none cursor-pointer shadow-sm"
            >
              <option value="all">All Types</option>
              <option value="consultation">Consultations</option>
              <option value="prescription">Medication Orders</option>
              <option value="test">Lab Tests</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────────────── */}
      {loading ? (
        <SkeletonLoader />
      ) : error ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 text-center"
        >
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold">{error}</p>
          <button
            onClick={fetchRequests}
            className="mt-3 text-sm font-medium text-rose-800 underline hover:text-rose-900"
          >
            Try again
          </button>
        </motion.div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              layout
              className="group bg-white border border-slate-200 hover:border-slate-300 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div
                className="p-4 md:p-6 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === req.id ? null : req.id)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <TypeIcon type={req.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 truncate">
                          {req.title ||
                            `${req.type.charAt(0).toUpperCase() + req.type.slice(1)} request`}
                        </h3>
                        <GlowBadge status={req.status} />
                        {req.fulfillmentMethod && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {req.fulfillmentMethod === "pickup" ? (
                              <ShoppingBag className="w-3 h-3" />
                            ) : (
                              <Truck className="w-3 h-3" />
                            )}
                            {req.fulfillmentMethod}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {req.patientName}
                        </span>
                        {req.patientPhone && (
                          <a
                            href={`tel:${req.patientPhone}`}
                            className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {req.patientPhone}
                          </a>
                        )}
                        {req.patientEmail && (
                          <a
                            href={`mailto:${req.patientEmail}`}
                            className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {req.patientEmail}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalData({
                              requestId: req.id,
                              action: "accept",
                            });
                            setModalNotes("");
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-200 transition flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Accept
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalData({
                              requestId: req.id,
                              action: "reject",
                            });
                            setModalNotes("");
                          }}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </motion.button>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </motion.button>
                    <motion.div
                      animate={{ rotate: expandedId === req.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === req.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pt-5 mt-5 border-t border-slate-100 space-y-4">
                        {/* Notes */}
                        {req.notes && (
                          <div className="bg-slate-50 p-4 rounded-2xl">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Patient Notes
                            </p>
                            <p className="text-sm text-slate-700">
                              {req.notes}
                            </p>
                          </div>
                        )}

                        {/* Consultation details */}
                        {req.type === "consultation" && req.startTime && (
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            <div>
                              <p className="text-xs text-blue-600 font-medium">
                                Requested Appointment
                              </p>
                              <p className="text-sm font-bold text-blue-800">
                                {new Date(req.startTime).toLocaleString(
                                  undefined,
                                  {
                                    dateStyle: "full",
                                    timeStyle: "short",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Prescription details */}
                        {req.type === "prescription" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {req.medication && (
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Medication
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {req.medication}
                                  </p>
                                </div>
                              )}
                              {req.dosage && (
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Dosage
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {req.dosage}
                                  </p>
                                </div>
                              )}
                              {req.quantity && (
                                <div className="bg-slate-50 p-3 rounded-xl">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    Quantity
                                  </p>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {req.quantity}
                                  </p>
                                </div>
                              )}
                            </div>
                            {req.fulfillmentMethod && (
                              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                                {req.fulfillmentMethod === "pickup" ? (
                                  <ShoppingBag className="w-5 h-5 text-emerald-500" />
                                ) : (
                                  <Truck className="w-5 h-5 text-emerald-500" />
                                )}
                                <div>
                                  <p className="text-xs text-emerald-600 font-medium">
                                    Fulfilment Method
                                  </p>
                                  <p className="text-sm font-bold text-emerald-800 capitalize">
                                    {req.fulfillmentMethod}
                                  </p>
                                  {req.deliveryAddress && (
                                    <p className="text-xs text-emerald-700 mt-1 flex items-start gap-1">
                                      <MapPin className="w-3 h-3 mt-0.5" />
                                      {req.deliveryAddress}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Test details */}
                        {req.type === "test" && req.testName && (
                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                            <TestTube className="w-5 h-5 text-purple-500" />
                            <div>
                              <p className="text-xs text-purple-600 font-medium">
                                Requested Test
                              </p>
                              <p className="text-sm font-bold text-purple-800">
                                {req.testName}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        {req.responseNotes && (
                          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                            <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-1">
                              Your Response
                            </p>
                            <p className="text-sm text-emerald-800">
                              {req.responseNotes}
                            </p>
                            {req.respondedAt && (
                              <p className="text-[10px] text-emerald-600 mt-2">
                                {new Date(req.respondedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Quick actions */}
                        <div className="flex gap-2 pt-2">
                          <button className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl transition">
                            <Copy className="w-3.5 h-3.5" /> Copy details
                          </button>
                          <button className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl transition">
                            <ExternalLink className="w-3.5 h-3.5" /> Open
                            patient
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Action Modal (Glassmorphism) ────────────────────── */}
      <AnimatePresence>
        {modalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setModalData(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="bg-white/90 backdrop-blur-md rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white/50"
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                className={cn(
                  "text-2xl font-black text-slate-800 mb-2",
                  bebasNeue.className,
                )}
              >
                {modalData.action === "accept"
                  ? "Accept Request"
                  : "Decline Request"}
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Add an optional note for the patient (visible to them).
              </p>
              <textarea
                value={modalNotes}
                onChange={(e) => setModalNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition"
                placeholder="e.g., Please come at 2 PM tomorrow with your ID..."
              />
              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={() => setModalData(null)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAction}
                  disabled={actionLoading === modalData.requestId}
                  className={cn(
                    "px-5 py-2.5 text-sm font-bold rounded-xl text-white transition flex items-center gap-2",
                    modalData.action === "accept"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                      : "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200",
                    actionLoading === modalData.requestId && "opacity-50",
                  )}
                >
                  {actionLoading === modalData.requestId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : modalData.action === "accept" ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Decline
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
