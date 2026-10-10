// app/center/dashboard/panels/PrescriptionsPanel.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Calendar,
  User,
  Stethoscope,
  Loader2,
  RefreshCw,
  Send,
  Ban,
  Package,
  Check,
} from "lucide-react";
import { usePrescriptions } from "../dashboards/hooks/useHospitalPrescription";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../dashboards/hooks/useAuditLog";
import type { Center, User as UserType } from "@/app/center/type";

// ─── Props ───────────────────────────────────────────────────────────

interface PrescriptionsPanelProps {
  center: Center;
  user: UserType;
}

// ─── Role Normalization ──────────────────────────────────────────────

const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (r.includes("doctor") || r.includes("medical officer")) return "doctor";
  if (r.includes("nurse")) return "nurse";
  if (r.includes("admin") || r.includes("owner") || r.includes("manager"))
    return "admin";
  if (r.includes("lab technician") || r.includes("lab tech"))
    return "lab_technician";
  return "support";
};

// ─── Status styling ─────────────────────────────────────────────────

const getStatusStyle = (status: string | undefined) => {
  if (!status || status === "none") {
    return {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Clock,
      label: "Pending",
    };
  }
  const map: Record<string, { bg: string; icon: any; label: string }> = {
    full: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Full",
    },
    partial: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Package,
      label: "Partial",
    },
    out_of_stock: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Ban,
      label: "Out of Stock",
    },
    cancelled: {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: X,
      label: "Cancelled",
    },
  };
  return (
    map[status] || {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertCircle,
      label: status,
    }
  );
};

