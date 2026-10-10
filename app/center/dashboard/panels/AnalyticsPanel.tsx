// app/center/dashboard/panels/AnalyticsPanel.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Activity,
  Package,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { useAnalytics } from "../dashboards/hooks/useAnalytics";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: any;
  color: "emerald" | "slate" | "rose" | "amber";
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" };
}

// ─── Stat Card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: StatCardProps) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border border-slate-200",
    rose: "bg-rose-50 text-rose-600 border border-rose-100",
    amber: "bg-amber-50 text-amber-600 border border-amber-100",
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div
          className={cn(
            "p-1.5 md:p-2 rounded-lg",
            colorMap[color] || colorMap.emerald,
          )}
        >
          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-[10px] md:text-xs font-bold tabular-nums",
              trend.direction === "up" ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <h3
        className={cn(
          "text-xl md:text-2xl font-bold text-slate-900 tabular-nums leading-none",
          bebasNeue.className,
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </h3>
      <p className="text-[11px] md:text-xs font-medium text-slate-600 mt-1 truncate">
        {label}
      </p>
      {subtitle && (
        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-16 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-56 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-64 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3 md:mb-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3.5 border border-slate-200 h-24"
          />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3 md:mb-5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-3.5 border border-slate-200 h-24"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-slate-200 h-64"
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const { center, user } = useDashboard();
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const { data, loading, error, refetch } = useAnalytics(
    center?.id,
    user?.id,
    dateRange.start,
    dateRange.end,
  );
  const [billingStats, setBillingStats] = useState({
    totalRevenue: 0,
    pending: 0,
    overdue: 0,
    totalBills: 0,
    paidCount: 0,
    hmoCount: 0,
  });
  const [dischargedCount, setDischargedCount] = useState(0);

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!center?.id || !user?.id) return;
      try {
        const res = await fetch(`/api/centers/${center.id}/bills`, {
          headers: { "x-user-id": user.id },
        });
        const result = await res.json();
        if (result.success) {
          const bills = result.data || [];
          const totalRevenue = bills
            .filter((b: any) => b.status === "paid" || b.status === "hmo")
            .reduce((sum: number, b: any) => sum + (b.total || 0), 0);
          const pending = bills
            .filter(
              (b: any) => b.status === "pending" || b.status === "approved",
            )
            .reduce((sum: number, b: any) => sum + (b.total || 0), 0);
          const overdue = bills
            .filter((b: any) => b.status === "overdue")
            .reduce((sum: number, b: any) => sum + (b.total || 0), 0);

          setBillingStats({
            totalRevenue,
            pending,
            overdue,
            totalBills: bills.length,
            paidCount: bills.filter((b: any) => b.status === "paid").length,
            hmoCount: bills.filter((b: any) => b.status === "hmo").length,
          });
        }
      } catch (err) {
        console.error("Failed to fetch billing data:", err);
      }
    };

    const fetchPatients = async () => {
      if (!center?.id || !user?.id) return;
      try {
        const res = await fetch(`/api/centers/${center.id}/patients`, {
          headers: { "x-user-id": user.id },
        });
        const result = await res.json();
        if (result.success) {
          const patients = result.data || [];
          const discharged = patients.filter(
            (p: any) => p.status === "discharged",
          ).length;
          setDischargedCount(discharged);
        }
      } catch (err) {
        console.error("Failed to fetch patients:", err);
      }
    };

    fetchBillingData();
    fetchPatients();
  }, [center?.id, user?.id]);

  if (loading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <div className="pb-24 pt-6 px-4 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="font-bold text-rose-700 text-sm">
          Failed to load analytics
        </p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pb-24 pt-6 px-4 text-center">
        <p className="text-xs text-slate-500">No data available</p>
      </div>
    );
  }

  const { patients, appointments, sales, inventory, staff, recentActivity } =
    data;

  const CHART_COLORS = {
    emerald: "#059669",
    slate: "#475569",
    slateLight: "#94a3b8",
    slateLighter: "#cbd5e1",
  };

  const PIE_COLORS = [
    CHART_COLORS.emerald,
    CHART_COLORS.slate,
    CHART_COLORS.slateLight,
    CHART_COLORS.slateLighter,
  ];

  const billingCards: StatCardProps[] = [
    {
      label: "Total Revenue",
      value: `₦${billingStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "emerald",
      subtitle: `${billingStats.paidCount} paid bills`,
    },
    {
      label: "Pending Amount",
      value: `₦${billingStats.pending.toLocaleString()}`,
      icon: Clock,
      color: "slate",
      subtitle: `${billingStats.totalBills - billingStats.paidCount - billingStats.hmoCount} pending`,
    },
    {
      label: "Overdue",
      value: `₦${billingStats.overdue.toLocaleString()}`,
      icon: AlertCircle,
      color: "rose",
      subtitle: "Needs attention",
    },
    {
      label: "Discharged",
      value: dischargedCount,
      icon: CheckCircle,
      color: "emerald",
      subtitle: `${patients.total || 0} total patients`,
    },
  ];

  const operationCards: StatCardProps[] = [
    {
      label: "Total Patients",
      value: patients.total,
      icon: Users,
      color: "emerald",
      subtitle: `${patients.newThisMonth} new this month`,
    },
    {
      label: "Appointments",
      value: appointments.total,
      icon: Calendar,
      color: "slate",
      subtitle: `${appointments.upcoming} upcoming · ${appointments.completedToday} today`,
    },
    {
      label: "Active Staff",
      value: staff.active,
      icon: Activity,
      color: "emerald",
      subtitle: `${staff.total} total staff`,
    },
    {
      label: "Inventory",
      value: inventory.totalItems,
      icon: Package,
      color: "slate",
      subtitle: `${inventory.lowStock} low stock`,
    },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + actions */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Performance Analytics
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 truncate max-w-[120px]">
              {center?.centerName || "Center"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={refetch}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[10px] md:text-xs font-bold uppercase tracking-wide shadow-sm"
              aria-label="Export"
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
          Analytics Dashboard
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Real-time overview of your center's performance
        </p>

        {/* Row 3: date range picker (compact) */}
        <div className="mt-3 md:mt-4 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          <div className="flex items-center gap-2 shrink-0 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
              className="text-[11px] md:text-xs text-slate-700 bg-transparent outline-none border-none w-[110px] md:w-[120px]"
            />
            <span className="text-slate-400 text-[11px]">→</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
              className="text-[11px] md:text-xs text-slate-700 bg-transparent outline-none border-none w-[110px] md:w-[120px]"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: "", end: "" })}
              className="shrink-0 px-2.5 py-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-white border border-slate-200 rounded-lg hover:border-emerald-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* ─── Billing & Financial Stats ───────────────────────── */}
      <section className="mb-3 md:mb-5">
        <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
          Revenue & Billing
        </p>
        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-4 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          {billingCards.map((card, i) => (
            <div key={i} className="shrink-0 w-[68%] sm:w-[45%] md:w-auto">
              <StatCard {...card} />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Operational Stats ───────────────────────────────── */}
      <section className="mb-3 md:mb-5">
        <p className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
          Operations
        </p>
        <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-4 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          {operationCards.map((card, i) => (
            <div key={i} className="shrink-0 w-[68%] sm:w-[45%] md:w-auto">
              <StatCard {...card} />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 md:gap-3 mb-3 md:mb-5">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={cn(
                "text-sm md:text-base font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Revenue Trend
            </h3>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              Monthly
            </span>
          </div>
          {sales.monthlyRevenue.length === 0 ? (
            <div className="h-48 md:h-56 flex items-center justify-center text-slate-400 text-[11px] md:text-xs">
              No revenue data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={sales.monthlyRevenue}
                margin={{ top: 5, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value) => [
                    `₦${Number(value).toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.emerald}
                  strokeWidth={2.5}
                  dot={{
                    fill: CHART_COLORS.emerald,
                    r: 3,
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "white" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appointment Status */}
        <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={cn(
                "text-sm md:text-base font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Appointment Status
            </h3>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Total {appointments.total}
            </span>
          </div>
          {appointments.byStatus.every((s: any) => s.count === 0) ? (
            <div className="h-48 md:h-56 flex items-center justify-center text-slate-400 text-[11px] md:text-xs">
              No appointment data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={appointments.byStatus.filter((s: any) => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) =>
                    `${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}
                >
                  {appointments.byStatus
                    .filter((s: any) => s.count > 0)
                    .map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                    padding: "8px 12px",
                  }}
                  formatter={(value) => [`${value} appointments`, ""]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#475569" }}
                  iconSize={8}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Recent Activity ────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3
            className={cn(
              "text-sm md:text-base font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Recent Activity
          </h3>
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full tabular-nums">
            {recentActivity.length}
          </span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-[11px] md:text-xs text-slate-500">
              No recent activity
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {recentActivity.map((activity: any) => (
              <li
                key={activity.id}
                className="flex items-start gap-2.5 p-2.5 md:p-3 bg-slate-50/60 rounded-xl border border-slate-100 hover:border-emerald-100 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] md:text-xs font-medium text-slate-800 truncate">
                    <span className="font-bold">{activity.userName}</span>{" "}
                    {activity.action}{" "}
                    <span className="text-slate-500">{activity.resource}</span>
                  </p>
                  <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 tabular-nums">
                    {new Date(activity.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[9px] md:text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0",
                    activity.status === "success"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : activity.status === "failure"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-600 border-slate-200",
                  )}
                >
                  {activity.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
