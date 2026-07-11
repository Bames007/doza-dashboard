// app/center/dashboard/dashboards/hooks/useSalesStats.ts
import { useState, useEffect } from "react";
import { SalesStats } from "../types";
import { apiFetch } from "@/app/lib/api";

export function useSalesStats(centerId?: string, userId?: string) {
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageSaleValue: 0,
    totalCustomers: 0,
    itemsSold: 0,
    todaySales: 0,
    todayRevenue: 0,
    onlineSales: 0,
    offlineSales: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/sales/stats`, {
          userId,
        });
        setSalesStats(
          data || {
            totalSales: 0,
            totalRevenue: 0,
            averageSaleValue: 0,
            totalCustomers: 0,
            itemsSold: 0,
            todaySales: 0,
            todayRevenue: 0,
            onlineSales: 0,
            offlineSales: 0,
          },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load sales stats");
        setSalesStats({
          totalSales: 0,
          totalRevenue: 0,
          averageSaleValue: 0,
          totalCustomers: 0,
          itemsSold: 0,
          todaySales: 0,
          todayRevenue: 0,
          onlineSales: 0,
          offlineSales: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [centerId, userId]);

  return { salesStats, loading, error };
}
