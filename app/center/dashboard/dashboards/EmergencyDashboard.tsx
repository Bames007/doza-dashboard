// app/center/dashboard/dashboards/EmergencyDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import {
  Ambulance,
  Clock,
  AlertOctagon,
  Users,
  HeartPulse,
} from "lucide-react";

import { useAmbulanceArrivals } from "./hooks/useAmbulanceArrivals";
import { useCriticalPatients } from "./hooks/useCriticalPatients";
import { useEmergencyCensus } from "./hooks/useEmergencyCensus";
import EmergencyCensus from "./components/EmergencyCensus";
import AmbulanceETA from "./components/AmbulanceETA";
import CriticalList from "./components/CriticalList";

export default function EmergencyDashboard() {
  const { center } = useDashboard();
  const { census, loading: censusLoading } = useEmergencyCensus(center?.id);
  const { arrivals, loading: arrivalLoading } = useAmbulanceArrivals(
    center?.id,
  );
  const { critical, loading: criticalLoading } = useCriticalPatients(
    center?.id,
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="ER Census"
          value={`${census.current}/${census.capacity}`}
          change={`${census.waiting} waiting`}
          icon={Users}
          color={census.current / census.capacity > 0.8 ? "red" : "blue"}
          subtext={`${census.boarding} boarding`}
          loading={censusLoading}
          trend={census.current > census.capacity * 0.9 ? "down" : "neutral"}
          index={0}
        />
        <StatsCard
          label="Avg Wait Time"
          value={`${census.avgWaitTime} min`}
          change={`-${census.waitTimeChange} min`}
          icon={Clock}
          color={census.avgWaitTime > 45 ? "red" : "green"}
          subtext="From arrival to bed"
          loading={censusLoading}
          trend={census.avgWaitTime < 30 ? "up" : "down"}
          index={1}
        />
        <StatsCard
          label="Ambulance ETA"
          value={arrivals.incoming}
          change={`${arrivals.within10} <10 min`}
          icon={Ambulance}
          color="amber"
          subtext="Incoming patients"
          loading={arrivalLoading}
          trend={arrivals.incoming > arrivals.avg ? "down" : "neutral"}
          index={2}
        />
        <StatsCard
          label="Critical Patients"
          value={critical.count}
          change={`${critical.icuRequired} need ICU`}
          icon={HeartPulse}
          color="red"
          subtext="Immediate attention"
          loading={criticalLoading}
          trend={critical.count > 5 ? "down" : "neutral"}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EmergencyCensus patients={census.patients} loading={censusLoading} />
        <AmbulanceETA arrivals={arrivals.list} loading={arrivalLoading} />
      </div>
      <CriticalList patients={critical.list} loading={criticalLoading} />
    </div>
  );
}
