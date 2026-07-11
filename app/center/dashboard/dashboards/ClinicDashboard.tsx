// app/center/dashboard/dashboards/ClinicDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import { Calendar, Users, Activity, FileText } from "lucide-react";

import { useVitals } from "./hooks/useVitals";
import { usePrescriptions } from "./hooks/usePrescriptions";
import { usePatientCheckIns } from "./hooks/usePatientCheckIns";
import { useAppointments } from "./hooks/useAppointments";
import TodayAppointments from "./components/TodaysAppointments";
import RecentVitals from "./components/RecentVitals";
import PendingPrescriptions from "./components/PendingPrescriptions";

export default function ClinicDashboard() {
  const { center } = useDashboard();

  const {
    appointments,
    loading: aptLoading,
    error: aptError,
  } = useAppointments({
    date: new Date().toISOString().split("T")[0], // today
  });
  const {
    checkIns,
    loading: checkLoading,
    error: checkError,
  } = usePatientCheckIns(center?.id);
  const {
    vitals,
    loading: vitalsLoading,
    error: vitalsError,
  } = useVitals(center?.id);
  const {
    prescriptions,
    loading: rxLoading,
    error: rxError,
  } = usePrescriptions(center?.id);

  // Compute stats from appointments array
  const total = appointments.length;
  const checkedIn =
    appointments.filter((a) => a.status === "checked-in").length || 0;
  const noShow = appointments.filter((a) => a.status === "no-show").length || 0;
  const avgFittingTime = 30; // placeholder – replace with actual data if available

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Today's Appointments"
          value={total}
          change={`${checkedIn} checked in`}
          icon={Calendar}
          color="blue"
          subtext={`${noShow} no-show`}
          loading={aptLoading}
          trend={total > avgFittingTime ? "up" : "neutral"}
          index={0}
        />
        <StatsCard
          label="Patients Checked In"
          value={checkIns.current}
          change={`${checkIns.waiting} waiting`}
          icon={Users}
          color="green"
          subtext={`Avg wait ${checkIns.avgWaitTime} min`}
          loading={checkLoading}
          trend={checkIns.waiting < 5 ? "up" : "down"}
          index={1}
        />
        <StatsCard
          label="Vitals Recorded"
          value={vitals.today}
          change={`${vitals.change || 0}%`}
          icon={Activity}
          color="purple"
          subtext="Today"
          loading={vitalsLoading}
          trend={vitals.today > 0 ? "up" : "down"}
          index={2}
        />
        <StatsCard
          label="Pending Prescriptions"
          value={prescriptions.pending}
          change={`${prescriptions.urgent} urgent`}
          icon={FileText}
          color={prescriptions.pending > 10 ? "amber" : "green"}
          subtext="Awaiting pickup"
          loading={rxLoading}
          trend={prescriptions.pending > 15 ? "down" : "neutral"}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ✅ Now passing appointments directly – matches the component's prop type */}
        <TodayAppointments appointments={appointments} loading={aptLoading} />
        <RecentVitals vitals={vitals.recent} loading={vitalsLoading} />
      </div>
      <PendingPrescriptions
        prescriptions={prescriptions.list}
        loading={rxLoading}
      />
    </div>
  );
}
