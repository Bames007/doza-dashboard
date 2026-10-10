// app/center/dashboard/panels/QualityControlPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  Calendar,
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

// ─── Result styling ─────────────────────────────────────────────────

const getResultStyle = (result: string) => {
  const map: Record<string, { bg: string; icon: any; label: string }> = {
    pass: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Pass",
    },
    fail: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      label: "Fail",
    },
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: AlertCircle,
      label: "Pending",
    },
  };
  return (
    map[result] || {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertCircle,
      label: result,
    }
  );
};

const ResultBadge = ({ result }: { result: string }) => {
  const style = getResultStyle(result);
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

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const stats = {
    total: records.length,
    pass: records.filter((r) => r.result === "pass").length,
    fail: records.filter((r) => r.result === "fail").length,
    pending: records.filter((r) => r.result === "pending").length,
  };

  if (loading) return <QualityControlSkeleton />;

  const statusTabs = [
    { value: "all", label: "All", count: stats.total },
    { value: "pass", label: "Pass", count: stats.pass },
    { value: "fail", label: "Fail", count: stats.fail },
    { value: "pending", label: "Pending", count: stats.pending },
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
              Quality Control
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {records.length}
            </span>
            {stats.fail > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {stats.fail} failing
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">New QC</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Quality Control
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Track QC runs and ensure lab accuracy
        </p>
      </header>

      {/* ─── Stat pills ─────────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-4 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 mb-3 md:mb-5">
        <StatPill
          label="Total"
          value={stats.total}
          tone="slate"
          icon={ShieldCheck}
        />
        <StatPill
          label="Pass"
          value={stats.pass}
          tone="emerald"
          icon={CheckCircle}
        />
        <StatPill label="Fail" value={stats.fail} tone="rose" icon={XCircle} />
        <StatPill
          label="Pending"
          value={stats.pending}
          tone="amber"
          icon={AlertCircle}
        />
      </div>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by test, control, lot, operator…"
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── Result chips ───────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {statusTabs.map((tab) => {
          const isActive = resultFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setResultFilter(tab.value)}
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

      {/* ─── Records ────────────────────────────────────────── */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No QC records found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {search || resultFilter !== "all"
              ? "Try adjusting your filters."
              : "Record your first QC run to get started."}
          </p>
          {(search || resultFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setResultFilter("all");
              }}
              className="mt-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredRecords.map((record) => {
            const style = getResultStyle(record.result);
            const ResultIcon = style.icon;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 hover:border-emerald-200 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={cn("p-2 rounded-lg border shrink-0", style.bg)}
                  >
                    <ResultIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                        {record.controlName}
                      </h3>
                      <ResultBadge result={record.result} />
                    </div>
                    <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                      {record.testType}
                    </p>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Lot #
                    </p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-800 font-mono truncate mt-0.5">
                      {record.lotNumber}
                    </p>
                  </div>
                  {record.expiryDate && (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        Expiry
                      </p>
                      <p className="text-[11px] md:text-xs font-medium text-slate-800 tabular-nums mt-0.5 truncate">
                        {formatDate(record.expiryDate)}
                      </p>
                    </div>
                  )}
                  {record.value && (
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        Value
                      </p>
                      <p className="text-[11px] md:text-xs font-medium text-slate-800 tabular-nums mt-0.5 truncate">
                        {record.value}
                        {record.unit ? ` ${record.unit}` : ""}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Operator
                    </p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-800 truncate mt-0.5">
                      {record.operator || record.performedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                      Performed
                    </p>
                    <p className="text-[11px] md:text-xs font-medium text-slate-800 tabular-nums mt-0.5 truncate">
                      {formatDate(record.performedAt)}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-2 pt-2 border-t border-slate-100">
                    {record.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 pt-2.5 mt-2.5 border-t border-slate-100">
                  <button
                    onClick={() => setEditingRecord(record)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(record.id)}
                    className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors shrink-0"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Modal ─────────────────────────────────── */}
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

// ─── QC Modal (bottom sheet on mobile) ──────────────────────────────

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
          <h2
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {record ? "Edit QC Record" : "New QC Run"}
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
          {/* Test + Control */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>
                Test Type <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.testType}
                onChange={(e) =>
                  setFormData({ ...formData, testType: e.target.value })
                }
                placeholder="e.g., CBC"
              />
            </div>
            <div>
              <label className={labelClass}>
                Control Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className={inputClass}
                value={formData.controlName}
                onChange={(e) =>
                  setFormData({ ...formData, controlName: e.target.value })
                }
                placeholder="e.g., Normal Control"
              />
            </div>
          </div>

          {/* Lot + Expiry */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>
                Lot Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                className={cn(inputClass, "font-mono")}
                value={formData.lotNumber}
                onChange={(e) =>
                  setFormData({ ...formData, lotNumber: e.target.value })
                }
                placeholder="LOT-001"
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date</label>
              <input
                type="date"
                className={cn(inputClass, "tabular-nums")}
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Instrument + Operator */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Instrument</label>
              <input
                type="text"
                className={inputClass}
                value={formData.instrument}
                onChange={(e) =>
                  setFormData({ ...formData, instrument: e.target.value })
                }
                placeholder="Sysmex XN-1000"
              />
            </div>
            <div>
              <label className={labelClass}>Operator</label>
              <input
                type="text"
                className={inputClass}
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
                placeholder="Full name"
              />
            </div>
          </div>

          {/* Performed At + Result */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>
                Performed At <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                className={cn(inputClass, "tabular-nums")}
                value={formData.performedAt}
                onChange={(e) =>
                  setFormData({ ...formData, performedAt: e.target.value })
                }
              />
            </div>
            <div>
              <label className={labelClass}>
                Result <span className="text-rose-500">*</span>
              </label>
              <select
                required
                className={cn(inputClass, "truncate")}
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

          {/* Value + Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={labelClass}>Value</label>
              <input
                type="text"
                className={cn(inputClass, "tabular-nums")}
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder="e.g., 7.2"
              />
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <input
                type="text"
                className={inputClass}
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="e.g., g/dL"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={2}
              className={cn(inputClass, "resize-none")}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional observations…"
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
            form="qc-form"
            onClick={handleSubmit as any}
            disabled={loading}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {record ? "Update" : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function QualityControlSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-40 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-56 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2.5 mb-3 md:mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 w-32 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
          />
        ))}
      </div>
      <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-36"
          />
        ))}
      </div>
    </div>
  );
}
