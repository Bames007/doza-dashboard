"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  CheckSquare,
  Square,
  X,
  Calendar,
  FlaskConical,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import type { LabTest } from "../types/lab";
import { generateLabReport } from "../utils/pdfGenerator";

export default function ResultsPanel() {
  const { center, user } = useDashboard();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("all");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  useEffect(() => {
    if (center?.id) fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.id]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/centers/${center?.id}/lab-tests`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) {
        setTests(data.data.filter((t: LabTest) => t.status === "completed"));
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTests.size === filteredTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map((t) => t.id)));
    }
  };

  const handlePrintSelected = () => {
    const testsToPrint = tests.filter((t) => selectedTests.has(t.id));
    if (testsToPrint.length === 0) return;

    const doc = generateLabReport({
      tests: testsToPrint,
      centerName: center?.centerName || "Lab Center",
      centerAddress: center?.location?.address,
      centerPhone: center?.ownerInfo?.phone,
      centerEmail: center?.ownerInfo?.email,
      technicianName: user?.fullName,
    });
    doc.save(`Lab_Reports_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrintSingle = (test: LabTest) => {
    const doc = generateLabReport({
      tests: [test],
      centerName: center?.centerName || "Lab Center",
      centerAddress: center?.location?.address,
      centerPhone: center?.ownerInfo?.phone,
      centerEmail: center?.ownerInfo?.email,
      technicianName: user?.fullName,
    });
    doc.save(`Lab_Report_${test.patientName}_${test.testType}.pdf`);
  };

  const testTypes = Array.from(new Set(tests.map((t) => t.testType)));

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      t.testType.toLowerCase().includes(search.toLowerCase());
    const matchesTestType =
      testTypeFilter === "all" ? true : t.testType === testTypeFilter;
    const testDate = new Date(t.collectionDate);
    const matchesFrom = dateFrom ? testDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? testDate <= new Date(dateTo) : true;
    return matchesSearch && matchesTestType && matchesFrom && matchesTo;
  });

  const hasDateFilters = dateFrom || dateTo;
  const hasAnyFilter = search || testTypeFilter !== "all" || hasDateFilters;

  // ─── Loading ────────────────────────────────────────────────────────

  if (loading) {
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
        <div className="flex gap-2.5 mb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-32 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
            />
          ))}
        </div>
        <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Main ───────────────────────────────────────────────────────────

  const filterChips = [
    { value: "all", label: "All Types", count: tests.length },
    ...testTypes.map((type) => ({
      value: type,
      label: type,
      count: tests.filter((t) => t.testType === type).length,
    })),
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
              Lab Results
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {tests.length}
            </span>
          </div>
          {selectedTests.size > 0 && (
            <button
              onClick={handlePrintSelected}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm shrink-0"
            >
              <Printer className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Print</span>
              <span className="text-emerald-100">({selectedTests.size})</span>
            </button>
          )}
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Lab Results
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          View completed test results
        </p>

        {/* Stat pills */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex md:grid md:grid-cols-3 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          <StatPill
            label="Total Results"
            value={tests.length}
            tone="slate"
            icon={FileText}
          />
          <StatPill
            label="Showing"
            value={filteredTests.length}
            tone="emerald"
            icon={CheckCircle}
          />
          <StatPill
            label="Selected"
            value={selectedTests.size}
            tone={selectedTests.size > 0 ? "emerald" : "slate"}
            icon={CheckSquare}
          />
        </div>
      </header>

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
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      )}

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient or test…"
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
        <button
          onClick={() => setShowDateFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 md:px-3 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wide border transition-all shrink-0",
            showDateFilters || hasDateFilters
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
          )}
          aria-label="Date filters"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Dates</span>
          {hasDateFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
          )}
        </button>
      </div>

      {/* ─── Date filter panel ──────────────────────────────── */}
      <AnimatePresence>
        {showDateFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 tabular-nums outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 tabular-nums outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              {hasDateFilters && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="mt-2.5 w-full py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                >
                  Clear Dates
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Test type chips ────────────────────────────────── */}
      {testTypes.length > 0 && (
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {filterChips.map((chip) => {
            const isActive = testTypeFilter === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => setTestTypeFilter(chip.value)}
                className={cn(
                  "shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
                )}
              >
                {chip.label}
                <span
                  className={cn(
                    "ml-1.5 text-[9px] md:text-[10px] font-semibold tabular-nums",
                    isActive ? "text-emerald-100" : "text-slate-400",
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Results ────────────────────────────────────────── */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No results found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {hasAnyFilter
              ? "Try adjusting your filters."
              : "Completed tests will appear here."}
          </p>
          {hasAnyFilter && (
            <button
              onClick={() => {
                setSearch("");
                setTestTypeFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="mt-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Select-all row */}
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-[11px] md:text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 transition-colors"
            >
              {selectedTests.size === filteredTests.length &&
              filteredTests.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {selectedTests.size === filteredTests.length &&
                filteredTests.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
            <span className="text-[10px] md:text-[11px] text-slate-500 tabular-nums">
              {selectedTests.size}/{filteredTests.length}
            </span>
          </div>

          {filteredTests.map((test) => {
            const isExpanded = expandedId === test.id;
            const isSelected = selectedTests.has(test.id);

            return (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-2xl border transition-colors overflow-hidden",
                  isSelected
                    ? "border-emerald-300"
                    : isExpanded
                      ? "border-emerald-200"
                      : "border-slate-200",
                )}
              >
                {/* Summary row */}
                <div className="p-3 md:p-4">
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(test.id);
                      }}
                      className="shrink-0 mt-0.5 p-0.5 -m-0.5 hover:bg-slate-50 rounded transition-colors"
                      aria-label={isSelected ? "Deselect" : "Select"}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Main content — clickable to expand */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : test.id)}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg shrink-0">
                          <FlaskConical className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                              {test.patientName}
                            </h3>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] md:text-[11px] text-slate-500">
                            <span className="truncate">{test.testType}</span>
                            <span className="text-slate-300">·</span>
                            <span className="flex items-center gap-1 tabular-nums">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(test.collectionDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Print single */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintSingle(test);
                      }}
                      className="shrink-0 p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Print report"
                      aria-label="Print report"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence initial={false}>
                  {isExpanded && test.result && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="grid grid-cols-2 gap-2.5 p-3 md:p-4 bg-slate-50/60">
                        <div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                            Value
                          </p>
                          <p className="text-xs md:text-sm font-bold text-slate-900 tabular-nums truncate">
                            {test.result.value}
                            {test.result.unit && (
                              <span className="text-[10px] text-slate-500 font-medium ml-1">
                                {test.result.unit}
                              </span>
                            )}
                          </p>
                        </div>
                        {test.result.referenceRange && (
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                              Ref. Range
                            </p>
                            <p className="text-xs md:text-sm font-bold text-slate-900 tabular-nums truncate">
                              {test.result.referenceRange}
                            </p>
                          </div>
                        )}
                        {test.result.notes && (
                          <div className="col-span-2 pt-2 border-t border-slate-200">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                              Notes
                            </p>
                            <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed">
                              {test.result.notes}
                            </p>
                          </div>
                        )}
                        <div className="col-span-2 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-[10px] md:text-[11px] text-slate-500">
                          <span className="truncate">
                            <span className="font-bold uppercase tracking-wide">
                              Concluded:
                            </span>{" "}
                            {user?.fullName || "Unknown"}
                          </span>
                          {test.result.concludedAt && (
                            <span className="tabular-nums shrink-0">
                              {new Date(test.result.concludedAt).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
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
        "shrink-0 w-32 sm:w-36 md:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
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
