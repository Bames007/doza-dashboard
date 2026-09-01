// app/center/dashboard/panels/AnalyticsPanel.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Activity,
  Package,
  Bed,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle,
  Clock,
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
  color: "emerald" | "blue" | "purple" | "amber" | "rose" | "teal";
  subtitle?: string;
  trend?: { value: number; direction: "up" | "down" };
}

// ─── Helper Components ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
}: StatCardProps) {
  const colorMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    teal: "bg-teal-100 text-teal-700",
  };
  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            {trend.value}%
          </div>
        )}
      </div>
      <h3
        className={cn(
          "text-2xl md:text-3xl font-bold text-slate-800",
          bebasNeue.className,
        )}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </h3>
      <p className={cn("text-sm text-slate-600", poppins.className)}>{label}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 pb-20 px-4 sm:px-0 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-slate-200" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
          </div>
          <div className="h-9 w-64 bg-slate-200 rounded-lg" />
          <div className="h-5 w-80 bg-slate-100 rounded mt-2" />
        </div>
        <div className="h-10 w-40 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 border border-slate-200/80"
          >
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
            </div>
            <div className="h-8 w-24 bg-slate-200 rounded mb-1" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 border border-slate-200/80"
          >
            <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
            <div className="h-64 bg-slate-100 rounded-xl" />
          </div>
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

  // Fetch billing stats and patient discharge counts
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
            (p: any) => p.status === "discharged" || p.status === "discharged",
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
      <div className="p-8 text-center">
        <p className="font-semibold text-rose-700">Failed to load analytics</p>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">No data available</div>
    );
  }

  const {
    patients,
    appointments,
    sales,
    inventory,
    staff,
    beds,
    recentActivity,
  } = data;

  const CHART_COLORS = {
    teal: "#0d9488",
    blue: "#2563eb",
    amber: "#d97706",
    purple: "#7c3aed",
    rose: "#e11d48",
    emerald: "#059669",
  };

  const PIE_COLORS = [
    CHART_COLORS.teal,
    CHART_COLORS.blue,
    CHART_COLORS.amber,
    CHART_COLORS.purple,
  ];

  // Combine billing stats with existing stats cards
  const billingCards = [
    {
      label: "Total Revenue",
      value: `₦${billingStats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "emerald" as const,
      subtitle: `${billingStats.paidCount} paid bills`,
    },
    {
      label: "Pending Amount",
      value: `₦${billingStats.pending.toLocaleString()}`,
      icon: Clock,
      color: "amber" as const,
      subtitle: `${billingStats.totalBills - billingStats.paidCount - billingStats.hmoCount} pending`,
    },
    {
      label: "Overdue",
      value: `₦${billingStats.overdue.toLocaleString()}`,
      icon: AlertCircle,
      color: "rose" as const,
      subtitle: "Requires attention",
    },
    {
      label: "Discharged Patients",
      value: dischargedCount,
      icon: CheckCircle,
      color: "teal" as const,
      subtitle: `${patients.total || 0} total patients`,
    },
  ];

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-600 to-teal-700" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-[0.25em]">
              Performance Analytics
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {center?.centerName || "Center"}
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
              bebasNeue.className,
            )}
          >
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Real-time overview of your center's performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      {/* ─── Billing & Financial Stats ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {billingCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* ─── Original Stats (Patient, Appointments, Staff, Inventory) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Total Patients"
          value={patients.total}
          icon={Users}
          color="blue"
          subtitle={`${patients.newThisMonth} new this month`}
        />
        <StatCard
          label="Appointments"
          value={appointments.total}
          icon={Calendar}
          color="purple"
          subtitle={`${appointments.upcoming} upcoming · ${appointments.completedToday} today`}
        />
        <StatCard
          label="Active Staff"
          value={staff.active}
          icon={Activity}
          color="amber"
          subtitle={`${staff.total} total staff`}
        />
        <StatCard
          label="Inventory Items"
          value={inventory.totalItems}
          icon={Package}
          color="emerald"
          subtitle={`${inventory.lowStock} low stock · ₦${inventory.totalValue.toLocaleString()} value`}
        />
      </div>

      {/* ─── Charts ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3
            className={cn(
              "text-lg font-bold text-slate-800 mb-4",
              bebasNeue.className,
            )}
          >
            Revenue Trend
          </h3>
          {sales.monthlyRevenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No revenue data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sales.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value) => `₦${Number(value).toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.teal}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.teal, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h3
            className={cn(
              "text-lg font-bold text-slate-800 mb-4",
              bebasNeue.className,
            )}
          >
            Appointment Status
          </h3>
          {appointments.byStatus.every((s: any) => s.count === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No appointment data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={appointments.byStatus.filter((s: any) => s.count > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                  label={({ name, percent }) =>
                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
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
                  }}
                  formatter={(value) => `${value} appointments`}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#1e293b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Recent Activity ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3
          className={cn(
            "text-lg font-bold text-slate-800 mb-4",
            bebasNeue.className,
          )}
        >
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm">No recent activity</p>
        ) : (
          <ul className="space-y-3">
            {recentActivity.map((activity: any) => (
              <li
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:bg-emerald-50/50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {activity.userName} {activity.action} {activity.resource}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
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
