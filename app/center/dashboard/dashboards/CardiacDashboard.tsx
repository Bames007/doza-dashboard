// app/center/dashboard/dashboards/CardiacDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import { Heart, Activity, Calendar, Bed, AlertCircle } from "lucide-react";

import { useECGSchedule } from "./hooks/useECGSchedule";
import { useCathLab } from "./hooks/useCathLab";
import { useProcedures } from "./hooks/useProcedures";
import { useCardiacICU } from "./hooks/useCardiacICU";
import CardiacICUStatus from "./components/CardiacICUStatus";
import CathLabSchedule from "./components/CathLabSchedule";
import ECGQueue from "./components/ECGQueue";

export default function CardiacDashboard() {
  const { center } = useDashboard();
  const { icu, loading: icuLoading } = useCardiacICU(center?.id);
  const { procedures, loading: procLoading } = useProcedures(center?.id);
  const { ecg, loading: ecgLoading } = useECGSchedule(center?.id);
  const { cathLab, loading: cathLoading } = useCathLab(center?.id);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Cardiac ICU"
          value={`${icu.occupied}/${icu.total}`}
          change={`${icu.ventilated} ventilated`}
          icon={Bed}
          color={icu.occupied / icu.total > 0.9 ? "red" : "purple"}
          subtext={`${icu.available} available`}
          loading={icuLoading}
          trend={icu.available === 0 ? "down" : "neutral"}
          index={0}
        />
        <StatsCard
          label="Procedures Today"
          value={procedures.today}
          change={`${procedures.completed} completed`}
          icon={Heart}
          color="emerald"
          subtext={`${procedures.scheduled} scheduled`}
          loading={procLoading}
          trend={
            procedures.completed > procedures.today * 0.6 ? "up" : "neutral"
          }
          index={1}
        />
        <StatsCard
          label="ECG Queue"
          value={ecg.waiting}
          change={`Avg wait ${ecg.avgWaitTime} min`}
          icon={Activity}
          color={ecg.waiting > 5 ? "amber" : "green"}
          subtext="Pending tests"
          loading={ecgLoading}
          trend={ecg.waiting < 3 ? "up" : "down"}
          index={2}
        />
        <StatsCard
          label="Cath Lab"
          value={`${cathLab.inUse}/${cathLab.total}`}
          change={`${cathLab.nextCase} next`}
          icon={AlertCircle}
          color={cathLab.inUse === cathLab.total ? "red" : "blue"}
          subtext={`${cathLab.available} available`}
          loading={cathLoading}
          trend={cathLab.inUse === cathLab.total ? "down" : "neutral"}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CardiacICUStatus patients={icu.patients} loading={icuLoading} />
        <CathLabSchedule
          procedures={cathLab.procedures}
          loading={cathLoading}
        />
      </div>
      <ECGQueue queue={ecg.queue} loading={ecgLoading} />
    </div>
  );
}
