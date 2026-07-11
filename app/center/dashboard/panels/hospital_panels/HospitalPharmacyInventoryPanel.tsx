// app/center/dashboard/panels/HospitalPharmacyInventoryPanel.tsx
"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Bell,
  Calendar,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import {
  usePharmacyInventory,
  PharmacyDrug,
} from "../../dashboards/hooks/useHospitalPharmacyInventory";
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

export default function HospitalPharmacyInventoryPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();
  const tableRef = useRef<HTMLDivElement>(null);

  const normalizedRole = normalizeRole(user?.role);
  const canManage =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    drugs,
    loading,
    refetch,
    addDrug,
    updateDrug,
    deleteDrug,
    adjustStock,
  } = usePharmacyInventory(center?.id, user?.id);

  // ─── State ────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<PharmacyDrug | null>(null);
  const [formData, setFormData] = useState<Partial<PharmacyDrug>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  // ─── Helper: Check if a drug is expiring within 4 weeks ──────
  const isExpiringSoon = (drug: PharmacyDrug): boolean => {
    if (!drug.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(drug.expiryDate);
    const diff = expiry.getTime() - today.getTime();
    return diff > 0 && diff < 28 * 24 * 60 * 60 * 1000; // 4 weeks
  };

  // ─── Expiry Alerts ──────────────────────────────────────────────
  const expiryAlerts = useMemo(() => {
    const today = new Date();
    const fourWeeks = 28 * 24 * 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return drugs
      .filter((d) => d.expiryDate)
      .map((d) => {
        const expiry = new Date(d.expiryDate!);
        const diff = expiry.getTime() - today.getTime();
        if (diff < 0) return null; // expired – handled by status
        if (diff < fourWeeks) {
          return {
            ...d,
            daysLeft: Math.ceil(diff / (24 * 60 * 60 * 1000)),
            severity: diff < oneWeek ? "critical" : "warning",
          };
        }
        return null;
      })
      .filter(Boolean) as Array<
      PharmacyDrug & { daysLeft: number; severity: "warning" | "critical" }
    >;
  }, [drugs]);

  const alertCount = expiryAlerts.length;
  const criticalCount = expiryAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  // ─── Filtered Drugs ──────────────────────────────────────────────
  const filteredDrugs = useMemo(() => {
    let filtered = drugs;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.category?.toLowerCase().includes(term) ||
          d.supplier?.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      if (statusFilter === "expiring-soon") {
        // ✅ Special filter for expiring soon
        filtered = filtered.filter((d) => isExpiringSoon(d));
      } else {
        filtered = filtered.filter((d) => d.status === statusFilter);
      }
    }
    return filtered;
  }, [drugs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = drugs.length;
    const lowStock = drugs.filter(
      (d) => d.status === "low-stock" || d.status === "out-of-stock",
    ).length;
    const expired = drugs.filter((d) => d.status === "expired").length;
    const inStock = drugs.filter((d) => d.status === "in-stock").length;
    const expiringSoon = drugs.filter((d) => isExpiringSoon(d)).length;
    return { total, lowStock, expired, inStock, expiringSoon };
  }, [drugs]);

  // ─── Handlers ────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const openCreateModal = () => {
    setEditingDrug(null);
    setFormData({
      name: "",
      strength: "",
      form: "Tablet",
      packSize: 1,
      unit: "tablet",
      quantity: 0,
      reorderPoint: 10,
      expiryDate: "",
      batchNumber: "",
      supplier: "",
      location: "",
      category: "",
      costPerUnit: 0,
      sellingPrice: 0,
    });
    setModalOpen(true);
  };

  const openEditModal = (drug: PharmacyDrug) => {
    setEditingDrug(drug);
    setFormData({ ...drug });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDrug(null);
    setFormData({});
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (editingDrug) {
        await updateDrug(editingDrug.id, formData);
        logAction(
          "update",
          "pharmacy-inventory",
          editingDrug.id,
          `Updated drug ${formData.name}`,
        );
      } else {
        await addDrug(formData as any);
        logAction(
          "create",
          "pharmacy-inventory",
          "new",
          `Added drug ${formData.name}`,
        );
      }
      closeModal();
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save drug");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDrug(id);
      logAction("delete", "pharmacy-inventory", id, `Deleted drug ${name}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete drug");
    }
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    const note = delta > 0 ? "Manual stock addition" : "Manual stock deduction";
    try {
      await adjustStock(id, delta, note);
      logAction(
        "update",
        "pharmacy-inventory",
        id,
        `Adjusted stock by ${delta}`,
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to adjust stock");
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  };

  const handleViewAllExpiring = () => {
    setStatusFilter("expiring-soon");
    // Optional: scroll to table after a short delay
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "in-stock":
        return {
          label: "In Stock",
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "low-stock":
        return {
          label: "Low Stock",
          bg: "bg-amber-100",
          text: "text-amber-800",
          border: "border-amber-200",
          icon: AlertTriangle,
        };
      case "out-of-stock":
        return {
          label: "Out of Stock",
          bg: "bg-rose-100",
          text: "text-rose-800",
          border: "border-rose-200",
          icon: AlertTriangle,
        };
      case "expired":
        return {
          label: "Expired",
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: Clock,
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: Package,
        };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) return <InventorySkeleton />;

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* ─── Expiry Alerts Banner ───────────────────────────────── */}
        {alertCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 border shadow-sm",
              criticalCount > 0
                ? "bg-rose-50 border-rose-200"
                : "bg-amber-50 border-amber-200",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  criticalCount > 0
                    ? "bg-rose-100 text-rose-600"
                    : "bg-amber-100 text-amber-600",
                )}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <h4 className="font-semibold text-slate-800">
                    {alertCount} drug{alertCount > 1 ? "s" : ""} expiring soon
                  </h4>
                  {criticalCount > 0 && (
                    <span className="text-xs font-medium bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full">
                      {criticalCount} critical (≤ 1 week)
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expiryAlerts
                    .filter((a) => !dismissedAlerts.has(a.id))
                    .slice(0, 5)
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border",
                          alert.severity === "critical"
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : "bg-amber-100 text-amber-700 border-amber-200",
                        )}
                      >
                        <Calendar className="w-3 h-3" />
                        <span>{alert.name}</span>
                        <span className="font-bold">
                          ({alert.daysLeft} days)
                        </span>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="ml-1 hover:text-slate-600"
                          aria-label="Dismiss alert"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  {expiryAlerts.length > 5 && (
                    <span className="text-xs text-slate-500">
                      +{expiryAlerts.length - 5} more
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleViewAllExpiring}
                className="text-xs font-medium text-slate-600 hover:text-slate-800 underline whitespace-nowrap"
              >
                View all
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── Header ──────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Pharmacy Inventory
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {drugs.length} items
              </span>
              {alertCount > 0 && (
                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
                  {alertCount} expiring
                </span>
              )}
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Drug Stock
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-md">
              Manage pharmacy drug inventory, track stock levels, and expiry
              dates.
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
            {canManage && (
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" /> Add Drug
              </button>
            )}
          </div>
        </header>

        {/* ─── Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            label="Total Items"
            value={stats.total}
            icon={Package}
            color="emerald"
          />
          <StatCard
            label="In Stock"
            value={stats.inStock}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Low/Out"
            value={stats.lowStock}
            icon={AlertTriangle}
            color="amber"
          />
          <StatCard
            label="Expired"
            value={stats.expired}
            icon={Clock}
            color="slate"
          />
          <StatCard
            label="Expiring Soon"
            value={stats.expiringSoon}
            icon={Calendar}
            color="orange"
          />
        </div>

        {/* ─── Search & Filter ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, category, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 outline-none"
              aria-label="Search drugs"
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
              label="In Stock"
              value="in-stock"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("in-stock")}
            />
            <FilterButton
              label="Low Stock"
              value="low-stock"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("low-stock")}
            />
            <FilterButton
              label="Out of Stock"
              value="out-of-stock"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("out-of-stock")}
            />
            <FilterButton
              label="Expired"
              value="expired"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("expired")}
            />
            <FilterButton
              label="Expiring Soon"
              value="expiring-soon"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("expiring-soon")}
            />
          </div>
        </div>

        {/* ─── Table ────────────────────────────────────────────────── */}
        <div
          ref={tableRef}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto"
        >
          {filteredDrugs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">No drugs found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first drug to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Drug Name</th>
                  <th className="px-4 py-3 text-left font-medium">Strength</th>
                  <th className="px-4 py-3 text-left font-medium">Form</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrugs.map((drug) => {
                  const config = getStatusConfig(drug.status);
                  const Icon = config.icon;
                  const isExpanded = expandedRow === drug.id;
                  const expiringSoon = isExpiringSoon(drug);
                  return (
                    <React.Fragment key={drug.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {drug.name}
                          {expiringSoon && (
                            <span className="ml-2 inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              expiring
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {drug.strength || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {drug.form}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {drug.quantity} {drug.unit}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {formatDate(drug.expiryDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium border",
                              config.bg,
                              config.text,
                              config.border,
                            )}
                          >
                            <Icon className="inline w-3 h-3 mr-1" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAdjustStock(drug.id, -1)}
                              className="p-1 text-slate-500 hover:text-slate-700 rounded focus:ring-2 focus:ring-emerald-500"
                              title="Decrease by 1"
                              aria-label={`Decrease stock of ${drug.name} by 1`}
                            >
                              <span className="text-sm font-bold">−</span>
                            </button>
                            <button
                              onClick={() => handleAdjustStock(drug.id, 1)}
                              className="p-1 text-slate-500 hover:text-slate-700 rounded focus:ring-2 focus:ring-emerald-500"
                              title="Increase by 1"
                              aria-label={`Increase stock of ${drug.name} by 1`}
                            >
                              <span className="text-sm font-bold">+</span>
                            </button>
                            {canManage && (
                              <>
                                <button
                                  onClick={() => openEditModal(drug)}
                                  className="p-1 text-blue-600 hover:text-blue-800 rounded focus:ring-2 focus:ring-emerald-500"
                                  title="Edit"
                                  aria-label={`Edit ${drug.name}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDelete(drug.id, drug.name)
                                  }
                                  className="p-1 text-rose-600 hover:text-rose-800 rounded focus:ring-2 focus:ring-emerald-500"
                                  title="Delete"
                                  aria-label={`Delete ${drug.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : drug.id)
                              }
                              className="p-1 text-slate-500 hover:text-slate-700 rounded focus:ring-2 focus:ring-emerald-500"
                              aria-label={
                                isExpanded
                                  ? "Collapse details"
                                  : "Expand details"
                              }
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-slate-50/80">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500">Batch #</span>
                                <p className="font-medium text-slate-800">
                                  {drug.batchNumber || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Supplier</span>
                                <p className="font-medium text-slate-800">
                                  {drug.supplier || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Location</span>
                                <p className="font-medium text-slate-800">
                                  {drug.location || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">Category</span>
                                <p className="font-medium text-slate-800">
                                  {drug.category || "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Cost/Unit
                                </span>
                                <p className="font-medium text-slate-800">
                                  {drug.costPerUnit
                                    ? `₦${drug.costPerUnit}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Sell Price
                                </span>
                                <p className="font-medium text-slate-800">
                                  {drug.sellingPrice
                                    ? `₦${drug.sellingPrice}`
                                    : "N/A"}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Reorder Point
                                </span>
                                <p className="font-medium text-slate-800">
                                  {drug.reorderPoint}
                                </p>
                              </div>
                              <div>
                                <span className="text-slate-500">
                                  Pack Size
                                </span>
                                <p className="font-medium text-slate-800">
                                  {drug.packSize}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Add/Edit Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <DrugFormModal
            editing={editingDrug}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onClose={closeModal}
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
    orange: "bg-orange-50 text-orange-700",
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

function DrugFormModal({
  editing,
  formData,
  setFormData,
  onSave,
  onClose,
  isSubmitting,
}: any) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2
            className={cn(
              "text-xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {editing ? "Edit Drug" : "Add New Drug"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Drug Name *
              </label>
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Strength
              </label>
              <input
                name="strength"
                value={formData.strength || ""}
                onChange={handleChange}
                placeholder="e.g., 500mg"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Form *
              </label>
              <select
                name="form"
                value={formData.form || "Tablet"}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Drops">Drops</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pack Size *
              </label>
              <input
                name="packSize"
                type="number"
                min="1"
                value={formData.packSize || 1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Unit *
              </label>
              <input
                name="unit"
                value={formData.unit || "tablet"}
                onChange={handleChange}
                placeholder="e.g., tablet, ml, vial"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Quantity *
              </label>
              <input
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity ?? 0}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reorder Point
              </label>
              <input
                name="reorderPoint"
                type="number"
                min="0"
                value={formData.reorderPoint || 10}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expiry Date
              </label>
              <input
                name="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batch Number
              </label>
              <input
                name="batchNumber"
                value={formData.batchNumber || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier
              </label>
              <input
                name="supplier"
                value={formData.supplier || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Location (Shelf/Rack)
              </label>
              <input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <input
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                placeholder="e.g., Antibiotics"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Cost per Unit (₦)
              </label>
              <input
                name="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerUnit ?? ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Selling Price (₦)
              </label>
              <input
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice ?? ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSubmitting || !formData.name}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {editing ? "Update" : "Add"} Drug
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function InventorySkeleton() {
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
            <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="w-full max-w-md h-11 bg-slate-200 rounded-xl animate-pulse" />
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