const StatusBadge = ({ status }: { status: string | undefined }) => {
  const style = getStatusStyle(status);
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        style.bg,
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {style.label}
    </span>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// ─── Main Panel ──────────────────────────────────────────────────────

export default function HospitalPrescriptionPanel({
  center,
  user,
}: PrescriptionsPanelProps) {
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const isPharmacist = normalizedRole === "pharmacist";
  const isAdmin = normalizedRole === "admin" || normalizedRole === "owner";
  const canDispense = isPharmacist || isAdmin;

  const {
    prescriptions,
    loading,
    refetch: refetchPrescriptions,
    updatePrescription,
  } = usePrescriptions(center?.id, user?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<
    string | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispenseForm, setDispenseForm] = useState({
    status: "full" as "full" | "partial" | "out_of_stock" | "cancelled",
    quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPrescriptions = useMemo(() => {
    let filtered = prescriptions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.patientName.toLowerCase().includes(term) ||
          p.medication.toLowerCase().includes(term) ||
          p.prescribedBy.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (p) => !p.dispensed || p.dispensedStatus === "none",
        );
      } else {
        filtered = filtered.filter((p) => p.dispensedStatus === statusFilter);
      }
    }
    return filtered;
  }, [prescriptions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = prescriptions.length;
    const pending = prescriptions.filter(
      (p) => !p.dispensed || p.dispensedStatus === "none",
    ).length;
    const full = prescriptions.filter(
      (p) => p.dispensedStatus === "full",
    ).length;
    const partial = prescriptions.filter(
      (p) => p.dispensedStatus === "partial",
    ).length;
    const outOfStock = prescriptions.filter(
      (p) => p.dispensedStatus === "out_of_stock",
    ).length;
    const cancelled = prescriptions.filter(
      (p) => p.dispensedStatus === "cancelled",
    ).length;
    return { total, pending, full, partial, outOfStock, cancelled };
  }, [prescriptions]);

  const selectedPrescription =
    prescriptions.find((p) => p.id === selectedPrescriptionId) || null;

  const handleRefresh = useCallback(() => {
    refetchPrescriptions();
  }, [refetchPrescriptions]);

  const openPrescriptionDetail = (id: string) => {
    setSelectedPrescriptionId(id);
    setIsModalOpen(true);
    setDispenseForm({ status: "full", quantity: "", notes: "" });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPrescriptionId(null);
  };

  const handleDispense = async (patientId: string, index: number) => {
    if (!dispenseForm.status) {
      alert("Please select a dispense status.");
      return;
    }
    if (dispenseForm.status === "partial" && !dispenseForm.quantity) {
      alert("Please enter the quantity dispensed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        dispensed: true,
        dispensedStatus: dispenseForm.status,
        pharmacistNotes: dispenseForm.notes || undefined,
        dispensedAt: new Date().toISOString(),
        dispensedById: user?.id,
      };
      if (dispenseForm.status === "partial") {
        updateData.dispensedQuantity = parseFloat(dispenseForm.quantity);
      }
      await updatePrescription(patientId, index, updateData);
      logAction(
        "update",
        "prescription",
        patientId,
        `Dispensed ${selectedPrescription?.medication} – ${dispenseForm.status}`,
      );
      closeModal();
    } catch (err) {
      alert("Failed to dispense prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <PrescriptionsSkeleton />;
  }

  const statusTabs = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "full", label: "Full", count: stats.full },
    { value: "partial", label: "Partial", count: stats.partial },
    { value: "out_of_stock", label: "Out", count: stats.outOfStock },
    { value: "cancelled", label: "Cancelled", count: stats.cancelled },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Pharmacy
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {prescriptions.length}
            </span>
            {stats.pending > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {stats.pending} pending
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Prescriptions
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Manage and dispense patient prescriptions
        </p>
      </header>

      {/* ─── Stat pills ─────────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-6 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 mb-3 md:mb-5">
        <StatPill label="Total" value={stats.total} tone="slate" icon={Pill} />
        <StatPill
          label="Pending"
          value={stats.pending}
          tone="amber"
          icon={Clock}
        />
        <StatPill label="Full" value={stats.full} tone="emerald" icon={Check} />
        <StatPill
          label="Partial"
          value={stats.partial}
          tone="amber"
          icon={Package}
        />
        <StatPill label="Out" value={stats.outOfStock} tone="rose" icon={Ban} />
        <StatPill
          label="Cancelled"
          value={stats.cancelled}
          tone="slate"
          icon={X}
        />
      </div>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by patient, medication, or doctor…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
          aria-label="Search prescriptions"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── Status chips ───────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
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

      {/* ─── Content ────────────────────────────────────────── */}
      {filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Pill className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No prescriptions found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Prescriptions will appear here once ordered."}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredPrescriptions.map((prescription) => {
            const statusStyle = getStatusStyle(prescription.dispensedStatus);
            const TypeIcon = statusStyle.icon;
            const isPending =
              !prescription.dispensed ||
              prescription.dispensedStatus === "none";

            return (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openPrescriptionDetail(prescription.id)}
                className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 hover:border-emerald-200 transition-colors cursor-pointer"
              >
                {/* Top row */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg border shrink-0",
                      statusStyle.bg,
                    )}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                        {prescription.medication} {prescription.dosage}
                      </h3>
                      <StatusBadge status={prescription.dispensedStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] md:text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 min-w-0">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {prescription.patientName}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[100px]">
                          {prescription.prescribedBy || "Unknown"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatDateShort(prescription.prescribedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price + dispense info */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] md:text-[11px] text-slate-500">
                    {prescription.dispensedAt ? (
                      <span className="tabular-nums">
                        Dispensed {formatDateShort(prescription.dispensedAt)}
                      </span>
                    ) : (
                      "Awaiting dispensing"
                    )}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-900 tabular-nums">
                    ₦{prescription.price?.toFixed(2) || "0.00"}
                  </span>
                </div>

                {/* Action */}
                {canDispense && isPending && (
                  <div className="pt-2.5 mt-2.5 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openPrescriptionDetail(prescription.id);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      Dispense
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selectedPrescription && (
          <PrescriptionDetailModal
            prescription={selectedPrescription}
            onClose={closeModal}
            onDispense={handleDispense}
            dispenseForm={dispenseForm}
            setDispenseForm={setDispenseForm}
            isSubmitting={isSubmitting}
            canDispense={canDispense}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Pill ──────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate" | "amber" | "rose";
  icon: any;
}) {
  const toneStyles: Record<string, { bg: string; iconBg: string }> = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    slate: {
      bg: "bg-slate-50 border-slate-200 text-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
    },
    amber: {
      bg: "bg-amber-50 border-amber-200 text-amber-700",
      iconBg: "bg-amber-100 text-amber-700",
    },
    rose: {
      bg: "bg-rose-50 border-rose-200 text-rose-700",
      iconBg: "bg-rose-100 text-rose-700",
    },
  };
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        "shrink-0 w-32 sm:w-40 md:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
        style.bg,
      )}
    >
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-lg md:text-xl font-bold tabular-nums leading-none mt-0.5",
            bebasNeue.className,
          )}
        >
          {value}
        </p>
      </div>
      <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ─── Detail Modal (bottom sheet on mobile) ──────────────────────────

function PrescriptionDetailModal({
  prescription,
  onClose,
  onDispense,
  dispenseForm,
  setDispenseForm,
  isSubmitting,
  canDispense,
}: {
  prescription: any;
  onClose: () => void;
  onDispense: (patientId: string, index: number) => Promise<void>;
  dispenseForm: any;
  setDispenseForm: (form: any) => void;
  isSubmitting: boolean;
  canDispense: boolean;
}) {
  const statusStyle = getStatusStyle(prescription.dispensedStatus);
  const isPending =
    !prescription.dispensed || prescription.dispensedStatus === "none";

  const inputClass =
    "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition";
  const labelClass =
    "block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5";

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="min-w-0">
            <h2
              className={cn(
                "text-base sm:text-lg font-bold text-slate-900 truncate",
                bebasNeue.className,
              )}
            >
              Prescription Details
            </h2>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate">
              {prescription.medication} · {prescription.dosage}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Patient
              </p>
              <p className="text-xs font-bold text-slate-900 truncate">
                {prescription.patientName}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Status
              </p>
              <StatusBadge status={prescription.dispensedStatus} />
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Prescribed By
              </p>
              <p className="text-xs font-bold text-slate-900 truncate">
                {prescription.prescribedBy || "Unknown"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Price
              </p>
              <p className="text-xs font-bold text-slate-900 tabular-nums">
                ₦{prescription.price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="col-span-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Date Prescribed
              </p>
              <p className="text-xs text-slate-700 tabular-nums">
                {formatDate(prescription.prescribedAt)}
              </p>
            </div>
          </div>

          {/* Medication Details */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2.5">
              Medication Details
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Medication
                </span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">
                  {prescription.medication}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Dosage
                </span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">
                  {prescription.dosage}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Frequency
                </span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">
                  {prescription.frequency || "—"}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Route
                </span>
                <p className="font-bold text-slate-800 mt-0.5 truncate">
                  {prescription.route || "—"}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                  Duration
                </span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {prescription.duration || "—"}
                </p>
              </div>
              {prescription.instructions && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-[9px] text-slate-500 uppercase tracking-wide">
                    Instructions
                  </span>
                  <p className="text-[11px] text-slate-700 italic mt-1 leading-relaxed">
                    "{prescription.instructions}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Dispense info */}
          {!isPending && (
            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                  Dispensed
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                    Status
                  </span>
                  <p className="font-bold text-emerald-900 capitalize mt-0.5">
                    {prescription.dispensedStatus}
                  </p>
                </div>
                {prescription.dispensedQuantity && (
                  <div>
                    <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                      Quantity
                    </span>
                    <p className="font-bold text-emerald-900 tabular-nums mt-0.5">
                      {prescription.dispensedQuantity}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                    Dispensed At
                  </span>
                  <p className="font-bold text-emerald-900 tabular-nums mt-0.5 text-[10px]">
                    {formatDate(prescription.dispensedAt)}
                  </p>
                </div>
                {prescription.pharmacistNotes && (
                  <div className="col-span-2 pt-2 border-t border-emerald-200">
                    <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                      Notes
                    </span>
                    <p className="text-[11px] text-emerald-800 italic mt-1 leading-relaxed">
                      {prescription.pharmacistNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dispense Form */}
          {canDispense && isPending && (
            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Dispense Medication
              </h5>

              <div>
                <label className={labelClass}>
                  Dispense Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dispenseForm.status}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      status: e.target.value,
                    })
                  }
                  className={cn(inputClass, "truncate")}
                >
                  <option value="full">Full Dispense</option>
                  <option value="partial">Partial Dispense</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {dispenseForm.status === "partial" && (
                <div>
                  <label className={labelClass}>
                    Quantity Dispensed <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dispenseForm.quantity}
                    onChange={(e) =>
                      setDispenseForm({
                        ...dispenseForm,
                        quantity: e.target.value,
                      })
                    }
                    className={cn(inputClass, "tabular-nums")}
                    placeholder="e.g., 10"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Pharmacist Notes</label>
                <textarea
                  value={dispenseForm.notes}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  className={cn(inputClass, "resize-none")}
                  placeholder="Any additional notes…"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {canDispense && isPending && (
          <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onDispense(prescription.patientId, prescription.index)
              }
              disabled={
                isSubmitting ||
                (dispenseForm.status === "partial" && !dispenseForm.quantity)
              }
              className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Confirm
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function PrescriptionsSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-40 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-56 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2.5 mb-3 md:mb-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-16 w-32 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
          />
        ))}
      </div>
      <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-28"
          />
        ))}
      </div>
    </div>
  );
}
