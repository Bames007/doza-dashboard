"use client";

import { useState, useMemo } from "react";
import { useDashboard } from "../DashboardContext";
import {
  Users,
  HeartPulse,
  Ambulance,
  Plus,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

// Use unified patients hook with department filter
import { usePatients, Patient } from "../dashboards/hooks/usePatients";
// Keep stats hooks
import { useEmergencyStats } from "../dashboards/hooks/useEmergencyStat";
import { useEmergencyCensus } from "../dashboards/hooks/useEmergencyCensus";
import { useCriticalPatients } from "../dashboards/hooks/useCriticalPatients";
import { useAmbulanceArrivals } from "../dashboards/hooks/useAmbulanceArrivals";

// Shared components
import PatientList from "../dashboards/components/emergency_components/PatientList";
import CriticalList from "../dashboards/components/CriticalList";
import AmbulanceETA from "../dashboards/components/AmbulanceETA";
import AddPatientModal from "../dashboards/components/emergency_components/AddPatientModal";
import EditPatientModal from "../dashboards/components/emergency_components/EditPatientModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../dashboards/components/emergency_components/tabs";

// ─── Stats Card ──────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, subtitle, trend }: any) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
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

// ─── Skeleton ─────────────────────────────────────────────────────────
function EmergencySkeleton() {
  return (
    <div className="space-y-6 pb-20 px-4 sm:px-0 animate-pulse">
      {/* Header skeleton */}
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
      {/* Stats skeleton */}
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
      {/* Tabs skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 rounded-lg" />
          <div className="h-10 w-24 bg-slate-200 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </div>
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function EmergencyDashboard() {
  const { center, user } = useDashboard();

  // Use unified patients hook with department filter
  const {
    patients,
    loading,
    refetch,
    addPatient,
    updatePatient,
    deletePatient,
  } = usePatients(center?.id, user?.id, "emergency");

  // Stats hooks – we'll use them for aggregated data
  const { critical } = useCriticalPatients(center?.id, user?.id);
  const { arrivals } = useAmbulanceArrivals(center?.id, user?.id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Compute quick stats from the filtered patient list (for stats cards)
  const totalPatients = patients.length;
  const waiting = patients.filter((p) => p.status === "waiting").length;
  const inTreatment = patients.filter(
    (p) => p.status === "in-treatment",
  ).length;
  const avgWait =
    patients
      .filter((p) => p.triageTime && p.arrivalTime)
      .reduce((acc, p) => {
        const wait =
          (new Date(p.triageTime!).getTime() -
            new Date(p.arrivalTime!).getTime()) /
          60000;
        return acc + wait;
      }, 0) /
    (patients.filter((p) => p.triageTime && p.arrivalTime).length || 1);

  if (loading) return <EmergencySkeleton />;

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* ─── Header ──────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-rose-600 to-orange-600" />
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-[0.25em]">
              Emergency Department
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
            Emergency <span className="text-rose-600">Dashboard</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Real-time overview of emergency department activity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            aria-label="Refresh emergency data"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Refresh
          </button>
          {/* Duplicate button removed from header */}
        </div>
      </header>

      {/* ─── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Total Patients"
          value={totalPatients}
          icon={Users}
          color="blue"
          subtitle={`${waiting} waiting · ${inTreatment} in treatment`}
        />
        <StatCard
          label="Avg Wait Time"
          value={`${Math.round(avgWait)} min`}
          icon={Activity}
          color={avgWait > 30 ? "rose" : "emerald"}
          subtitle="From arrival to triage"
        />
        <StatCard
          label="Ambulance ETA"
          value={arrivals.incoming}
          icon={Ambulance}
          color="amber"
          subtitle={`${arrivals.within10} within 10 min`}
        />
        <StatCard
          label="Critical Patients"
          value={critical.count}
          icon={HeartPulse}
          color="rose"
          subtitle={`${critical.icuRequired} need ICU`}
        />
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="census" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-lg">
            <TabsTrigger
              value="census"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
            >
              Census
            </TabsTrigger>
            <TabsTrigger
              value="critical"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
            >
              Critical
            </TabsTrigger>
            <TabsTrigger
              value="ambulance"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
            >
              Ambulance
            </TabsTrigger>
          </TabsList>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-rose-200/50 transition-all focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Patient
          </button>
        </div>

        <TabsContent value="census" className="mt-0">
          <PatientList
            patients={patients}
            loading={loading}
            onEdit={setEditingPatient}
            onDelete={deletePatient}
            onUpdate={updatePatient}
          />
        </TabsContent>
        <TabsContent value="critical" className="mt-0">
          <CriticalList patients={critical.list} loading={loading} />
        </TabsContent>
        <TabsContent value="ambulance" className="mt-0">
          <AmbulanceETA arrivals={arrivals.list} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* ─── Modals ────────────────────────────────────────────────── */}
      <AddPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addPatient}
      />
      <EditPatientModal
        isOpen={!!editingPatient}
        patient={editingPatient}
        onClose={() => setEditingPatient(null)}
        onSave={updatePatient}
      />
    </div>
  );
}
