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
  ChevronDown,
  ChevronUp,
  Bell,
  Calendar,
  Minus,
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

// ─── Status styling ─────────────────────────────────────────────────
const getStatusStyle = (status: string) => {
  const map: Record<string, { bg: string; icon: any; label: string }> = {
    "in-stock": {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "In Stock",
    },
    "low-stock": {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertTriangle,
      label: "Low Stock",
    },
    "out-of-stock": {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: AlertTriangle,
      label: "Out of Stock",
    },
    expired: {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: Clock,
      label: "Expired",
    },
  };
  return (
    map[status] || {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: Package,
      label: status,
    }
  );
};

const StatusBadge = ({ status }: { status: string }) => {
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
export default function HospitalPharmacyInventoryPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();
  const tableRef = useRef<HTMLDivElement>(null);

  const normalizedRole = normalizeRole(user?.role);
  const canManage =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  const {
    drugs,
    loading,
    refetch,
    addDrug,
    updateDrug,
    deleteDrug,
    adjustStock,
  } = usePharmacyInventory(center?.id, user?.id);

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

  const isExpiringSoon = (drug: PharmacyDrug): boolean => {
    if (!drug.expiryDate) return false;
    const today = new Date();
    const expiry = new Date(drug.expiryDate);
    const diff = expiry.getTime() - today.getTime();
    return diff > 0 && diff < 28 * 24 * 60 * 60 * 1000;
  };

  const expiryAlerts = useMemo(() => {
    const today = new Date();
    const fourWeeks = 28 * 24 * 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return drugs
      .filter((d) => d.expiryDate)
      .map((d) => {
        const expiry = new Date(d.expiryDate!);
        const diff = expiry.getTime() - today.getTime();
        if (diff < 0) return null;
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
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) return <InventorySkeleton />;

  const statusTabs = [
    { value: "all", label: "All", count: stats.total },
    { value: "in-stock", label: "In Stock", count: stats.inStock },
    {
      value: "low-stock",
      label: "Low",
      count: drugs.filter((d) => d.status === "low-stock").length,
    },
    {
      value: "out-of-stock",
      label: "Out",
      count: drugs.filter((d) => d.status === "out-of-stock").length,
    },
    { value: "expired", label: "Expired", count: stats.expired },
    { value: "expiring-soon", label: "Expiring", count: stats.expiringSoon },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Expiry alerts ─────────────────────────────────── */}
      {alertCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-3 md:p-4 border mb-3 md:mb-5",
            criticalCount > 0
              ? "bg-rose-50 border-rose-200"
              : "bg-amber-50 border-amber-200",
          )}
        >
          <div className="flex items-start gap-2.5 md:gap-3">
            <div
              className={cn(
                "p-1.5 md:p-2 rounded-lg shrink-0",
                criticalCount > 0
                  ? "bg-rose-100 text-rose-600"
                  : "bg-amber-100 text-amber-600",
              )}
            >
              <Bell className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1.5">
                <h4 className="text-[11px] md:text-xs font-bold text-slate-800">
                  {alertCount} drug{alertCount > 1 ? "s" : ""} expiring soon
                </h4>
                {criticalCount > 0 && (
                  <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-full">
                    {criticalCount} critical
                  </span>
                )}
              </div>
              <div className="-mx-1 flex flex-wrap gap-1.5">
                {expiryAlerts
                  .filter((a) => !dismissedAlerts.has(a.id))
                  .slice(0, 4)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-semibold border max-w-full",
                        alert.severity === "critical"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-amber-100 text-amber-700 border-amber-200",
                      )}
                    >
                      <Calendar className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate max-w-[100px]">
                        {alert.name}
                      </span>
                      <span className="font-bold tabular-nums shrink-0">
                        {alert.daysLeft}d
                      </span>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="hover:text-slate-600 shrink-0"
                        aria-label="Dismiss"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                {expiryAlerts.length > 4 && (
                  <span className="text-[10px] md:text-[11px] text-slate-500 self-center">
                    +{expiryAlerts.length - 4} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleViewAllExpiring}
              className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 whitespace-nowrap underline shrink-0"
            >
              View all
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Pharmacy
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {drugs.length}
            </span>
            {alertCount > 0 && (
              <span
                className={cn(
                  "text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums",
                  criticalCount > 0
                    ? "text-rose-700 bg-rose-50 border border-rose-200"
                    : "text-amber-700 bg-amber-50 border border-amber-200",
                )}
              >
                {alertCount} expiring
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Add Drug</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Drug Stock
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Manage pharmacy drug inventory, stock levels, and expiry dates
        </p>
      </header>

      {/* ─── Stat pills ─────────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-5 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 mb-3 md:mb-5">
        <StatPill
          label="Total"
          value={stats.total}
          tone="slate"
          icon={Package}
        />
        <StatPill
          label="In Stock"
          value={stats.inStock}
          tone="emerald"
          icon={CheckCircle}
        />
        <StatPill
          label="Low/Out"
          value={stats.lowStock}
          tone="amber"
          icon={AlertTriangle}
        />
        <StatPill
          label="Expired"
          value={stats.expired}
          tone="slate"
          icon={Clock}
        />
        <StatPill
          label="Expiring"
          value={stats.expiringSoon}
          tone="amber"
          icon={Calendar}
        />
      </div>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, category, supplier…"
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
      {filteredDrugs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No drugs found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Add your first drug to get started."}
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
            {filteredDrugs.map((drug) => {
              const isExpanded = expandedRow === drug.id;
              const expiringSoon = isExpiringSoon(drug);
              return (
                <motion.div
                  key={drug.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 transition-colors overflow-hidden"
                >
                  {/* Top: name + status + stock adjust */}
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {drug.name}
                          {expiringSoon && (
                            <span className="ml-1.5 inline-block text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                              expiring
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {drug.strength ? `${drug.strength} · ` : ""}
                          {drug.form}
                          {drug.category ? ` · ${drug.category}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={drug.status} />
                    </div>

                    {/* Stock adjust quick action */}
                    <div className="flex items-center justify-between gap-2 py-2 border-y border-slate-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Stock
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAdjustStock(drug.id, -1)}
                          className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          aria-label="Decrease stock"
                        >
                          <Minus className="w-3 h-3 text-slate-600" />
                        </button>
                        <span className="text-sm font-bold text-slate-900 tabular-nums min-w-[52px] text-center">
                          {drug.quantity}
                          <span className="text-[9px] text-slate-500 font-medium ml-0.5">
                            {drug.unit}
                          </span>
                        </span>
                        <button
                          onClick={() => handleAdjustStock(drug.id, 1)}
                          className="w-7 h-7 flex items-center justify-center bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                          aria-label="Increase stock"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                        </button>
                      </div>
                    </div>

                    {/* Expiry + reorder */}
                    <div className="grid grid-cols-2 gap-2.5 mt-2.5">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          Expiry
                        </p>
                        <p className="text-[10px] font-medium text-slate-700 tabular-nums mt-0.5 truncate">
                          {formatDate(drug.expiryDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                          Reorder at
                        </p>
                        <p className="text-[10px] font-medium text-slate-700 tabular-nums mt-0.5">
                          {drug.reorderPoint}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-1.5 p-2.5 bg-slate-50/50 border-t border-slate-100">
                    <button
                      onClick={() =>
                        setExpandedRow(isExpanded ? null : drug.id)
                      }
                      className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Details
                        </>
                      )}
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEditModal(drug)}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(drug.id, drug.name)}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors shrink-0"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-slate-100"
                      >
                        <div className="grid grid-cols-2 gap-3 p-3.5">
                          <DetailCell label="Batch" value={drug.batchNumber} />
                          <DetailCell label="Supplier" value={drug.supplier} />
                          <DetailCell label="Location" value={drug.location} />
                          <DetailCell label="Category" value={drug.category} />
                          <DetailCell
                            label="Cost/Unit"
                            value={
                              drug.costPerUnit
                                ? `₦${drug.costPerUnit.toLocaleString()}`
                                : undefined
                            }
                          />
                          <DetailCell
                            label="Sell Price"
                            value={
                              drug.sellingPrice
                                ? `₦${drug.sellingPrice.toLocaleString()}`
                                : undefined
                            }
                          />
                          <DetailCell
                            label="Pack Size"
                            value={String(drug.packSize || "—")}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* ── Desktop: table ─────────────────────────────── */}
          <div
            ref={tableRef}
            className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Drug Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Strength
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrugs.map((drug) => {
                    const isExpanded = expandedRow === drug.id;
                    const expiringSoon = isExpiringSoon(drug);
                    return (
                      <React.Fragment key={drug.id}>
                        <tr className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-slate-900 max-w-[160px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate">{drug.name}</span>
                              {expiringSoon && (
                                <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">
                                  expiring
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 text-[11px]">
                            {drug.strength || "—"}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 text-[11px]">
                            {drug.form}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 tabular-nums text-[11px]">
                            {drug.quantity} {drug.unit}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 tabular-nums text-[11px]">
                            {formatDate(drug.expiryDate)}
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge status={drug.status} />
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleAdjustStock(drug.id, -1)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Decrease by 1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleAdjustStock(drug.id, 1)}
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Increase by 1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => openEditModal(drug)}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDelete(drug.id, drug.name)
                                    }
                                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() =>
                                  setExpandedRow(isExpanded ? null : drug.id)
                                }
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                aria-label={isExpanded ? "Hide" : "Show"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-3 py-3 bg-slate-50/60 border-t border-slate-100"
                            >
                              <div className="grid grid-cols-4 gap-4 text-xs">
                                <DetailCell
                                  label="Batch #"
                                  value={drug.batchNumber}
                                />
                                <DetailCell
                                  label="Supplier"
                                  value={drug.supplier}
                                />
                                <DetailCell
                                  label="Location"
                                  value={drug.location}
                                />
                                <DetailCell
                                  label="Category"
                                  value={drug.category}
                                />
                                <DetailCell
                                  label="Cost/Unit"
                                  value={
                                    drug.costPerUnit
                                      ? `₦${drug.costPerUnit.toLocaleString()}`
                                      : undefined
                                  }
                                />
                                <DetailCell
                                  label="Sell Price"
                                  value={
                                    drug.sellingPrice
                                      ? `₦${drug.sellingPrice.toLocaleString()}`
                                      : undefined
                                  }
                                />
                                <DetailCell
                                  label="Reorder Point"
                                  value={String(drug.reorderPoint)}
                                />
                                <DetailCell
                                  label="Pack Size"
                                  value={String(drug.packSize)}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── Add/Edit Modal ─────────────────────────────────── */}
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

// ─── Detail Cell ────────────────────────────────────────────────────
function DetailCell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-[11px] md:text-xs font-medium text-slate-800 truncate mt-0.5">
        {value || "N/A"}
      </p>
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

// ─── Drug Form Modal (bottom sheet on mobile) ───────────────────────
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
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h2
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {editing ? "Edit Drug" : "Add New Drug"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>
                Drug Name <span className="text-rose-500">*</span>
              </label>
              <input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="e.g., Paracetamol"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Strength</label>
              <input
                name="strength"
                value={formData.strength || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="500mg"
              />
            </div>
            <div>
              <label className={labelClass}>
                Form <span className="text-rose-500">*</span>
              </label>
              <select
                name="form"
                value={formData.form || "Tablet"}
                onChange={handleChange}
                className={cn(inputClass, "truncate")}
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
              <label className={labelClass}>
                Pack Size <span className="text-rose-500">*</span>
              </label>
              <input
                name="packSize"
                type="number"
                min="1"
                value={formData.packSize || 1}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
          </div>

          {/* Stock + Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>
                Unit <span className="text-rose-500">*</span>
              </label>
              <input
                name="unit"
                value={formData.unit || "tablet"}
                onChange={handleChange}
                className={inputClass}
                placeholder="tablet, ml…"
              />
            </div>
            <div>
              <label className={labelClass}>
                Initial Qty <span className="text-rose-500">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity ?? 0}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
          </div>

          {/* Reorder + Expiry */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Reorder Point</label>
              <input
                name="reorderPoint"
                type="number"
                min="0"
                value={formData.reorderPoint || 10}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input
                name="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
          </div>

          {/* Batch + Supplier */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Batch Number</label>
              <input
                name="batchNumber"
                value={formData.batchNumber || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="BATCH-001"
              />
            </div>
            <div>
              <label className={labelClass}>Supplier</label>
              <input
                name="supplier"
                value={formData.supplier || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Emzor Pharma"
              />
            </div>
          </div>

          {/* Location + Category */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Location</label>
              <input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Shelf A1"
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input
                name="category"
                value={formData.category || ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="Antibiotics"
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Cost per Unit (₦)</label>
              <input
                name="costPerUnit"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPerUnit ?? ""}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
            <div>
              <label className={labelClass}>Selling Price (₦)</label>
              <input
                name="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice ?? ""}
                onChange={handleChange}
                className={cn(inputClass, "tabular-nums")}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSubmitting || !formData.name}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editing ? "Update Drug" : "Add Drug"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────
function InventorySkeleton() {
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
        {[1, 2, 3, 4, 5].map((i) => (
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
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-40"
          />
        ))}
      </div>
    </div>
  );
}
