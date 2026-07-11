// app/center/dashboard/panels/AuditLogsPanel.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
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
  timestamp: string; // ISO date
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

// ─── Helper Components ──────────────────────────────────────────────

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
  return <Icon className="w-4 h-4" />;
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
  return <Icon className="w-4 h-4" />;
};

const StatusBadge = ({ status }: { status?: string }) => {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    success: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      icon: CheckCircle,
    },
    failure: { bg: "bg-rose-100", text: "text-rose-700", icon: XCircle },
  };
  // Normalize status: if undefined, null, or empty -> "unknown"
  const normalizedStatus = status?.toLowerCase() || "unknown";
  const {
    bg,
    text,
    icon: Icon,
  } = config[normalizedStatus] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: AlertCircle,
  };
  const displayLabel =
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        bg,
        text,
      )}
    >
      <Icon className="w-3 h-3" />
      {displayLabel}
    </span>
  );
};

const formatTimestamp = (iso: string) => {
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
  const limit = 20;

  // Fetch audit logs
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
        {
          headers: { "x-user-id": user?.id || "" },
        },
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
    // Download CSV
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

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-5 w-64 bg-slate-100 rounded animate-pulse mt-1" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-48 bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-200 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-20 bg-slate-200 rounded-full" />
                  <div className="h-6 w-16 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-64 text-center",
          poppins.className,
        )}
      >
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3
          className={cn(
            "text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          Failed to load audit logs
        </h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchLogs}
          className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Track all system activities and user actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="User, action, resource..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Actions</option>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Resource
            </label>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Resources</option>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
          <button
            onClick={resetFilters}
            className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-[10px] font-bold">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {log.userName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {log.userRole}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                        <ActionIcon action={log.action} />
                        {log.action.charAt(0).toUpperCase() +
                          log.action.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <ResourceIcon resource={log.resource} />
                        {log.resource.charAt(0).toUpperCase() +
                          log.resource.slice(1)}
                        {log.resourceId && (
                          <span className="text-xs text-slate-400">
                            #{log.resourceId.slice(-6)}
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-slate-600 max-w-xs truncate"
                      title={log.details}
                    >
                      {log.details}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-slate-200/80 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)}{" "}
              of {total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Temporary Upload icon (if not imported)
const Upload = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);
