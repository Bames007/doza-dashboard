// app/center/dashboard/panels/SamplesPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  TestTube,
  Search,
  Plus,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  FileText,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import DeleteConfirm from "../components/DeleteConfirm";
import type { LabTest } from "../types/lab";

// ─── Types ────────────────────────────────────────────────────────────

interface ResultData {
  value: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
}

interface AddSampleData {
  patientName: string;
  testType: string;
  sampleType?: string;
  collectionDate: string;
}

// ─── Main Component ──────────────────────────────────────────────────

export default function SamplesPanel() {
  const { center, user } = useDashboard();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<LabTest | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (center?.id) fetchTests();
  }, [center?.id]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/centers/${center?.id}/lab-tests`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) setTests(data.data);
      else setError(data.error);
    } catch {
      setError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    testId: string,
    newStatus: string,
    resultData?: ResultData,
  ) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/lab-tests/${testId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            status: newStatus,
            result: resultData
              ? {
                  ...resultData,
                  concludedByName: user?.fullName,
                  concludedAt: new Date().toISOString(),
                }
              : undefined,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setTests((prev) => prev.map((t) => (t.id === testId ? data.data : t)));
        setShowResultModal(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to update test");
    }
  };

  const handleDelete = async (testId: string) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/lab-tests/${testId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user?.id || "" },
        },
      );
      const data = await res.json();
      if (data.success) {
        setTests((prev) => prev.filter((t) => t.id !== testId));
        setShowDeleteConfirm(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to delete test");
    }
  };

  const activeTests = tests.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled",
  );

  const filteredTests = activeTests.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      (t.patientName.toLowerCase().includes(search.toLowerCase()) ||
        t.testType.toLowerCase().includes(search.toLowerCase())),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-800 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) return <SamplesSkeleton />;

  return (
    <div className={cn("space-y-6", poppins.className)}>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-1 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Sample Management
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {activeTests.length} active
            </span>
          </div>
          <h1
            className={cn(
              "text-2xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Test Samples
          </h1>
          <p className="text-sm text-slate-600">
            Manage pending and in‑progress lab tests
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          New Sample
        </button>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient or test..."
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
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="rejected">Rejected</option>
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

      {/* List */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <TestTube className="w-16 h-16 mx-auto text-slate-300" />
          <h3
            className={cn(
              "mt-4 text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            No samples found
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {search || statusFilter !== "all"
              ? "Try different filters"
              : "Create your first test sample from Patients panel"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      test.status === "pending"
                        ? "bg-amber-100"
                        : test.status === "processing"
                          ? "bg-blue-100"
                          : "bg-rose-100",
                    )}
                  >
                    <TestTube
                      className={cn(
                        "w-5 h-5",
                        test.status === "pending"
                          ? "text-amber-600"
                          : test.status === "processing"
                            ? "text-blue-600"
                            : "text-rose-600",
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {test.patientName}
                    </h3>
                    <p className="text-xs text-slate-500">{test.testType}</p>
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(test.collectionDate).toLocaleDateString()}
                  </span>
                </div>
                {test.sampleType && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sample: {test.sampleType}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {test.status === "pending" && (
                  <button
                    onClick={() => handleStatusUpdate(test.id, "processing")}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Start Processing
                  </button>
                )}
                {test.status === "processing" && (
                  <button
                    onClick={() => setShowResultModal(test)}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    Enter Results
                  </button>
                )}
                {test.status === "rejected" && (
                  <span className="text-xs font-medium text-rose-600">
                    Rejected
                  </span>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(test.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                  aria-label="Delete test"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showResultModal && (
          <ResultModal
            test={showResultModal}
            onClose={() => setShowResultModal(null)}
            onSubmit={(resultData: ResultData) =>
              handleStatusUpdate(showResultModal.id, "completed", resultData)
            }
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <AddSampleModal
            onClose={() => setShowAddModal(false)}
            onAdd={async (data: AddSampleData) => {
              const res = await fetch(`/api/centers/${center?.id}/lab-tests`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-user-id": user?.id || "",
                },
                body: JSON.stringify(data),
              });
              const result = await res.json();
              if (result.success) {
                setTests((prev) => [...prev, result.data]);
                setShowAddModal(false);
              } else {
                setError(result.error);
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

// ─── Result Modal ──────────────────────────────────────────────────

function ResultModal({
  test,
  onClose,
  onSubmit,
}: {
  test: LabTest;
  onClose: () => void;
  onSubmit: (data: ResultData) => void;
}) {
  const [result, setResult] = useState<ResultData>({
    value: "",
    unit: "",
    referenceRange: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!result.value.trim()) return;
    setLoading(true);
    onSubmit(result);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Enter Test Results
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-medium">Patient:</span> {test.patientName} –{" "}
            <span className="font-medium">Test:</span> {test.testType}
          </p>

          <div>
            <label
              htmlFor="result-value"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Value *
            </label>
            <input
              id="result-value"
              type="text"
              placeholder="e.g. 120"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={result.value}
              onChange={(e) => setResult({ ...result, value: e.target.value })}
              required
            />
          </div>

          <div>
            <label
              htmlFor="result-unit"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Unit
            </label>
            <input
              id="result-unit"
              type="text"
              placeholder="e.g. mg/dL"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={result.unit}
              onChange={(e) => setResult({ ...result, unit: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="result-range"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Reference Range
            </label>
            <input
              id="result-range"
              type="text"
              placeholder="e.g. 70–100"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={result.referenceRange}
              onChange={(e) =>
                setResult({ ...result, referenceRange: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="result-notes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="result-notes"
              rows={3}
              placeholder="Any additional observations"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all resize-none"
              value={result.notes}
              onChange={(e) => setResult({ ...result, notes: e.target.value })}
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
              disabled={loading || !result.value.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Save Results"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Add Sample Modal ──────────────────────────────────────────────

function AddSampleModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: AddSampleData) => Promise<void>;
}) {
  const [formData, setFormData] = useState<AddSampleData>({
    patientName: "",
    testType: "",
    sampleType: "",
    collectionDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Add Test Sample
          </h3>
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
              htmlFor="patient-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Patient Name *
            </label>
            <input
              id="patient-name"
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={formData.patientName}
              onChange={(e) =>
                setFormData({ ...formData, patientName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="test-type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Test Type *
            </label>
            <input
              id="test-type"
              type="text"
              placeholder="e.g. Malaria, CBC"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={formData.testType}
              onChange={(e) =>
                setFormData({ ...formData, testType: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="sample-type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Sample Type
            </label>
            <input
              id="sample-type"
              type="text"
              placeholder="e.g. Blood, Urine"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              value={formData.sampleType}
              onChange={(e) =>
                setFormData({ ...formData, sampleType: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="collection-date"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Collection Date
            </label>
            <input
              id="collection-date"
              type="date"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all"
              value={formData.collectionDate}
              onChange={(e) =>
                setFormData({ ...formData, collectionDate: e.target.value })
              }
              required
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
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                "Create Sample"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function SamplesSkeleton() {
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
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
              <div className="h-8 w-8 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
