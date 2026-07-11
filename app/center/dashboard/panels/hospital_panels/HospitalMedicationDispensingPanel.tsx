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
  ChevronRight,
  Loader2,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  ChevronUp,
  ChevronDown,
  Eye,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { useHospitalPharmacyMedicationDispensing } from "../../dashboards/hooks/useHospitalPharmacyMedicationDispensing";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../../dashboards/hooks/useAuditLog";

// ─── Role Check ──────────────────────────────────────────────────────

const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (r.includes("admin") || r.includes("owner") || r.includes("manager"))
    return "admin";
  return "support";
};

// ─── Main Component ──────────────────────────────────────────────────

export default function HospitalMedicationDispensingPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const canDispense =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    prescriptions,
    loading,
    refetch,
    updatePrescription,
    filterPrescriptions,
    stats,
  } = useHospitalPharmacyMedicationDispensing(center?.id, user?.id);

  // ─── State ────────────────────────────────────────────────────────
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

  // ─── Computed ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return filterPrescriptions({
      search: searchTerm,
      status: statusFilter as any,
      sortBy,
      sortOrder,
    });
  }, [filterPrescriptions, searchTerm, statusFilter, sortBy, sortOrder]);

  // ─── Handlers ────────────────────────────────────────────────────
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
        `Dispensed medication – ${dispenseForm.status}`,
      );
      closeDispense();
      await refetch();
    } catch (err) {
      alert("Failed to dispense.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle2,
        };
      case "partial":
        return {
          label: "Partial",
          bg: "bg-amber-100",
          text: "text-amber-800",
          border: "border-amber-200",
          icon: AlertCircle,
        };
      case "out_of_stock":
        return {
          label: "Out of Stock",
          bg: "bg-rose-100",
          text: "text-rose-800",
          border: "border-rose-200",
          icon: AlertCircle,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-slate-100",
          text: "text-slate-700",
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

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) return <DispensingSkeleton />;

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Medication Dispensing
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {prescriptions.length} total
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Dispensing Monitor
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-md">
              View and manage all medication dispensing activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </header>

        {/* Stats */}
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
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Partial"
            value={stats.partial}
            icon={AlertCircle}
            color="amber"
          />
          <StatCard
            label="Out of Stock"
            value={stats.outOfStock}
            icon={AlertCircle}
            color="rose"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={X}
            color="slate"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by patient or medication..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 outline-none"
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

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">
                No prescriptions found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Prescriptions will appear here once ordered."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-slate-900"
                    onClick={() => toggleSort("patient")}
                  >
                    <div className="flex items-center gap-1">
                      Patient
                      {sortBy === "patient" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-slate-900"
                    onClick={() => toggleSort("drug")}
                  >
                    <div className="flex items-center gap-1">
                      Medication
                      {sortBy === "drug" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Dosage</th>
                  <th
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-slate-900"
                    onClick={() => toggleSort("prescribedAt")}
                  >
                    <div className="flex items-center gap-1">
                      Prescribed
                      {sortBy === "prescribedAt" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-slate-900"
                    onClick={() => toggleSort("dispensedAt")}
                  >
                    <div className="flex items-center gap-1">
                      Dispensed
                      {sortBy === "dispensedAt" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left font-medium cursor-pointer hover:text-slate-900"
                    onClick={() => toggleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === "status" &&
                        (sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prescription) => {
                  const config = getStatusConfig(prescription.dispensedStatus);
                  const Icon = config.icon;
                  const isPending =
                    !prescription.dispensed ||
                    prescription.dispensedStatus === "none";
                  return (
                    <motion.tr
                      key={prescription.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {prescription.patientName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {prescription.medication}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {prescription.dosage}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(prescription.prescribedAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(prescription.dispensedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border inline-flex items-center gap-1",
                            config.bg,
                            config.text,
                            config.border,
                          )}
                        >
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetail(prescription)}
                            className="p-1 text-blue-600 hover:text-blue-800 rounded focus:ring-2 focus:ring-emerald-500"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canDispense && isPending && (
                            <button
                              onClick={() =>
                                openDispense(
                                  prescription.patientId,
                                  prescription.index,
                                )
                              }
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              Dispense
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPrescription && (
          <DetailModal
            prescription={selectedPrescription}
            onClose={closeDetail}
            formatDate={formatDate}
            getStatusConfig={getStatusConfig}
          />
        )}
      </AnimatePresence>

      {/* Dispense Modal */}
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

// ─── Subcomponents ──────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
    slate: "bg-slate-100 text-slate-700",
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

function FilterButton({ label, value, currentFilter, onClick }: any) {
  const isActive = currentFilter === value;
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
        isActive
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function DetailModal({
  prescription,
  onClose,
  formatDate,
  getStatusConfig,
}: any) {
  const config = getStatusConfig(prescription.dispensedStatus);
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
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
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
                Status
              </label>
              <span
                className={cn(
                  "inline-block px-2.5 py-1 rounded-full text-xs font-medium border",
                  config.bg,
                  config.text,
                )}
              >
                {config.label}
              </span>
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
                Prescribed At
              </label>
              <p className="font-semibold text-slate-900">
                {formatDate(prescription.prescribedAt)}
              </p>
            </div>
          </div>

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

          {!isPending && (
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
        </div>
      </motion.div>
    </div>
  );
}

function DispenseActionModal({
  form,
  setForm,
  onConfirm,
  onClose,
  isSubmitting,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Dispense Medication
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status <span className="text-emerald-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="full">Full Dispense</option>
              <option value="partial">Partial Dispense</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {form.status === "partial" && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quantity <span className="text-emerald-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 10"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pharmacist Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <button
            onClick={onConfirm}
            disabled={
              isSubmitting || (form.status === "partial" && !form.quantity)
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
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function DispensingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-6 gap-2">
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
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
