// app/center/dashboard/dashboards/PharmacyDashboard.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import StatsCard from "./components/StatsCard";
import { Package, AlertTriangle, DollarSign, Users } from "lucide-react";

import { useSalesStats } from "./hooks/useSaleStats";
import { useLowStock } from "./hooks/useLowStock";
import { useExpiredDrugs } from "./hooks/useExpiredDrugs";
import ExpiryAlert from "./components/ExpiryAlert";
import LowStockAlert from "./components/LowStockAlert";

export default function PharmacyDashboard() {
  const { center } = useDashboard();
  const { expiredDrugs, loading: expiredLoading } = useExpiredDrugs(center?.id);
  const { lowStockItems } = useLowStock(center?.id);
  const { salesStats, loading: salesLoading } = useSalesStats(center?.id);

  const expiredStats = {
    totalExpired: expiredDrugs.filter((d) => d.status === "expired").length,
    totalExpiringSoon: expiredDrugs.filter((d) => d.status === "expiring_soon")
      .length,
    totalExpiryItems: expiredDrugs.length,
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="Today's Revenue"
          value={new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
          }).format(salesStats.todayRevenue || 0)}
          change={salesStats.todayRevenue > 0 ? "+12%" : "No sales"}
          icon={DollarSign}
          color="green"
          subtext={`${salesStats.todaySales || 0} transactions`}
          loading={salesLoading}
          trend={salesStats.todayRevenue > 0 ? "up" : "neutral"}
          index={0}
        />
        <StatsCard
          label="Expired Items"
          value={`${expiredStats.totalExpired} expired`}
          change={`${expiredStats.totalExpiringSoon} expiring soon`}
          icon={AlertTriangle}
          color={expiredStats.totalExpired > 0 ? "red" : "green"}
          subtext={`${expiredStats.totalExpiryItems} total expiry items`}
          loading={expiredLoading}
          trend={expiredStats.totalExpired > 0 ? "down" : "neutral"}
          index={1}
        />
        <StatsCard
          label="Low Stock"
          value={lowStockItems.length.toString()}
          change={lowStockItems.length > 0 ? "Restock Needed" : "Optimal"}
          icon={Package}
          color={lowStockItems.length > 0 ? "orange" : "green"}
          subtext="Items below reorder level"
          loading={false}
          trend={lowStockItems.length > 0 ? "down" : "neutral"}
          index={2}
        />
        <StatsCard
          label="Total Customers"
          value={salesStats.totalCustomers?.toString() || "0"}
          change={salesStats.totalCustomers > 0 ? "+5%" : "New"}
          icon={Users}
          color="blue"
          subtext="All time customers"
          loading={salesLoading}
          trend={salesStats.totalCustomers > 0 ? "up" : "neutral"}
          index={3}
        />
      </div>

      {/* Expiry & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ExpiryAlert expiredDrugs={expiredDrugs} loading={expiredLoading} />
        <LowStockAlert items={lowStockItems} />
      </div>
    </div>
  );
}
