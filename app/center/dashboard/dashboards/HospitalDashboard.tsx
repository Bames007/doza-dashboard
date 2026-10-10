// app/center/dashboard/dashboards/HospitalDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import {
  RefreshCw,
  AlertTriangle,
  Calendar,
  Activity,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

import { useSurgeries } from "./hooks/useSurgeries";
import { useAppointments } from "./hooks/useAppointments";
import { useEmergencyStats } from "./hooks/useEmergencyStat";
import { useBedOccupancy } from "./hooks/useBedOccupancy";

import BedOccupancyChart from "./components/BedOccupancyChart";
import AmbulanceETA from "./components/AmbulanceETA";

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) throw new Error();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};

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

  // ✅ Real ambulance data — falls back to empty array if the hook doesn't provide it
  const ambulanceArrivals = emergency?.arrivals ?? [];

  const totalAppointments = appointments?.length || 0;
  const completedAppointments =
    appointments?.filter((a: any) => a.status === "completed").length || 0;
  const canceledAppointments =
    appointments?.filter((a: any) => a.status === "cancelled").length || 0;

  const isLoading = bedLoading || erLoading || aptLoading || surgeryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-[4px] border-emerald-200 border-t-emerald-600 mx-auto mb-3" />
          <p
            className={cn(
              "text-slate-600 font-medium text-xs md:text-sm",
              poppins.className,
            )}
          >
            Loading hospital data…
          </p>
        </div>
      </div>
    );
  }

  if (bedError || erError || aptError || surgeryError) {
    return (
      <div className="p-5 text-center" role="alert">
        <AlertCircle className="w-9 h-9 text-rose-500 mx-auto mb-2" />
        <p className="font-semibold text-rose-700 text-sm">
          Failed to load hospital data
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {bedError || erError || aptError || surgeryError}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn("pb-24", poppins.className)}>
      {/* Compact action row */}
      <div className="flex items-center justify-between mb-3 md:mb-5">
        <p className="text-[11px] md:text-xs font-bold text-emerald-600 uppercase tracking-[0.15em]">
          Hospital Overview
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-all"
          aria-label="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
            Refresh
          </span>
        </button>
      </div>

      {/* Main asymmetric grid: hero left, stacked stats right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
        {/* Left: hero bed occupancy */}
        <div className="lg:col-span-2">
          <BedOccupancyChart data={occupancy} />
        </div>

        {/* Right: three compact stat cards */}
        <div className="space-y-2.5 md:space-y-3">
          <CompactStat
            label="ER Waiting Patients"
            value={emergency?.patientsWaiting ?? 0}
            trend="+3.1%"
            icon={Users}
            iconTone="emerald"
          />
          <CompactStat
            label="Average ER Wait"
            value={emergency?.avgWaitTime ?? 0}
            suffix="m"
            trend="-2.4pt"
            icon={Clock}
            iconTone="emerald"
          />
          <CompactStat
            label="Surgeries Today"
            value={surgeries?.today ?? 0}
            footnote={`${surgeries?.completed ?? 0} done`}
            icon={Activity}
            iconTone="slate"
          />
        </div>
      </div>

      {/* Two widget lists side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
        <EmergencyWaitList
          patients={emergency?.patients || []}
          loading={erLoading}
        />
        <TodayAppointments
          appointments={appointments || []}
          loading={aptLoading}
        />
      </div>

      {/* Full-width ambulance strip */}
      <AmbulanceETA arrivals={ambulanceArrivals} loading={erLoading} />
    </div>
  );
}

// ─── Compact stat card ──────────────────────────────────────
function CompactStat({
  label,
  value,
  suffix = "",
  trend,
  footnote,
  icon: Icon,
  iconTone = "emerald",
}: {
  label: string;
  value: number | string;
  suffix?: string;
  trend?: string;
  footnote?: string;
  icon: any;
  iconTone?: "emerald" | "slate";
}) {
  return (
    <div className="bg-white rounded-2xl p-3.5 md:p-4 border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon
            className={cn(
              "w-3 h-3 shrink-0",
              iconTone === "emerald" ? "text-emerald-600" : "text-slate-500",
            )}
          />
          <p className="text-[11px] md:text-xs font-medium text-slate-500 truncate">
            {label}
          </p>
        </div>
        <h3
          className={cn(
            "text-2xl md:text-3xl font-bold text-slate-900 tabular-nums leading-none",
            bebasNeue.className,
          )}
        >
          {value}
          {suffix && (
            <span className="text-base text-slate-400 ml-0.5">{suffix}</span>
          )}
        </h3>
      </div>

      {trend && (
        <span className="text-[10px] md:text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 text-emerald-700 bg-emerald-50 border-emerald-200">
          {trend}
        </span>
      )}
      {footnote && !trend && (
        <span className="text-[10px] md:text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full shrink-0">
          {footnote}
        </span>
      )}
    </div>
  );
}

// ─── Emergency waitlist ────────────────────────────────────
function EmergencyWaitList({ patients, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasPatients = patients && patients.length > 0;

  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 md:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-rose-50 rounded-lg shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-600" />
          </div>
          <h3
            className={cn(
              "text-sm md:text-base font-bold text-slate-800 truncate",
              bebasNeue.className,
            )}
          >
            Emergency Waitlist
          </h3>
        </div>
        <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
          {patients?.length || 0}
        </span>
      </div>

      <div className="space-y-1.5">
        {hasPatients ? (
          patients.slice(0, 5).map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-100"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 font-bold text-[10px] md:text-xs shrink-0">
                  {p.name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-[11px] md:text-xs truncate">
                    {p.name || "Unknown"}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-slate-500 truncate">
                    {p.chiefComplaint ? `${p.chiefComplaint} · ` : ""}
                    Acuity: {p.acuity || "N/A"}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] md:text-xs font-bold text-rose-600">
                  {p.waitTime || 0}m
                </span>
                <p className="text-[8px] text-slate-400 uppercase leading-none mt-0.5">
                  wait
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-[11px] text-center py-5">
            No patients in ER
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Today's appointments ─────────────────────────────────
function TodayAppointments({ appointments, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const hasAppointments = appointments && appointments.length > 0;

  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 md:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-emerald-50 rounded-lg shrink-0">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
          </div>
          <h3
            className={cn(
              "text-sm md:text-base font-bold text-slate-800 truncate",
              bebasNeue.className,
            )}
          >
            Today's Appointments
          </h3>
        </div>
        <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
          {appointments?.length || 0}
        </span>
      </div>

      <div className="space-y-1.5">
        {hasAppointments ? (
          appointments.slice(0, 5).map((apt: any) => (
            <div
              key={apt.id}
              className="flex items-center justify-between gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-100"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 font-bold text-[10px] md:text-xs shrink-0">
                  {apt.patientName?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 text-[11px] md:text-xs truncate">
                    {apt.patientName || "Unknown"}
                  </p>
                  <p className="text-[9px] md:text-[10px] text-slate-500 flex items-center gap-0.5 truncate">
                    <Clock className="w-2.5 h-2.5 shrink-0" />
                    {apt.startTime ? formatTime(apt.startTime) : "No time"}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[9px] md:text-[10px] font-semibold rounded-full shrink-0 capitalize border",
                  apt.status === "completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : apt.status === "scheduled"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : apt.status === "cancelled"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200",
                )}
              >
                {apt.status || "scheduled"}
              </span>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-[11px] text-center py-5">
            No appointments today
          </p>
        )}
      </div>
    </div>
  );
}
