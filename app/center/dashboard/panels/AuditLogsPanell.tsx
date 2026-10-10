// app/center/dashboard/panels/AuditLogsPanel.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  User,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  Users,
  Package,
  FileText,
  CreditCard,
  Settings,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";

// ─── Types ────────────────────────────────────────────────────────────

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: "success" | "failure";
}

interface AuditLogsResponse {
  success: boolean;
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

const ActionIcon = ({ action }: { action: string }) => {
  const iconMap: Record<string, any> = {
    create: Plus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    login: User,
    logout: User,
    export: Download,
    import: Upload,
  };
  const Icon = iconMap[action] || MoreVertical;
  return <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />;
};

const ResourceIcon = ({ resource }: { resource: string }) => {
  const iconMap: Record<string, any> = {
    patient: Users,
    user: User,
    appointment: Calendar,
    inventory: Package,
    prescription: FileText,
    billing: CreditCard,
    settings: Settings,
  };
  const Icon = iconMap[resource] || FileText;
  return <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />;
};

const StatusBadge = ({ status }: { status?: string }) => {
  const normalized = status?.toLowerCase() || "unknown";
  const isSuccess = normalized === "success";
  const isFailure = normalized === "failure";
  const Icon = isSuccess ? CheckCircle : isFailure ? XCircle : AlertCircle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border",
        isSuccess && "bg-emerald-50 text-emerald-700 border-emerald-200",
        isFailure && "bg-rose-50 text-rose-700 border-rose-200",
        !isSuccess &&
          !isFailure &&
          "bg-slate-100 text-slate-600 border-slate-200",
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
    </span>
  );
};

const formatTimestamp = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTimestampFull = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// ─── Main Component ──────────────────────────────────────────────────

export default function AuditLogsPanel() {
  const { center, user } = useDashboard();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterResource, setFilterResource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchLogs = async () => {
    if (!center?.id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(search && { search }),
        ...(filterAction !== "all" && { action: filterAction }),
        ...(filterResource !== "all" && { resource: filterResource }),
        ...(filterStatus !== "all" && { status: filterStatus }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(
        `/api/centers/${center.id}/audit-logs?${params}`,
        { headers: { "x-user-id": user?.id || "" } },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AuditLogsResponse = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        throw new Error(data.error || "Failed to load audit logs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    center?.id,
    user?.id,
    page,
    search,
    filterAction,
    filterResource,
    filterStatus,
    dateFrom,
    dateTo,
  ]);

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/audit-logs/export`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err) {
      alert("Failed to export logs");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterAction("all");
    setFilterResource("all");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const activeFilterCount =
    (filterAction !== "all" ? 1 : 0) +
    (filterResource !== "all" ? 1 : 0) +
    (filterStatus !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  // ─── Loading skeleton ─────────────────────────────────────────
  if (loading && logs.length === 0) {
    return (
      <div
        className={cn(
          "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
          poppins.className,
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-7 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
          <div className="mt-4 h-10 bg-white rounded-xl border border-slate-200" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 h-24"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────
  if (error && logs.length === 0) {
    return (
      <div className={cn("pb-24 pt-6 px-4 text-center", poppins.className)}>
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3
          className={cn(
            "text-base md:text-lg font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load audit logs
        </h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + count + refresh/export */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Audit Trail
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {total}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchLogs}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[10px] md:text-xs font-bold uppercase tracking-wide shadow-sm"
            >
              <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Audit Logs
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Track all system activities and user actions
        </p>
      </header>

      {/* ─── Search + Filter toggle ─────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search user, action, resource…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
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
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wide border transition-all shrink-0",
            showFilters || activeFilterCount > 0
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span
              className={cn(
                "text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center",
                showFilters || activeFilterCount > 0
                  ? "bg-white/25 text-white"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ─── Filter panel (collapsible) ─────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 space-y-2.5">
              {/* Row 1: three selects */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Action
                  </label>
                  <select
                    value={filterAction}
                    onChange={(e) => {
                      setFilterAction(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] md:text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all truncate"
                  >
                    <option value="all">All</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="view">View</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="export">Export</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Resource
                  </label>
                  <select
                    value={filterResource}
                    onChange={(e) => {
                      setFilterResource(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] md:text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all truncate"
                  >
                    <option value="all">All</option>
                    <option value="patient">Patient</option>
                    <option value="user">User</option>
                    <option value="appointment">Appointment</option>
                    <option value="inventory">Inventory</option>
                    <option value="prescription">Prescription</option>
                    <option value="billing">Billing</option>
                    <option value="settings">Settings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] md:text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all truncate"
                  >
                    <option value="all">All</option>
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                  </select>
                </div>
              </div>

              {/* Row 2: date range + clear */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] md:text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] md:text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end">
                  <button
                    onClick={resetFilters}
                    disabled={activeFilterCount === 0 && !search}
                    className="w-full px-3 py-2 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Logs list ──────────────────────────────────────── */}
      {logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No audit logs found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {activeFilterCount > 0 || search
              ? "Try adjusting your filters."
              : "Activity will appear here as users interact with the system."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-white rounded-xl border border-slate-200 p-3 hover:border-emerald-200 transition-colors"
              >
                {/* Top row: user + status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0">
                      {log.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {log.userName}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {log.userRole}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={log.status} />
                </div>

                {/* Action + resource pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[9px] font-bold uppercase tracking-wide">
                    <ActionIcon action={log.action} />
                    {log.action}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-semibold">
                    <ResourceIcon resource={log.resource} />
                    {log.resource}
                    {log.resourceId && (
                      <span className="text-emerald-600/60">
                        #{log.resourceId.slice(-4)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Details */}
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 mb-2">
                  {log.details}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                  <Clock className="w-3 h-3" />
                  <span className="tabular-nums">
                    {formatTimestampFull(log.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-emerald-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="tabular-nums">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 text-[10px] font-bold shrink-0">
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 text-[11px] truncate">
                              {log.userName}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate">
                              {log.userRole}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wide">
                          <ActionIcon action={log.action} />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-slate-600 text-[11px]">
                          <ResourceIcon resource={log.resource} />
                          <span className="capitalize">{log.resource}</span>
                          {log.resourceId && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              #{log.resourceId.slice(-6)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-slate-600 text-[11px] max-w-xs truncate"
                        title={log.details}
                      >
                        {log.details}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Pagination ──────────────────────────────────── */}
          {total > limit && (
            <div className="mt-3 md:mt-4 flex items-center justify-between gap-2 px-1">
              <span className="text-[10px] md:text-[11px] text-slate-500 tabular-nums">
                <span className="hidden sm:inline">Showing </span>
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of{" "}
                {total}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wide border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span className="hidden sm:inline">Prev</span>
                </button>
                <div className="flex items-center px-3 py-1.5 text-[10px] md:text-[11px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg tabular-nums">
                  {page} / {Math.ceil(total / limit)}
                </div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wide border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
