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
  ChevronRight,
  Send,
  Ban,
  Package,
  Check,
  DollarSign,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { usePrescriptions } from "../dashboards/hooks/useHospitalPrescription";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../dashboards/hooks/useAuditLog";

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

// ─── Main Panel ──────────────────────────────────────────────────────

export default function HospitalPrescriptionPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const isPharmacist = normalizedRole === "pharmacist";
  const isAdmin = normalizedRole === "admin" || normalizedRole === "owner";
  const canDispense = isPharmacist || isAdmin;

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    prescriptions,
    loading,
    refetch: refetchPrescriptions,
    updatePrescription,
  } = usePrescriptions(center?.id, user?.id);

  // ─── State ────────────────────────────────────────────────────────
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

  // ─── Computed ────────────────────────────────────────────────────
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

  // ─── Handlers ────────────────────────────────────────────────────
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

  // ─── Status helpers ─────────────────────────────────────────────
  const getStatusConfig = (status: string | undefined) => {
    if (!status || status === "none") {
      return {
        label: "Pending",
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
        icon: Clock,
      };
    }
    switch (status) {
      case "full":
        return {
          label: "Full",
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "partial":
        return {
          label: "Partial",
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: Package,
        };
      case "out_of_stock":
        return {
          label: "Out of Stock",
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-200",
          icon: Ban,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-slate-100",
          text: "text-slate-600",
          border: "border-slate-200",
          icon: X,
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: AlertCircle,
        };
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────
  if (loading) {
    return <PrescriptionsSkeleton />;
  }

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
                Pharmacy Management
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {prescriptions.length} total
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Prescriptions
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Manage and dispense patient prescriptions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Refresh data"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </header>

        {/* ─── Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Pill}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="slate"
          />
          <StatCard
            label="Full"
            value={stats.full}
            icon={Check}
            color="emerald"
          />
          <StatCard
            label="Partial"
            value={stats.partial}
            icon={Package}
            color="amber"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            icon={Ban}
            color="amber"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={X}
            color="slate"
          />
        </div>

        {/* ─── Filters & Search ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, medication, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
              aria-label="Search prescriptions"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterButton
              label="All"
              value="all"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("all")}
            />
            <FilterButton
              label="Pending"
              value="pending"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("pending")}
            />
            <FilterButton
              label="Full"
              value="full"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("full")}
            />
            <FilterButton
              label="Partial"
              value="partial"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("partial")}
            />
            <FilterButton
              label="Out of Stock"
              value="out_of_stock"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("out_of_stock")}
            />
            <FilterButton
              label="Cancelled"
              value="cancelled"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("cancelled")}
            />
          </div>
        </div>

        {/* ─── Prescription List ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              {filteredPrescriptions.length} prescriptions found
            </span>
            <span className="text-xs text-slate-400">
              {statusFilter !== "all" ? `Filtered by: ${statusFilter}` : "All"}
            </span>
          </div>

          {filteredPrescriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No prescriptions found</p>
              <p className="text-sm mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Prescriptions will appear here once ordered"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPrescriptions.map((prescription) => {
                const statusConfig = getStatusConfig(
                  prescription.dispensedStatus,
                );
                const Icon = statusConfig.icon;
                const isPending =
                  !prescription.dispensed ||
                  prescription.dispensedStatus === "none";
                return (
                  <motion.div
                    key={prescription.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => openPrescriptionDetail(prescription.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border",
                            statusConfig.bg,
                            statusConfig.border,
                            statusConfig.text,
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {prescription.medication} {prescription.dosage}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {prescription.patientName}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" />
                              {prescription.prescribedBy || "Unknown"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(prescription.prescribedAt)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <DollarSign className="w-3.5 h-3.5" />₦
                              {prescription.price?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          {prescription.dispensedAt && (
                            <div className="text-xs text-slate-400 mt-1">
                              Dispensed: {formatDate(prescription.dispensedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-12 sm:ml-0">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border",
                            statusConfig.bg,
                            statusConfig.text,
                            statusConfig.border,
                          )}
                        >
                          {statusConfig.label}
                        </span>
                        {canDispense && isPending && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPrescriptionDetail(prescription.id);
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm"
                          >
                            Dispense
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Prescription Detail Modal ────────────────────────────── */}
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
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color: "emerald" | "amber" | "slate" | "blue" | "rose";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
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

interface FilterButtonProps {
  label: string;
  value: string;
  currentFilter: string;
  onClick: () => void;
}

function FilterButton({
  label,
  value,
  currentFilter,
  onClick,
}: FilterButtonProps) {
  const isActive = currentFilter === value;
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
        isActive
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

// ─── Prescription Detail Modal ──────────────────────────────────────

interface PrescriptionDetailModalProps {
  prescription: any;
  onClose: () => void;
  onDispense: (patientId: string, index: number) => Promise<void>;
  dispenseForm: any;
  setDispenseForm: (form: any) => void;
  isSubmitting: boolean;
  canDispense: boolean;
  user: any;
}

function PrescriptionDetailModal({
  prescription,
  onClose,
  onDispense,
  dispenseForm,
  setDispenseForm,
  isSubmitting,
  canDispense,
  user,
}: PrescriptionDetailModalProps) {
  const getStatusConfig = (status: string | undefined) => {
    if (!status || status === "none") {
      return { label: "Pending", bg: "bg-slate-100", text: "text-slate-700" };
    }
    switch (status) {
      case "full":
        return {
          label: "Full",
          bg: "bg-emerald-100",
          text: "text-emerald-700",
        };
      case "partial":
        return { label: "Partial", bg: "bg-amber-100", text: "text-amber-700" };
      case "out_of_stock":
        return {
          label: "Out of Stock",
          bg: "bg-amber-100",
          text: "text-amber-700",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-slate-100",
          text: "text-slate-600",
        };
      default:
        return { label: status, bg: "bg-slate-100", text: "text-slate-700" };
    }
  };
  const statusConfig = getStatusConfig(prescription.dispensedStatus);
  const isPending =
    !prescription.dispensed || prescription.dispensedStatus === "none";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Prescription Details
            </h2>
            <p className="text-sm text-slate-500">
              {prescription.medication} {prescription.dosage}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Patient & Order Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Patient
              </label>
              <p className="font-semibold text-slate-900">
                {prescription.patientName}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Prescribed By
              </label>
              <p className="font-semibold text-slate-900">
                {prescription.prescribedBy || "Unknown"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date Prescribed
              </label>
              <p className="font-semibold text-slate-900">
                {formatDate(prescription.prescribedAt)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </label>
              <span
                className={cn(
                  "inline-block px-2.5 py-1 rounded-full text-xs font-medium border",
                  statusConfig.bg,
                  statusConfig.text,
                )}
              >
                {statusConfig.label}
              </span>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Price
              </label>
              <p className="font-semibold text-slate-900">
                ₦{prescription.price?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          {/* Medication Details */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Medication Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-400">Medication</span>
                <p className="font-semibold text-slate-800">
                  {prescription.medication}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Dosage</span>
                <p className="font-semibold text-slate-800">
                  {prescription.dosage}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Frequency</span>
                <p className="font-semibold text-slate-800">
                  {prescription.frequency}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">Route</span>
                <p className="font-semibold text-slate-800">
                  {prescription.route}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400">Duration</span>
                <p className="font-semibold text-slate-800">
                  {prescription.duration}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400">Instructions</span>
                <p className="text-sm text-slate-700 italic">
                  "{prescription.instructions || "No special instructions"}"
                </p>
              </div>
            </div>
          </div>

          {/* Dispense Info */}
          {!isPending && (
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-emerald-800">
                  Dispensed
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-emerald-600">Status</span>
                  <p className="font-medium text-emerald-900 capitalize">
                    {prescription.dispensedStatus}
                  </p>
                </div>
                {prescription.dispensedQuantity && (
                  <div>
                    <span className="text-xs text-emerald-600">Quantity</span>
                    <p className="font-medium text-emerald-900">
                      {prescription.dispensedQuantity}
                    </p>
                  </div>
                )}
                <div className="col-span-2">
                  <span className="text-xs text-emerald-600">Notes</span>
                  <p className="text-sm text-emerald-800 italic">
                    {prescription.pharmacistNotes || "No notes"}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-emerald-600">Dispensed At</span>
                  <p className="text-sm text-emerald-800">
                    {formatDate(prescription.dispensedAt)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Dispense Form (if pharmacist and pending) */}
          {canDispense && isPending && (
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Dispense Medication
              </h5>
              <div>
                <label
                  htmlFor="dispense-status"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Dispense Status <span className="text-emerald-500">*</span>
                </label>
                <select
                  id="dispense-status"
                  value={dispenseForm.status}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="full">Full Dispense</option>
                  <option value="partial">Partial Dispense</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {dispenseForm.status === "partial" && (
                <div>
                  <label
                    htmlFor="dispense-quantity"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Quantity Dispensed{" "}
                    <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    id="dispense-quantity"
                    type="number"
                    min="1"
                    value={dispenseForm.quantity}
                    onChange={(e) =>
                      setDispenseForm({
                        ...dispenseForm,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., 10"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="dispense-notes"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Pharmacist Notes
                </label>
                <textarea
                  id="dispense-notes"
                  value={dispenseForm.notes}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      notes: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              <button
                onClick={() =>
                  onDispense(prescription.patientId, prescription.index)
                }
                disabled={
                  isSubmitting ||
                  (dispenseForm.status === "partial" && !dispenseForm.quantity)
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Confirm Dispense
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

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

// ─── Skeleton ──────────────────────────────────────────────────────

function PrescriptionsSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                  <div className="h-8 w-10 bg-slate-200 rounded mt-1" />
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <div className="w-full h-11 bg-slate-200 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-16 h-8 bg-slate-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* List Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-slate-200 rounded-xl" />
                    <div>
                      <div className="h-5 w-32 bg-slate-200 rounded" />
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-12 sm:ml-0">
                    <div className="h-6 w-16 bg-slate-200 rounded-full" />
                    <div className="w-4 h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
