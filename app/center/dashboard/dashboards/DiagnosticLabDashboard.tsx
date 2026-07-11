"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import {
  FlaskConical,
  Clock,
  CheckCircle,
  Thermometer,
  Calendar, // <-- import Calendar
} from "lucide-react";

import { useSampleCollection } from "./hooks/useSampleCollection";
import { useEquipmentStatus } from "./hooks/useEquipmentStatus";
import { useLabTests } from "./hooks/useLabTests";
import { useAppointmentStats } from "./hooks/useAppointmentStats"; // <-- import
import PendingTestsList from "./components/PendingTestsList";
import EquipmentStatus from "./components/EquipmentStatus";

export default function LabDashboard() {
  const { center } = useDashboard();
  const { tests, loading: testsLoading } = useLabTests(center?.id);
  const { equipment, loading: equipLoading } = useEquipmentStatus(center?.id);
  const { samples, loading: samplesLoading } = useSampleCollection(center?.id);
  const { stats: appointmentStats, loading: appointmentsLoading } =
    useAppointmentStats(center?.id); // <-- use

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Pending Tests"
          value={tests.pending}
          change={`${tests.urgent} urgent`}
          icon={Clock}
          color="amber"
          subtext="Awaiting processing"
          loading={testsLoading}
          trend={tests.pending > 20 ? "down" : "neutral"}
          index={0}
        />
        {/* Today's Appointments Card */}
        <StatsCard
          label="Today's Appointments"
          value={appointmentStats.total}
          change={`${appointmentStats.pending} pending`}
          icon={Calendar}
          color="purple"
          subtext="Scheduled"
          loading={appointmentsLoading}
          trend="neutral"
          index={1}
        />
        <StatsCard
          label="Completed Today"
          value={tests.completedToday}
          change={`+${
            tests.completedYesterday > 0
              ? Math.round(
                  ((tests.completedToday - tests.completedYesterday) /
                    tests.completedYesterday) *
                    100,
                )
              : 0
          }%`}
          icon={CheckCircle}
          color="green"
          subtext="vs yesterday"
          loading={testsLoading}
          trend={
            tests.completedToday > tests.completedYesterday ? "up" : "down"
          }
          index={2}
        />
        <StatsCard
          label="Equipment Status"
          value={`${equipment.operational}/${equipment.total}`}
          change={`${equipment.maintenance} in maintenance`}
          icon={Thermometer}
          color={equipment.operational === equipment.total ? "green" : "orange"}
          subtext="Operational units"
          loading={equipLoading}
          trend={equipment.operational === equipment.total ? "up" : "down"}
          index={3}
        />
        <StatsCard
          label="Samples Collected"
          value={samples.today}
          change={`${samples.pending} pending`}
          icon={FlaskConical}
          color="blue"
          subtext="Today"
          loading={samplesLoading}
          trend={samples.today > samples.yesterday ? "up" : "down"}
          index={4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PendingTestsList tests={tests.list} loading={testsLoading} />
        <EquipmentStatus equipment={equipment.list} loading={equipLoading} />
      </div>
    </div>
  );
}
