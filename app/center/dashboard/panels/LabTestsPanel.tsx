// app/center/dashboard/panels/LabTestsPanel.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Microscope,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  X,
  Calendar,
  User,
  Stethoscope,
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { usePatientTests } from "../dashboards/hooks/usePatients";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../dashboards/hooks/useAuditLog";

// ─── Role Normalization ──────────────────────────────────────────────

const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (
    r.includes("medical officer") ||
    r.includes("doctor") ||
    r.includes("physician")
  )
    return "doctor";
  if (r.includes("nurse")) return "nurse";
  if (r.includes("lab technician") || r.includes("lab tech"))
    return "lab_technician";
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (
    r.includes("admin") ||
    r.includes("manager") ||
    r.includes("owner") ||
    r.includes("director")
  )
    return "admin";
  if (r.includes("support") || r.includes("reception")) return "support";
  return "support";
};

// ─── Main Panel ──────────────────────────────────────────────────────

export default function LabTestsPanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const isLabTech = normalizedRole === "lab_technician";
  const isDoctor = normalizedRole === "doctor";
  const isAdmin = normalizedRole === "admin" || normalizedRole === "owner";
  const canManageTests = isLabTech || isDoctor || isAdmin;

  // ─── Hooks ────────────────────────────────────────────────────────
  const {
    tests,
    loading,
    error,
    refetch: refetchTests,
    updateTest,
  } = usePatientTests(center?.id, user?.id);

  // ─── State ────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResultForm, setTestResultForm] = useState({
    value: "",
    unit: "",
    referenceRange: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Computed ────────────────────────────────────────────────────
  const filteredTests = useMemo(() => {
    let filtered = tests;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.patientName.toLowerCase().includes(term) ||
          t.testType.toLowerCase().includes(term) ||
          t.orderedByName?.toLowerCase().includes(term) ||
          t.id.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    return filtered;
  }, [tests, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = tests.length;
    const pending = tests.filter((t) => t.status === "pending").length;
    const processing = tests.filter((t) => t.status === "processing").length;
    const completed = tests.filter((t) => t.status === "completed").length;
    return { total, pending, processing, completed };
  }, [tests]);

  const selectedTest = tests.find((t) => t.id === selectedTestId) || null;

  // ─── Handlers ────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    refetchTests();
  }, [refetchTests]);

  const handleAcceptTest = async (testId: string) => {
    try {
      await updateTest(testId, {
        status: "processing",
        acceptedBy: user?.fullName || "Lab Technician",
        acceptedAt: new Date().toISOString(),
        acceptedById: user?.id,
      });
      await refetchTests();
      logAction("update", "lab-test", testId, "Accepted lab test");
    } catch (err) {
      alert("Failed to accept test");
    }
  };

  const handleCompleteTest = async (testId: string) => {
    setIsSubmitting(true);
    try {
      await updateTest(testId, {
        status: "completed",
        completedBy: user?.fullName || "Unknown",
        completedAt: new Date().toISOString(),
        result: {
          value: testResultForm.value,
          unit: testResultForm.unit,
          referenceRange: testResultForm.referenceRange,
          notes: testResultForm.notes,
          concludedBy: user?.fullName || "Unknown",
          concludedByName: user?.fullName || "Unknown",
          concludedAt: new Date().toISOString(),
        },
      });
      await refetchTests();
      setTestResultForm({ value: "", unit: "", referenceRange: "", notes: "" });
      setIsModalOpen(false);
      setSelectedTestId(null);
      logAction("update", "lab-test", testId, "Completed lab test");
    } catch (err) {
      alert("Failed to complete test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTestDetails = (testId: string) => {
    setSelectedTestId(testId);
    setIsModalOpen(true);
    setTestResultForm({ value: "", unit: "", referenceRange: "", notes: "" });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTestId(null);
  };

  // ─── Status helpers ─────────────────────────────────────────────
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: Clock,
        };
      case "processing":
        return {
          label: "Processing",
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-200",
          icon: Loader2,
        };
      case "completed":
        return {
          label: "Completed",
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
          icon: CheckCircle,
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
    return <LabTestsSkeleton />;
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
                Laboratory Management
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {tests.length} total
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Lab Tests
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Manage laboratory tests, results, and quality control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-slate-600" />
            </button>
            {canManageTests && (
              <button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold">
                <Plus className="w-4 h-4" />
                Order Test
              </button>
            )}
          </div>
        </header>

        {/* ─── Stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Microscope}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Processing"
            value={stats.processing}
            icon={Loader2}
            color="blue"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* ─── Filters & Search ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, test, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
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
              label="Processing"
              value="processing"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("processing")}
            />
            <FilterButton
              label="Completed"
              value="completed"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("completed")}
            />
          </div>
        </div>

        {/* ─── Test List ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-700">
              {filteredTests.length} tests found
            </span>
            <span className="text-xs text-slate-400">
              {statusFilter !== "all" ? `Filtered by: ${statusFilter}` : "All"}
            </span>
          </div>

          {filteredTests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Microscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold">No lab tests found</p>
              <p className="text-sm mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Tests will appear here once ordered"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTests.map((test) => {
                const statusConfig = getStatusConfig(test.status);
                const Icon = statusConfig.icon;
                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => openTestDetails(test.id)}
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
                            {test.testType}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {test.patientName}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" />
                              {test.orderedByName || "Unknown"}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(
                                test.collectionDate || test.createdAt,
                              )}
                            </span>
                          </div>
                          {test.acceptedBy && (
                            <div className="text-xs text-slate-400 mt-1">
                              Accepted by {test.acceptedBy}
                            </div>
                          )}
                          {test.completedBy && (
                            <div className="text-xs text-slate-400 mt-1">
                              Completed by {test.completedBy}
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

      {/* ─── Test Detail Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selectedTest && (
          <TestDetailModal
            test={selectedTest}
            onClose={closeModal}
            onAccept={handleAcceptTest}
            onComplete={handleCompleteTest}
            testResultForm={testResultForm}
            setTestResultForm={setTestResultForm}
            isSubmitting={isSubmitting}
            canAccept={isLabTech && selectedTest.status === "pending"}
            canComplete={isLabTech && selectedTest.status === "processing"}
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
  color: "emerald" | "amber" | "blue" | "rose";
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
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

// ─── Test Detail Modal ──────────────────────────────────────────────

interface TestDetailModalProps {
  test: any;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onComplete: (id: string) => Promise<void>;
  testResultForm: any;
  setTestResultForm: (form: any) => void;
  isSubmitting: boolean;
  canAccept: boolean;
  canComplete: boolean;
  user: any;
}

function TestDetailModal({
  test,
  onClose,
  onAccept,
  onComplete,
  testResultForm,
  setTestResultForm,
  isSubmitting,
  canAccept,
  canComplete,
  user,
}: TestDetailModalProps) {
  // Use the same helper to avoid duplication
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", bg: "bg-slate-100", text: "text-slate-700" };
      case "processing":
        return {
          label: "Processing",
          bg: "bg-blue-100",
          text: "text-blue-700",
        };
      case "completed":
        return {
          label: "Completed",
          bg: "bg-emerald-100",
          text: "text-emerald-700",
        };
      default:
        return { label: status, bg: "bg-slate-100", text: "text-slate-700" };
    }
  };
  const statusConfig = getStatusConfig(test.status);

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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Test Details
            </h2>
            <p className="text-sm text-slate-500">{test.testType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
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
              <p className="font-semibold text-slate-900">{test.patientName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ordered By
              </label>
              <p className="font-semibold text-slate-900">
                {test.orderedByName || "Unknown"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Collection Date
              </label>
              <p className="font-semibold text-slate-900">
                {formatDate(test.collectionDate || test.createdAt)}
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
          </div>

          {/* Acceptance / Completion Info */}
          {test.acceptedBy && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <span className="text-xs font-medium text-slate-500 block">
                Accepted by
              </span>
              <p className="text-sm font-medium text-slate-800">
                {test.acceptedBy}
              </p>
              {test.acceptedAt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(test.acceptedAt)}
                </p>
              )}
            </div>
          )}
          {test.completedBy && (
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <span className="text-xs font-medium text-emerald-700 block">
                Completed by
              </span>
              <p className="text-sm font-medium text-emerald-800">
                {test.completedBy}
              </p>
              {test.completedAt && (
                <p className="text-xs text-emerald-600 mt-0.5">
                  {formatDate(test.completedAt)}
                </p>
              )}
            </div>
          )}

          {/* Result Display */}
          {test.result && (
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
              <p className="text-[10px] uppercase font-bold text-emerald-800/60 mb-1">
                Results
              </p>
              <div className="text-2xl font-black text-emerald-900">
                {test.result.value}
                <span className="text-sm font-medium ml-1 opacity-60">
                  {test.result.unit}
                </span>
              </div>
              {test.result.referenceRange && (
                <p className="text-xs text-emerald-700 mt-1">
                  Reference: {test.result.referenceRange}
                </p>
              )}
              {test.result.notes && (
                <p className="text-sm text-emerald-800 mt-2 italic">
                  "{test.result.notes}"
                </p>
              )}
              {test.result.concludedByName && (
                <p className="text-xs text-emerald-600 mt-2">
                  Reported by {test.result.concludedByName} on{" "}
                  {formatDate(test.result.concludedAt)}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {canAccept && (
            <button
              onClick={() => onAccept(test.id)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Accept & Start Test
            </button>
          )}

          {canComplete && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h5 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Enter Results
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="result-value"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Value <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="result-value"
                    type="text"
                    placeholder="e.g. 120"
                    value={testResultForm.value}
                    onChange={(e) =>
                      setTestResultForm({
                        ...testResultForm,
                        value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="result-unit"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Unit
                  </label>
                  <input
                    id="result-unit"
                    type="text"
                    placeholder="e.g. mg/dL"
                    value={testResultForm.unit}
                    onChange={(e) =>
                      setTestResultForm({
                        ...testResultForm,
                        unit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="result-ref"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Reference Range
                </label>
                <input
                  id="result-ref"
                  type="text"
                  placeholder="e.g. 70–100"
                  value={testResultForm.referenceRange}
                  onChange={(e) =>
                    setTestResultForm({
                      ...testResultForm,
                      referenceRange: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="result-notes"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="result-notes"
                  placeholder="Any additional observations"
                  value={testResultForm.notes}
                  onChange={(e) =>
                    setTestResultForm({
                      ...testResultForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  rows={2}
                />
              </div>
              <button
                onClick={() => onComplete(test.id)}
                disabled={isSubmitting || !testResultForm.value}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                Complete & Submit Result
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

function LabTestsSkeleton() {
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
            <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
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
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-16 h-8 bg-slate-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Test List Skeleton */}
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
