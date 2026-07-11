// app/center/dashboard/panels/QualityControlPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  Calendar,
  User,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import DeleteConfirm from "../components/DeleteConfirm";

// ─── Types ────────────────────────────────────────────────────────────

interface QC {
  id: string;
  testType: string;
  controlName: string;
  lotNumber: string;
  expiryDate?: string;
  instrument?: string;
  operator?: string;
  performedAt: string;
  performedBy: string;
  result: "pass" | "fail" | "pending";
  value?: string;
  unit?: string;
  notes?: string;
  createdAt: string;
}

interface QCFormData {
  testType: string;
  controlName: string;
  lotNumber: string;
  expiryDate: string;
  instrument: string;
  operator: string;
  performedAt: string;
  performedBy: string;
  result: QC["result"];
  value: string;
  unit: string;
  notes: string;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function QualityControlPanel() {
  const { center, user } = useDashboard();
  const [records, setRecords] = useState<QC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<QC | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (center?.id) fetchQC();
  }, [center?.id]);

  const fetchQC = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/centers/${center?.id}/quality-control`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) setRecords(data.data);
      else setError(data.error);
    } catch {
      setError("Failed to load quality control records");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (item: QCFormData) => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/quality-control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        setRecords((prev) => [...prev, data.data]);
        setShowAddModal(false);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to add QC record");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<QC>) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/quality-control/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify(updates),
        },
      );
      const data = await res.json();
      if (data.success) {
        setRecords((prev) => prev.map((r) => (r.id === id ? data.data : r)));
        setEditingRecord(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to update QC record");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/quality-control/${id}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user?.id || "" },
        },
      );
      const data = await res.json();
      if (data.success) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        setShowDeleteConfirm(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to delete QC record");
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.testType.toLowerCase().includes(search.toLowerCase()) ||
      r.controlName.toLowerCase().includes(search.toLowerCase()) ||
      r.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.operator?.toLowerCase().includes(search.toLowerCase());
    const matchesResult = resultFilter === "all" || r.result === resultFilter;
    return matchesSearch && matchesResult;
  });

  const getResultConfig = (result: string) => {
    switch (result) {
      case "pass":
        return {
          label: "Pass",
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "fail":
        return {
          label: "Fail",
          bg: "bg-rose-100",
          text: "text-rose-800",
          border: "border-rose-200",
          icon: XCircle,
        };
      default:
        return {
          label: "Pending",
          bg: "bg-amber-100",
          text: "text-amber-800",
          border: "border-amber-200",
          icon: AlertCircle,
        };
    }
  };

  if (loading) return <QualityControlSkeleton />;

  return (
    <div className={cn("space-y-6", poppins.className)}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-1 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Quality Control
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {records.length} records
            </span>
          </div>
          <h1
            className={cn(
              "text-2xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Quality Control
          </h1>
          <p className="text-sm text-slate-600">
            Track QC runs and ensure lab accuracy
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New QC Run
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by test, control, lot, operator..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-700 transition-all outline-none"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="pending">Pending</option>
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

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <ShieldCheck className="w-16 h-16 mx-auto text-slate-300" />
          <h3
            className={cn(
              "mt-4 text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            No QC records found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {search || resultFilter !== "all"
              ? "Try different filters"
              : "Record your first QC run"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const resultConfig = getResultConfig(record.result);
            const ResultIcon = resultConfig.icon;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        record.result === "pass"
                          ? "bg-emerald-100"
                          : record.result === "fail"
                            ? "bg-rose-100"
                            : "bg-amber-100",
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "w-5 h-5",
                          record.result === "pass"
                            ? "text-emerald-600"
                            : record.result === "fail"
                              ? "text-rose-600"
                              : "text-amber-600",
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {record.controlName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {record.testType}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border",
                        resultConfig.bg,
                        resultConfig.text,
                        resultConfig.border,
                      )}
                    >
                      <ResultIcon className="w-3 h-3" />
                      {resultConfig.label}
                    </span>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(record.performedAt).toLocaleDateString()}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {editingRecord?.id === record.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200/80 z-10 py-1">
                          <button
                            onClick={() => setEditingRecord(record)}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(record.id);
                              setEditingRecord(null);
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

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-slate-700">
                  <div>
                    <span className="text-xs text-slate-400 block">Lot #</span>
                    <span className="font-medium">{record.lotNumber}</span>
                  </div>
                  {record.expiryDate && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        Expiry
                      </span>
                      <span className="font-medium">
                        {new Date(record.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {record.value && (
                    <div>
                      <span className="text-xs text-slate-400 block">
                        Value
                      </span>
                      <span className="font-medium">
                        {record.value} {record.unit || ""}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Operator
                    </span>
                    <span className="font-medium">
                      {record.operator || record.performedBy}
                    </span>
                  </div>
                </div>
                {record.notes && (
                  <p className="mt-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    {record.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showAddModal || editingRecord) && (
          <QCModal
            record={editingRecord}
            onClose={() => {
              setShowAddModal(false);
              setEditingRecord(null);
            }}
            onSave={async (data: QCFormData) => {
              if (editingRecord) {
                await handleUpdate(editingRecord.id, data);
              } else {
                await handleAdd(data);
              }
            }}
            userId={user?.id || ""}
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

// ─── QC Modal ──────────────────────────────────────────────────────

function QCModal({
  record,
  onClose,
  onSave,
  userId,
}: {
  record: QC | null;
  onClose: () => void;
  onSave: (data: QCFormData) => Promise<void>;
  userId: string;
}) {
  const [formData, setFormData] = useState<QCFormData>({
    testType: record?.testType || "",
    controlName: record?.controlName || "",
    lotNumber: record?.lotNumber || "",
    expiryDate: record?.expiryDate || "",
    instrument: record?.instrument || "",
    operator: record?.operator || "",
    performedAt: record?.performedAt || new Date().toISOString().split("T")[0],
    performedBy: record?.performedBy || userId || "",
    result: record?.result || "pending",
    value: record?.value || "",
    unit: record?.unit || "",
    notes: record?.notes || "",
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
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {record ? "Edit QC Record" : "New QC Run"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="qc-test-type"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Test Type *
              </label>
              <input
                id="qc-test-type"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.testType}
                onChange={(e) =>
                  setFormData({ ...formData, testType: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="qc-control-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Control Name *
              </label>
              <input
                id="qc-control-name"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.controlName}
                onChange={(e) =>
                  setFormData({ ...formData, controlName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="qc-lot"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Lot Number *
              </label>
              <input
                id="qc-lot"
                type="text"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.lotNumber}
                onChange={(e) =>
                  setFormData({ ...formData, lotNumber: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="qc-expiry"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Expiry Date
              </label>
              <input
                id="qc-expiry"
                type="date"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="qc-instrument"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Instrument
              </label>
              <input
                id="qc-instrument"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.instrument}
                onChange={(e) =>
                  setFormData({ ...formData, instrument: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="qc-operator"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Operator
              </label>
              <input
                id="qc-operator"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="qc-performed-at"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Performed At *
              </label>
              <input
                id="qc-performed-at"
                type="date"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.performedAt}
                onChange={(e) =>
                  setFormData({ ...formData, performedAt: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="qc-result"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Result *
              </label>
              <select
                id="qc-result"
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
                value={formData.result}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    result: e.target.value as QC["result"],
                  })
                }
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="qc-value"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Value
              </label>
              <input
                id="qc-value"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
              />
            </div>
            <div>
              <label
                htmlFor="qc-unit"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Unit
              </label>
              <input
                id="qc-unit"
                type="text"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="qc-notes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="qc-notes"
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
              {record
                ? loading
                  ? "Updating..."
                  : "Update Record"
                : loading
                  ? "Adding..."
                  : "Save Record"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function QualityControlSkeleton() {
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

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div>
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-24 bg-slate-100 rounded mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
                <div className="h-5 w-20 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                  <div className="h-4 w-16 bg-slate-100 rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
