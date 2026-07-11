// app/center/dashboard/dashboards/DentalDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import { motion } from "framer-motion";
import {
  Calendar,
  Syringe,
  Droplet,
  Smile,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

import { useDentalInventory } from "./hooks/useDentalInventory";
import { useTreatments } from "./hooks/useTreatments";
import { useAppointments } from "./hooks/useAppointments";
import { useSterilization } from "./hooks/useSterilization";

// ─── Subcomponents ──────────────────────────────────────────────────
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
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    orange: "bg-orange-100 text-orange-700",
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-slate-200 rounded-xl" />
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
      transition={{ delay: (index || 0) * 0.06 }}
      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn("p-2.5 rounded-xl", colorMap[color] || "bg-slate-100")}
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
              "text-xs font-medium",
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
          "text-2xl md:text-3xl font-bold text-slate-800",
          bebasNeue.className,
        )}
      >
        {value}
      </h3>
      <p className={cn("text-sm text-slate-600", poppins.className)}>{label}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function DentalDashboard() {
  const { center, user } = useDashboard();
  const today = new Date().toISOString().split("T")[0];

  const {
    appointments,
    loading: aptLoading,
    error: aptError,
  } = useAppointments({
    date: today,
    serviceType: "dental",
  });
  const {
    treatments,
    loading: txLoading,
    error: txError,
  } = useTreatments(center?.id, user?.id);
  const {
    sterilization,
    loading: sterLoading,
    error: sterError,
  } = useSterilization(center?.id, user?.id);
  const {
    inventory,
    loading: invLoading,
    error: invError,
  } = useDentalInventory(center?.id, user?.id);

  // Compute stats
  const totalAppointments = appointments?.length || 0;
  const confirmedAppointments =
    appointments?.filter((a: any) => a.status === "confirmed").length || 0;
  const checkedInAppointments =
    appointments?.filter((a: any) => a.status === "checked-in").length || 0;
  const noShowAppointments =
    appointments?.filter((a: any) => a.status === "no-show").length || 0;

  const activeTreatments = treatments?.active || 0;
  const completedToday = treatments?.completedToday || 0;
  const avgDaily = treatments?.avgDaily || 0;

  const sterReady = sterilization?.ready || 0;
  const sterTotal = sterilization?.total || 0;
  const sterInProgress = sterilization?.inProgress || 0;

  const lowStock = inventory?.lowStock || 0;
  const critical = inventory?.critical || 0;

  const isLoading = aptLoading || txLoading || sterLoading || invLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-32 w-32 border-[6px] border-emerald-200 border-t-emerald-600"></div>
          </div>
          <p
            className={cn(
              "text-slate-700 font-medium text-lg",
              poppins.className,
            )}
          >
            Loading Dental Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (aptError || txError || sterError || invError) {
    return (
      <div className="p-8 text-center" role="alert">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="font-semibold text-rose-700">
          Failed to load dental data
        </p>
        <p className="text-sm text-slate-600">
          {aptError || txError || sterError || invError}
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
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-blue-600" />
            <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-[0.25em]">
              Dental Dashboard
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {center?.centerName || "Dental Clinic"}
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl text-slate-900 leading-tight",
              bebasNeue.className,
            )}
          >
            Dental Practice
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Real-time overview of your dental practice
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
            Today: {new Date().toLocaleDateString()}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* ─── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Today's Appointments"
          value={totalAppointments}
          change={`${confirmedAppointments} confirmed`}
          icon={Calendar}
          color="blue"
          subtext={`${checkedInAppointments} checked in · ${noShowAppointments} no-show`}
          loading={aptLoading}
          trend={totalAppointments > noShowAppointments ? "up" : "neutral"}
          index={0}
        />
        <StatCard
          label="Active Treatments"
          value={activeTreatments}
          change={`${completedToday} completed today`}
          icon={Smile}
          color="purple"
          subtext={`Avg ${avgDaily} daily`}
          loading={txLoading}
          trend={completedToday > avgDaily ? "up" : "down"}
          index={1}
        />
        <StatCard
          label="Sterilization"
          value={`${sterReady}/${sterTotal}`}
          change={`${sterInProgress} in progress`}
          icon={Syringe}
          color={sterReady === sterTotal ? "green" : "amber"}
          subtext={`${sterTotal - sterReady} not ready`}
          loading={sterLoading}
          trend={sterReady < sterTotal * 0.5 ? "down" : "up"}
          index={2}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock}
          change={`${critical} critical`}
          icon={Droplet}
          color={critical > 0 ? "red" : "orange"}
          subtext="Need reorder"
          loading={invLoading}
          trend={lowStock > 5 ? "down" : "neutral"}
          index={3}
        />
      </div>

      {/* ─── Detailed Widgets ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DentalAppointments appointments={appointments} loading={aptLoading} />
        <SterilizationStatus
          items={sterilization?.items || []}
          loading={sterLoading}
        />
      </div>

      <DentalInventoryAlert items={inventory?.criticalItems || []} />
    </div>
  );
}

// ─── Sub‑widgets (placeholder – implement with actual UI) ──────────
function DentalAppointments({ appointments, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
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
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <h3
        className={cn(
          "text-lg font-bold text-slate-800 mb-4",
          bebasNeue.className,
        )}
      >
        Today's Appointments
      </h3>
      <div className="space-y-3">
        {appointments?.slice(0, 5).map((apt: any) => (
          <div
            key={apt.id}
            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/60"
          >
            <div>
              <p className="font-medium text-slate-900">
                {apt.patientName || "Unknown"}
              </p>
              <p className="text-sm text-slate-500">
                {apt.startTime || "No time"}
              </p>
            </div>
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                apt.status === "confirmed"
                  ? "bg-emerald-100 text-emerald-700"
                  : apt.status === "checked-in"
                    ? "bg-blue-100 text-blue-700"
                    : apt.status === "no-show"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-700",
              )}
            >
              {apt.status || "scheduled"}
            </span>
          </div>
        ))}
        {(!appointments || appointments.length === 0) && (
          <p className="text-slate-500 text-sm text-center py-4">
            No appointments today
          </p>
        )}
      </div>
    </div>
  );
}

function SterilizationStatus({ items, loading }: any) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
      <h3
        className={cn(
          "text-lg font-bold text-slate-800 mb-4",
          bebasNeue.className,
        )}
      >
        Sterilization Status
      </h3>
      <div className="space-y-3">
        {items?.slice(0, 5).map((item: any) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/60"
          >
            <div>
              <p className="font-medium text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">
                Last cycle: {item.lastCycle || "N/A"}
              </p>
            </div>
            <span
              className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                item.status === "ready"
                  ? "bg-emerald-100 text-emerald-700"
                  : item.status === "in-progress"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-rose-100 text-rose-700",
              )}
            >
              {item.status || "needs-cleaning"}
            </span>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <p className="text-slate-500 text-sm text-center py-4">
            No sterilization items
          </p>
        )}
      </div>
    </div>
  );
}

function DentalInventoryAlert({ items }: any) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
      <h3
        className={cn(
          "text-lg font-bold text-slate-800 mb-3",
          bebasNeue.className,
        )}
      >
        ⚠️ Critical Inventory Alert
      </h3>
      <div className="flex flex-wrap gap-3">
        {items.slice(0, 6).map((item: any) => (
          <div
            key={item.id}
            className="bg-white rounded-xl px-4 py-2 border border-amber-200 shadow-sm flex items-center gap-2"
          >
            <span className="font-medium text-slate-900">{item.name}</span>
            <span className="text-sm text-amber-700 font-medium">
              {item.quantity} left
            </span>
            <span className="text-xs text-slate-500">
              (Reorder at {item.reorderLevel})
            </span>
          </div>
        ))}
        {items.length > 6 && (
          <span className="text-sm text-slate-500">
            +{items.length - 6} more
          </span>
        )}
      </div>
    </div>
  );
}
