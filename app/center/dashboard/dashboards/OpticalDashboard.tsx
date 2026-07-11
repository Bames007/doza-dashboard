// app/center/dashboard/dashboards/OpticalDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import { Glasses, Eye, Package, ShoppingCart, Clock } from "lucide-react";

import { useLensOrders } from "./hooks/useLensOrders";
import { useEyeExams } from "./hooks/useEyeExams";
import { useOpticalInventory } from "./hooks/useOpticalInventory";
import { useAppointments } from "./hooks/useAppointments";
import FrameInventory from "./components/FrameInventory";
import EyeExamSchedule from "./components/EyeExamSchedule";
import LensOrderStatus from "./components/LensOrderStatus";

export default function OpticalDashboard() {
  const { center } = useDashboard();
  const { inventory, loading: invLoading } = useOpticalInventory(center?.id);
  const { exams, loading: examLoading } = useEyeExams(center?.id);
  const { orders, loading: orderLoading } = useLensOrders(center?.id);
  const { appointments, loading: aptLoading } = useAppointments(
    center?.id,
    "optical",
  );

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Frames in Stock"
          value={inventory.totalFrames}
          change={`${inventory.lowStock} low stock`}
          icon={Glasses}
          color="blue"
          subtext={`${inventory.models} models`}
          loading={invLoading}
          trend={inventory.lowStock > 5 ? "down" : "neutral"}
          index={0}
        />
        <StatsCard
          label="Eye Exams Today"
          value={exams.today}
          change={`${exams.completed} completed`}
          icon={Eye}
          color="purple"
          subtext={`${exams.scheduled} scheduled`}
          loading={examLoading}
          trend={exams.completed > exams.scheduled * 0.7 ? "up" : "neutral"}
          index={1}
        />
        <StatsCard
          label="Lens Orders"
          value={orders.pending}
          change={`${orders.processing} processing`}
          icon={Package}
          color="amber"
          subtext={`${orders.ready} ready for pickup`}
          loading={orderLoading}
          trend={orders.pending > 10 ? "down" : "neutral"}
          index={2}
        />
        <StatsCard
          label="Avg. Fitting Time"
          value={`${appointments.avgFittingTime} min`}
          change={`${appointments.fittingsToday} today`}
          icon={Clock}
          color="green"
          subtext="Per patient"
          loading={aptLoading}
          trend={appointments.avgFittingTime < 20 ? "up" : "down"}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FrameInventory items={inventory.frames} loading={invLoading} />
        <EyeExamSchedule exams={exams.upcoming} loading={examLoading} />
      </div>
      <LensOrderStatus orders={orders.list} loading={orderLoading} />
    </div>
  );
}
