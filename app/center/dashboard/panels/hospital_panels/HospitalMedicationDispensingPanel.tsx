// app/center/dashboard/panels/HospitalMedicationDispensingPanel.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  Clock,
  Search,
  X,
  User,
  Loader2,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronUp,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { useHospitalPharmacyMedicationDispensing } from "../../dashboards/hooks/useHospitalPharmacyMedicationDispensing";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../../dashboards/hooks/useAuditLog";
import { addBillItem } from "../hospital_components/billing";

// ─── Role Check ──────────────────────────────────────────────────────
const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (r.includes("admin") || r.includes("owner") || r.includes("manager"))
    return "admin";
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
      icon: CheckCircle2,
      label: "Full",
    },
    partial: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
      label: "Partial",
    },
    out_of_stock: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: AlertCircle,
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

// ─── Main Component ──────────────────────────────────────────────────
export default function HospitalMedicationDispensingPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const canDispense =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  const {
    prescriptions,
    loading,
    refetch,
    updatePrescription,
    filterPrescriptions,
    stats,
  } = useHospitalPharmacyMedicationDispensing(center?.id, user?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "patient" | "drug" | "prescribedAt" | "dispensedAt" | "status"
  >("prescribedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dispenseModal, setDispenseModal] = useState<{
    patientId: string;
    index: number;
  } | null>(null);
  const [dispenseForm, setDispenseForm] = useState({
    status: "full" as "full" | "partial" | "out_of_stock" | "cancelled",
    quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    return filterPrescriptions({
      search: searchTerm,
      status: statusFilter as any,
      sortBy,
      sortOrder,
    });
  }, [filterPrescriptions, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const openDetail = (prescription: any) => {
    setSelectedPrescription(prescription);
    setIsModalOpen(true);
  };

  const closeDetail = () => {
    setIsModalOpen(false);
    setSelectedPrescription(null);
  };

  const openDispense = (patientId: string, index: number) => {
    setDispenseModal({ patientId, index });
    setDispenseForm({ status: "full", quantity: "", notes: "" });
  };

  const closeDispense = () => {
    setDispenseModal(null);
  };

  const confirmDispense = async () => {
    if (!dispenseModal) return;
    const { patientId, index } = dispenseModal;
    if (!dispenseForm.status) {
      alert("Please select a dispense status.");
      return;
    }

    const rx = prescriptions.find(
      (p) => p.patientId === patientId && p.index === index,
    );
    if (!rx) {
      alert("Prescription not found.");
      return;
    }
    const remaining = Math.max(
      0,
      (rx.totalQuantity || 0) - (rx.dispensedTotal || 0),
    );

    let dispenseQty = 0;
    if (dispenseForm.status === "partial") {
      if (!dispenseForm.quantity || parseFloat(dispenseForm.quantity) <= 0) {
        alert("Please enter a valid quantity.");
        return;
      }
      dispenseQty = parseFloat(dispenseForm.quantity);
      if (dispenseQty > remaining) {
        alert(`Cannot dispense more than remaining (${remaining}).`);
        return;
      }
    } else if (dispenseForm.status === "full") {
      if (remaining === 0) {
        alert("No remaining quantity to dispense.");
        return;
      }
      dispenseQty = remaining;
    } else {
      dispenseQty = 0;
    }

    setIsSubmitting(true);
    try {
      const newDispensedTotal = (rx.dispensedTotal || 0) + dispenseQty;
      const newStatus =
        dispenseForm.status === "full"
          ? "full"
          : dispenseForm.status === "partial"
            ? "partial"
            : dispenseForm.status;
      const updateData: any = {
        dispensed: true,
        dispensedStatus: newStatus,
        pharmacistNotes: dispenseForm.notes || undefined,
        dispensedAt: new Date().toISOString(),
        dispensedById: user?.id,
        dispensedTotal: newDispensedTotal,
        dispensedQuantity: dispenseQty,
      };

      await updatePrescription(patientId, index, updateData);

      if (dispenseQty > 0 && center?.id && user?.id) {
        const unitPrice = rx.price || 0;
        const totalAmount = unitPrice * dispenseQty;
        await addBillItem(
          center.id,
          user.id,
          user.fullName || "Pharmacist",
          user.role || "pharmacist",
          patientId,
          {
            type: "prescription",
            description: `${rx.medication} x${dispenseQty}`,
            amount: totalAmount,
            quantity: dispenseQty,
          },
        );
      }

      logAction(
        "update",
        "prescription",
        patientId,
        `Dispensed ${dispenseQty} units of ${rx.medication} – ${dispenseForm.status}`,
      );
      closeDispense();
      await refetch();
    } catch (err) {
      alert("Failed to dispense.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <DispensingSkeleton />;

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
              Dispensing
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
          Dispensing Monitor
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          View and manage all medication dispensing activity
        </p>
      </header>

      {/* ─── Stat pills ─────────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-6 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 mb-3 md:mb-5">
        <StatPill label="Total" value={stats.total} tone="slate" icon={Pill} />
        <StatPill
          label="Pending"
          value={stats.pending}
          tone="slate"
          icon={Clock}
        />
        <StatPill
          label="Full"
          value={stats.full}
          tone="emerald"
          icon={CheckCircle2}
        />
        <StatPill
          label="Partial"
          value={stats.partial}
          tone="amber"
          icon={AlertCircle}
        />
        <StatPill
          label="Out of Stock"
          value={stats.outOfStock}
          tone="rose"
          icon={AlertCircle}
        />
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
          placeholder="Search by patient or medication…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
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
      {filtered.length === 0 ? (
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
        <>
          {/* ── Mobile: cards ─────────────────────────────── */}
          <div className="md:hidden space-y-2.5">
            {filtered.map((prescription) => {
              const totalQty = prescription.totalQuantity || 0;
              const dispensed = prescription.dispensedTotal || 0;
              const remaining = Math.max(0, totalQty - dispensed);
              const isPending =
                !prescription.dispensed ||
                prescription.dispensedStatus === "none" ||
                remaining > 0;

              return (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-emerald-200 transition-colors"
                >
                  {/* Top row */}
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg shrink-0">
                      <Pill className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {prescription.patientName}
                        </h3>
                        <StatusBadge status={prescription.dispensedStatus} />
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 truncate">
                        {prescription.medication} · {prescription.dosage}
                      </p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        Qty
                      </p>
                      <p className="text-xs font-bold text-slate-900 tabular-nums mt-0.5">
                        {totalQty - dispensed}/{totalQty}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        Price
                      </p>
                      <p className="text-xs font-bold text-slate-900 tabular-nums mt-0.5">
                        ₦{prescription.price?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        Date
                      </p>
                      <p className="text-[10px] font-medium text-slate-600 tabular-nums mt-0.5 truncate">
                        {new Date(prescription.prescribedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" },
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
                    <button
                      onClick={() => openDetail(prescription)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3 h-3" />
                      Details
                    </button>
                    {canDispense && isPending && remaining > 0 && (
                      <button
                        onClick={() =>
                          openDispense(
                            prescription.patientId,
                            prescription.index,
                          )
                        }
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        Dispense
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* ── Desktop: table ─────────────────────────────── */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort("patient")}
                    >
                      <div className="flex items-center gap-1">
                        Patient
                        {sortBy === "patient" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort("drug")}
                    >
                      <div className="flex items-center gap-1">
                        Medication
                        {sortBy === "drug" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Dosage
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Qty / Remaining
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort("prescribedAt")}
                    >
                      <div className="flex items-center gap-1">
                        Prescribed
                        {sortBy === "prescribedAt" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortBy === "status" &&
                          (sortOrder === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((prescription) => {
                    const totalQty = prescription.totalQuantity || 0;
                    const dispensed = prescription.dispensedTotal || 0;
                    const remaining = Math.max(0, totalQty - dispensed);
                    const isPending =
                      !prescription.dispensed ||
                      prescription.dispensedStatus === "none" ||
                      remaining > 0;
                    return (
                      <tr
                        key={prescription.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-3 py-2.5 font-bold text-slate-900 truncate max-w-[140px]">
                          {prescription.patientName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 truncate max-w-[140px]">
                          {prescription.medication}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 text-[11px]">
                          {prescription.dosage}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 tabular-nums text-[11px]">
                          {totalQty} / {remaining}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 tabular-nums text-[11px]">
                          ₦{prescription.price?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 text-[11px] tabular-nums">
                          {formatDate(prescription.prescribedAt)}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={prescription.dispensedStatus} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openDetail(prescription)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {canDispense && isPending && remaining > 0 && (
                              <button
                                onClick={() =>
                                  openDispense(
                                    prescription.patientId,
                                    prescription.index,
                                  )
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm"
                              >
                                Dispense
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selectedPrescription && (
          <DetailModal
            prescription={selectedPrescription}
            onClose={closeDetail}
            formatDate={formatDate}
          />
        )}
      </AnimatePresence>

      {/* ─── Dispense Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {dispenseModal && (
          <DispenseActionModal
            form={dispenseForm}
            setForm={setDispenseForm}
            onConfirm={confirmDispense}
            onClose={closeDispense}
            isSubmitting={isSubmitting}
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
function DetailModal({ prescription, onClose, formatDate }: any) {
  const style = getStatusStyle(prescription.dispensedStatus);
  const isPending =
    !prescription.dispensed || prescription.dispensedStatus === "none";
  const totalQty = prescription.totalQuantity || 0;
  const dispensed = prescription.dispensedTotal || 0;
  const remaining = Math.max(0, totalQty - dispensed);

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
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

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
                Price per unit
              </p>
              <p className="text-xs font-bold text-slate-900 tabular-nums">
                ₦{prescription.price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Total Quantity
              </p>
              <p className="text-xs font-bold text-slate-900 tabular-nums">
                {totalQty}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Remaining
              </p>
              <p className="text-xs font-bold text-emerald-700 tabular-nums">
                {remaining}
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

          {/* Dispense history */}
          {!isPending && (
            <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                      Last Qty
                    </span>
                    <p className="font-bold text-emerald-900 tabular-nums mt-0.5">
                      {prescription.dispensedQuantity}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                    Total Dispensed
                  </span>
                  <p className="font-bold text-emerald-900 tabular-nums mt-0.5">
                    {prescription.dispensedTotal || 0}
                  </p>
                </div>
                {prescription.dispensedAt && (
                  <div>
                    <span className="text-[9px] text-emerald-700 uppercase tracking-wide">
                      Dispensed At
                    </span>
                    <p className="font-bold text-emerald-900 tabular-nums mt-0.5 text-[10px]">
                      {formatDate(prescription.dispensedAt)}
                    </p>
                  </div>
                )}
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
        </div>
      </motion.div>
    </div>
  );
}

// ─── Dispense Action Modal (bottom sheet) ───────────────────────────
function DispenseActionModal({
  form,
  setForm,
  onConfirm,
  onClose,
  isSubmitting,
}: any) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Dispense Medication
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as any })
              }
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition"
            >
              <option value="full">Full Dispense (Remaining)</option>
              <option value="partial">Partial Dispense</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {form.status === "partial" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 tabular-nums outline-none transition"
                placeholder="e.g., 10"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Pharmacist Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none transition"
              placeholder="Any additional notes…"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={
              isSubmitting || (form.status === "partial" && !form.quantity)
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
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────
function DispensingSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-48 bg-slate-200 rounded mb-1" />
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
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-32"
          />
        ))}
      </div>
    </div>
  );
}
