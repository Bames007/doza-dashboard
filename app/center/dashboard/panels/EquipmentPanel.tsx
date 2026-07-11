// app/center/dashboard/panels/EquipmentPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Wrench,
  CheckCircle,
  XCircle,
  X,
  Loader2,
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "operational":
        return {
          label: "Operational",
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "maintenance":
        return {
          label: "Maintenance",
          bg: "bg-amber-100",
          text: "text-amber-800",
          border: "border-amber-200",
          icon: Wrench,
        };
      case "out_of_service":
        return {
          label: "Out of Service",
          bg: "bg-rose-100",
          text: "text-rose-800",
          border: "border-rose-200",
          icon: XCircle,
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100",
          text: "text-slate-800",
          border: "border-slate-200",
          icon: AlertCircle,
        };
    }
  };

  if (loading) return <EquipmentSkeleton />;

  return (
    <div className={cn("space-y-6", poppins.className)}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-1 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Equipment Management
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {equipment.length} items
            </span>
          </div>
          <h1
            className={cn(
              "text-2xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Equipment
          </h1>
          <p className="text-sm text-slate-600">
            Manage laboratory instruments and devices
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search equipment..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-700 transition-all outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="out_of_service">Out of Service</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Equipment List */}
      {filteredEquipment.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <Microscope className="w-16 h-16 mx-auto text-slate-300" />
          <h3
            className={cn(
              "mt-4 text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            No equipment found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {search || statusFilter !== "all"
              ? "Try different filters"
              : "Add your first equipment"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Microscope className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.name}</h3>
                      {item.model && (
                        <p className="text-xs text-slate-500">{item.model}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border",
                        statusConfig.bg,
                        statusConfig.text,
                        statusConfig.border,
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {editingItem?.id === item.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200/80 z-10 py-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(item.id);
                              setEditingItem(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-700">
                  {item.serialNumber && (
                    <p className="text-xs text-slate-500">
                      S/N: {item.serialNumber}
                    </p>
                  )}
                  {item.lastMaintenance && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Last maint:{" "}
                        {new Date(item.lastMaintenance).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {item.nextMaintenance && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Next maint:{" "}
                        {new Date(item.nextMaintenance).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
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

// ─── Equipment Modal ────────────────────────────────────────────────

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {equipment ? "Edit Equipment" : "Add Equipment"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="equip-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Name *
            </label>
            <input
              id="equip-name"
              type="text"
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="equip-model"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Model
              </label>
              <input
                id="equip-model"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="equip-sn"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Serial Number
              </label>
              <input
                id="equip-sn"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="equip-purchase"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Purchase Date
              </label>
              <input
                id="equip-purchase"
                type="date"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.purchaseDate}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseDate: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="equip-status"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Status
              </label>
              <select
                id="equip-status"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="equip-last-maint"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Last Maintenance
              </label>
              <input
                id="equip-last-maint"
                type="date"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.lastMaintenance}
                onChange={(e) =>
                  setFormData({ ...formData, lastMaintenance: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="equip-next-maint"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Next Maintenance
              </label>
              <input
                id="equip-next-maint"
                type="date"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.nextMaintenance}
                onChange={(e) =>
                  setFormData({ ...formData, nextMaintenance: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="equip-notes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="equip-notes"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {equipment
                ? loading
                  ? "Updating..."
                  : "Update Equipment"
                : loading
                  ? "Adding..."
                  : "Add Equipment"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function EquipmentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-5 w-48 bg-slate-100 rounded mt-1" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-11 bg-slate-200 rounded-xl" />
          <div className="w-40 h-11 bg-slate-200 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200/80"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div>
                  <div className="h-5 w-24 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-100 rounded mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-20 bg-slate-200 rounded-full" />
                <div className="h-8 w-8 bg-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
