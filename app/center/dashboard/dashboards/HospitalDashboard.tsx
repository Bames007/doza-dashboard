// app/center/dashboard/dashboards/HospitalDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { motion } from "framer-motion";
import {
  Bed,
  AlertTriangle,
  Calendar,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

import { useSurgeries } from "./hooks/useSurgeries";
import { useAppointments } from "./hooks/useAppointments";
import { useEmergencyStats } from "./hooks/useEmergencyStat";
import { useBedOccupancy } from "./hooks/useBedOccupancy";

// ─── Helpers ──────────────────────────────────────────────────────
const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) throw new Error();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 500;
    const step = Math.ceil(value / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{displayValue}</>;
};

// ─── StatCard (Micro‑interactions, Animated) ────────────────────
function StatCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  subtext,
  loading,
  trend,
  index,
}: any) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500/10 to-blue-600/5 text-blue-700",
    purple: "from-purple-500/10 to-purple-600/5 text-purple-700",
    green: "from-emerald-500/10 to-emerald-600/5 text-emerald-700",
    amber: "from-amber-500/10 to-amber-600/5 text-amber-700",
    red: "from-rose-500/10 to-rose-600/5 text-rose-700",
    orange: "from-orange-500/10 to-orange-600/5 text-orange-700",
    emerald: "from-emerald-500/10 to-emerald-600/5 text-emerald-700",
  };

  const iconBgMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-rose-100 text-rose-600",
    orange: "bg-orange-100 text-orange-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl" />
          <div className="w-16 h-6 bg-slate-200 rounded-full" />
        </div>
        <div className="h-8 w-24 bg-slate-200 rounded mb-1" />
        <div className="h-4 w-20 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: (index || 0) * 0.06,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={cn(
            "p-3 rounded-2xl shadow-sm",
            iconBgMap[color] || "bg-slate-100 text-slate-600",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5">
          {trend === "up" && (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          )}
          {trend === "down" && (
            <TrendingDown className="w-4 h-4 text-rose-500" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              trend === "up"
                ? "text-emerald-600"
                : trend === "down"
                  ? "text-rose-600"
                  : "text-slate-500",
            )}
          >
            {change}
          </span>
        </div>
      </div>
      <h3
        className={cn(
          "text-3xl md:text-4xl font-black text-slate-800 mb-1 tracking-tight",
          bebasNeue.className,
        )}
      >
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </h3>
      <p
        className={cn("text-sm text-slate-600 font-medium", poppins.className)}
      >
        {label}
      </p>
      {subtext && (
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function HospitalDashboard() {
  const { center, user } = useDashboard();
  const today = new Date().toISOString().split("T")[0];

  const {
    occupancy,
    loading: bedLoading,
    error: bedError,
  } = useBedOccupancy(center?.id, user?.id);
  const {
    emergency,
    loading: erLoading,
    error: erError,
  } = useEmergencyStats(center?.id, user?.id);
  const {
    appointments,
    loading: aptLoading,
    error: aptError,
  } = useAppointments({ date: today });
  const {
    surgeries,
    loading: surgeryLoading,
    error: surgeryError,
  } = useSurgeries(center?.id, user?.id);

  const totalAppointments = appointments?.length || 0;
  const completedAppointments =
    appointments?.filter((a: any) => a.status === "completed").length || 0;
  const canceledAppointments =
    appointments?.filter((a: any) => a.status === "cancelled").length || 0;

  const occupancyRate = occupancy?.total
    ? Math.round((occupancy.occupied / occupancy.total) * 100)
    : 0;

  const isLoading = bedLoading || erLoading || aptLoading || surgeryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-32 w-32 border-[6px] border-emerald-200 border-t-emerald-600" />
          </div>
          <p
            className={cn(
              "text-slate-700 font-medium text-lg",
              poppins.className,
            )}
          >
            Loading Hospital Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (bedError || erError || aptError || surgeryError) {
    return (
      <div className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="font-semibold text-rose-700">
          Failed to load hospital data
        </p>
        <p className="text-sm text-slate-600">
          {bedError || erError || aptError || surgeryError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8 pb-20", poppins.className)}>
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-600 to-teal-700" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-[0.25em]">
              Hospital Dashboard
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {center?.centerName || "Hospital"}
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl text-slate-900 leading-tight tracking-tight",
              bebasNeue.className,
            )}
          >
            Hospital Operations
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Real-time overview of hospital performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* ─── Stats Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Bed Occupancy"
          value={`${occupancy?.occupied || 0}/${occupancy?.total || 0}`}
          change={`${occupancyRate}%`}
          icon={Bed}
          color="blue"
          subtext={`${(occupancy?.total || 0) - (occupancy?.occupied || 0)} available`}
          loading={bedLoading}
          trend={
            occupancyRate > 85 ? "down" : occupancyRate > 70 ? "neutral" : "up"
          }
          index={0}
        />
        <StatCard
          label="ER Wait Time"
          value={`${emergency?.avgWaitTime || 0} min`}
          change={`${emergency?.patientsWaiting || 0} waiting`}
          icon={AlertTriangle}
          color="red"
          subtext="Average today"
          loading={erLoading}
          trend={emergency?.avgWaitTime > 30 ? "down" : "neutral"}
          index={1}
        />
        <StatCard
          label="Today's Appointments"
          value={totalAppointments}
          change={`${completedAppointments} completed`}
          icon={Calendar}
          color="purple"
          subtext={`${canceledAppointments} canceled`}
          loading={aptLoading}
          trend={
            completedAppointments > totalAppointments * 0.7 ? "up" : "neutral"
          }
          index={2}
        />
        <StatCard
          label="Scheduled Surgeries"
          value={surgeries?.today || 0}
          change={`${surgeries?.completed || 0} done`}
          icon={Activity}
          color="emerald"
          subtext={`${surgeries?.upcoming || 0} upcoming`}
          loading={surgeryLoading}
          trend={
            surgeries?.completed > (surgeries?.today || 0) * 0.5
              ? "up"
              : "neutral"
          }
          index={3}
        />
      </div>

      {/* ─── Detailed Widgets ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EmergencyWaitList
          patients={emergency?.patients || []}
          loading={erLoading}
        />
        <TodayAppointments
          appointments={appointments || []}
          loading={aptLoading}
        />
      </div>

      <BedOccupancyChart data={occupancy} />
    </div>
  );
}

// ─── Enhanced Sub‑widgets ──────────────────────────────────────

function EmergencyWaitList({ patients, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-100 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <h3
            className={cn(
              "text-xl font-black text-slate-800",
              bebasNeue.className,
            )}
          >
            Emergency Waitlist
          </h3>
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
          {patients?.length || 0} patients
        </span>
      </div>
      <div className="space-y-2">
        {patients?.slice(0, 5).map((p: any) => (
          <motion.div
            key={p.id}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold text-sm">
                {p.name?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {p.name || "Unknown"}
                </p>
                <p className="text-xs text-slate-500">
                  {p.chiefComplaint ? `${p.chiefComplaint} · ` : ""}
                  Acuity: {p.acuity || "N/A"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-rose-700">
                {p.waitTime || 0} min
              </span>
              <p className="text-[10px] text-slate-400">waiting</p>
            </div>
          </motion.div>
        ))}
        {(!patients || patients.length === 0) && (
          <p className="text-slate-500 text-sm text-center py-8">
            No patients in ER
          </p>
        )}
      </div>
    </div>
  );
}

function TodayAppointments({ appointments, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <h3
            className={cn(
              "text-xl font-black text-slate-800",
              bebasNeue.className,
            )}
          >
            Today's Appointments
          </h3>
        </div>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
          {appointments?.length || 0} total
        </span>
      </div>
      <div className="space-y-2">
        {appointments?.slice(0, 5).map((apt: any) => (
          <motion.div
            key={apt.id}
            whileHover={{ scale: 1.01 }}
            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">
                {apt.patientName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {apt.patientName || "Unknown"}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {apt.startTime ? formatTime(apt.startTime) : "No time"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-full",
                apt.status === "completed"
                  ? "bg-emerald-100 text-emerald-700"
                  : apt.status === "scheduled"
                    ? "bg-blue-100 text-blue-700"
                    : apt.status === "cancelled"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700",
              )}
            >
              {apt.status || "scheduled"}
            </span>
          </motion.div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="text-slate-500 text-sm text-center py-8">
            No appointments today
          </p>
        )}
      </div>
    </div>
  );
}

function BedOccupancyChart({ data }: any) {
  if (!data || !data.total) return null;
  const occupied = data.occupied || 0;
  const total = data.total || 1;
  const rate = Math.round((occupied / total) * 100);
  const color =
    rate > 85
      ? "from-rose-500 to-rose-600"
      : rate > 70
        ? "from-amber-500 to-amber-600"
        : "from-emerald-500 to-emerald-600";

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-blue-100 rounded-xl">
          <Bed className="w-5 h-5 text-blue-600" />
        </div>
        <h3
          className={cn(
            "text-xl font-black text-slate-800",
            bebasNeue.className,
          )}
        >
          Bed Occupancy
        </h3>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-36 h-36">
          <svg
            viewBox="0 0 36 36"
            className="w-full h-full transform -rotate-90"
          >
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-slate-200"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${rate}, 100`}
              className={`${rate > 85 ? "text-rose-500" : rate > 70 ? "text-amber-500" : "text-emerald-500"}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "text-3xl font-black",
                bebasNeue.className,
                rate > 85
                  ? "text-rose-700"
                  : rate > 70
                    ? "text-amber-700"
                    : "text-emerald-700",
              )}
            >
              {rate}%
            </span>
            <span className="text-xs text-slate-500">occupancy</span>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Occupied beds</span>
            </div>
            <span className="font-bold text-slate-800">{occupied}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-sm text-slate-600">Available beds</span>
            </div>
            <span className="font-bold text-slate-800">{total - occupied}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-sm text-slate-600">Total capacity</span>
            </div>
            <span className="font-bold text-slate-800">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
