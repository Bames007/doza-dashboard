// app/center/dashboard/panels/EquipmentPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope,
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Wrench,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  Filter,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import DeleteConfirm from "../components/DeleteConfirm";

// ─── Types ────────────────────────────────────────────────────────────

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status: "operational" | "maintenance" | "out_of_service";
  notes?: string;
  createdAt: string;
}

interface EquipmentFormData {
  name: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  lastMaintenance: string;
  nextMaintenance: string;
  status: Equipment["status"];
  notes: string;
}

// ─── Status styles — emerald/slate/rose only ──────────────────────
const getStatusStyle = (status: Equipment["status"]) => {
  const map: Record<string, { bg: string; icon: any; label: string }> = {
    operational: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Operational",
    },
    maintenance: {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: Wrench,
      label: "Maintenance",
    },
    out_of_service: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      label: "Out of Service",
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

const StatusBadge = ({ status }: { status: Equipment["status"] }) => {
  const style = getStatusStyle(status);
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        style.bg,
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {style.label}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────

export default function EquipmentPanel() {
  const { center, user } = useDashboard();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (center?.id) fetchEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.id]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/centers/${center?.id}/equipment`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) setEquipment(data.data);
      else setError(data.error);
    } catch {
      setError("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (item: EquipmentFormData) => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/equipment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        setEquipment((prev) => [...prev, data.data]);
        setShowAddModal(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to add equipment");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Equipment>) => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/equipment/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setEquipment((prev) => prev.map((e) => (e.id === id ? data.data : e)));
        setEditingItem(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to update equipment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/equipment/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) {
        setEquipment((prev) => prev.filter((e) => e.id !== id));
        setShowDeleteConfirm(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to delete equipment");
    }
  };

  const filteredEquipment = equipment.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.model?.toLowerCase().includes(search.toLowerCase()) ||
      e.serialNumber?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: equipment.length,
    operational: equipment.filter((e) => e.status === "operational").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
    out_of_service: equipment.filter((e) => e.status === "out_of_service")
      .length,
  };

  if (loading) return <EquipmentSkeleton />;

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + count + add button */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Equipment
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {equipment.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Equipment
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Manage laboratory instruments and devices
        </p>

        {/* Row 3: status filter chips — horizontal scroll */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {[
            { value: "all", label: "All", count: statusCounts.all },
            {
              value: "operational",
              label: "Operational",
              count: statusCounts.operational,
            },
            {
              value: "maintenance",
              label: "Maintenance",
              count: statusCounts.maintenance,
            },
            {
              value: "out_of_service",
              label: "Out of Service",
              count: statusCounts.out_of_service,
            },
          ].map((tab) => {
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
      </header>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3 md:mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search equipment…"
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs md:text-sm text-slate-800 placeholder:text-slate-400 outline-none shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── Error banner ───────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 md:p-3 mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-[11px] md:text-xs text-rose-700 font-medium truncate">
              {error}
            </span>
          </div>
          <button
            onClick={() => setError("")}
            className="p-1 hover:bg-rose-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      )}

      {/* ─── Equipment Grid ─────────────────────────────────── */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Microscope className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No equipment found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {search || statusFilter !== "all"
              ? "Try different filters."
              : "Add your first equipment to get started."}
          </p>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 text-[11px] md:text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3">
          {filteredEquipment.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 md:p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
            >
              {/* Top row: icon + name + status */}
              <div className="flex items-start gap-2.5 mb-3">
                <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg shrink-0">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.model && (
                    <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                      {item.model}
                    </p>
                  )}
                  {item.serialNumber && (
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      S/N: {item.serialNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Maintenance info */}
              {(item.lastMaintenance || item.nextMaintenance) && (
                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                  {item.lastMaintenance && (
                    <div className="flex items-center justify-between gap-2 text-[10px] md:text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="w-2.5 h-2.5 shrink-0" />
                        Last
                      </span>
                      <span className="font-medium text-slate-700 tabular-nums">
                        {new Date(item.lastMaintenance).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                  {item.nextMaintenance && (
                    <div className="flex items-center justify-between gap-2 text-[10px] md:text-[11px]">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                        Next
                      </span>
                      <span className="font-bold text-slate-800 tabular-nums">
                        {new Date(item.nextMaintenance).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed mt-2 line-clamp-2 pt-2 border-t border-slate-100">
                  {item.notes}
                </p>
              )}

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setEditingItem(item)}
                  className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(item.id)}
                  className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {(showAddModal || editingItem) && (
          <EquipmentModal
            equipment={editingItem}
            onClose={() => {
              setShowAddModal(false);
              setEditingItem(null);
            }}
            onSave={async (data: EquipmentFormData) => {
              if (editingItem) {
                await handleUpdate(editingItem.id, data);
              } else {
                await handleAdd(data);
              }
            }}
          />
        )}
      </AnimatePresence>

      {showDeleteConfirm && (
        <DeleteConfirm
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Equipment Modal (bottom sheet on mobile) ────────────────────

function EquipmentModal({
  equipment,
  onClose,
  onSave,
}: {
  equipment: Equipment | null;
  onClose: () => void;
  onSave: (data: EquipmentFormData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<EquipmentFormData>({
    name: equipment?.name || "",
    model: equipment?.model || "",
    serialNumber: equipment?.serialNumber || "",
    purchaseDate: equipment?.purchaseDate || "",
    lastMaintenance: equipment?.lastMaintenance || "",
    nextMaintenance: equipment?.nextMaintenance || "",
    status: equipment?.status || "operational",
    notes: equipment?.notes || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

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
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h2
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {equipment ? "Edit Equipment" : "Add Equipment"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5"
        >
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Microscope X2000"
            />
          </div>

          {/* Model + Serial */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Model
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Serial Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 font-mono placeholder:text-slate-400 outline-none transition-all"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
          </div>

          {/* Purchase + Status */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition-all tabular-nums"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition-all truncate"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as Equipment["status"],
                  })
                }
              >
                <option value="operational">Operational</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
          </div>

          {/* Maintenance dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Last Maint.
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition-all tabular-nums"
                value={formData.lastMaintenance}
                onChange={(e) =>
                  setFormData({ ...formData, lastMaintenance: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Next Maint.
              </label>
              <input
                type="date"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition-all tabular-nums"
                value={formData.nextMaintenance}
                onChange={(e) =>
                  setFormData({ ...formData, nextMaintenance: e.target.value })
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional details…"
            />
          </div>
        </form>

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
            type="submit"
            form="equipment-form"
            onClick={handleSubmit as any}
            disabled={loading}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {equipment ? "Update" : "Add"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function EquipmentSkeleton() {
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
        <div className="mt-3 flex gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3.5 border border-slate-200 h-40"
          />
        ))}
      </div>
    </div>
  );
}
