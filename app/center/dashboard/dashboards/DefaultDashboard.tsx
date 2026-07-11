// app/center/dashboard/panels/DefaultDashboard.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useDashboard } from "../DashboardContext";
import Image from "next/image";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { apiFetch } from "@/app/lib/api";

// Icons
import {
  Building2,
  Users,
  Package,
  DollarSign,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShoppingCart,
  BarChart,
  RefreshCw,
  Box,
  ChevronRight,
  Hash,
  MapPin,
  AlertOctagon,
  Target,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  XCircle,
  CalendarX,
  Stethoscope,
  Activity,
  Bed,
  Syringe,
  Microscope,
  Glasses,
  SmileIcon,
  TestTube,
  Pill,
  Heart,
  Ambulance,
} from "lucide-react";

// Types
interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  totalCustomers: number;
  itemsSold: number;
  todaySales: number;
  todayRevenue: number;
  onlineSales: number;
  offlineSales: number;
}

interface Product {
  id: string;
  name: string;
  expiryDate: string;
  batchNumber?: string;
  quantity: number;
  category: string;
  location?: string;
  unitPrice?: number;
  sellingPrice?: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  reorderLevel?: number;
  isMedicalEquipment?: boolean;
  prescriptionRequired?: boolean;
}

interface MedicData {
  verified?: boolean;
  points?: {
    totalPoints?: number;
    verifiedDrugs?: number;
    pendingReview?: number;
    level?: string;
  };
  professionalInfo?: {
    role?: string;
  };
}

// Extended types for different center types
interface BedData {
  totalBeds: number;
  occupied: number;
  available: number;
  icuAvailable?: number;
  emergencyAvailable?: number;
}

interface AppointmentStats {
  total: number;
  upcoming: number;
  completedToday: number;
  pending: number;
}

interface ProcedureStats {
  today: number;
  completed: number;
  scheduled: number;
}

// ─── Main Component ──────────────────────────────────────────────────
export default function DefaultDashboard() {
  const { user, center } = useDashboard();
  const centerType = center?.centerType || "medical_center";

  // ---------- State ----------
  const [medicData, setMedicData] = useState<MedicData | null>(null);
  const [expiredDrugs, setExpiredDrugs] = useState<Product[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
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
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    upcoming: 0,
    completedToday: 0,
    pending: 0,
  });
  const [bedStats, setBedStats] = useState<BedData | null>(null);
  const [procedureStats, setProcedureStats] = useState<ProcedureStats | null>(
    null,
  );
  const [loading, setLoading] = useState({
    expired: false,
    sales: false,
    medic: false,
    appointments: false,
    beds: false,
    procedures: false,
    all: false,
  });

  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  // ---------- Helpers ----------
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "No expiry";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const getExpiryStatus = useCallback((expiryDate: string) => {
    if (!expiryDate)
      return { color: "bg-gray-100 text-gray-800", text: "No Expiry" };
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime()))
      return { color: "bg-gray-100 text-gray-800", text: "Invalid Date" };
    const today = new Date();
    const daysDiff = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff < 0)
      return { color: "bg-rose-100 text-rose-800", text: "Expired" };
    if (daysDiff <= 30)
      return { color: "bg-amber-100 text-amber-800", text: "Expiring Soon" };
    if (daysDiff <= 90)
      return { color: "bg-blue-100 text-blue-800", text: "Near Expiry" };
    return { color: "bg-emerald-100 text-emerald-800", text: "Valid" };
  }, []);

  const getGreeting = (hour: number) => {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentTime = useMemo(() => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      date: now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      shortDate: now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      greeting: getGreeting(now.getHours()),
    };
  }, []);

  // ---------- Data fetching (using apiFetch with userId) ----------
  const fetchExpiredDrugs = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    setLoading((prev) => ({ ...prev, expired: true }));
    try {
      const data = await apiFetch(`/api/centers/${center.id}/inventory`, {
        userId: user.id,
      });
      let products: Product[] = [];
      if (data?.products) products = data.products;
      else if (Array.isArray(data)) products = data;
      else if (data?.data?.products) products = data.data.products;

      const today = new Date();
      const expiredAndExpiring = products.filter((p) => {
        if (!p.expiryDate) return false;
        const expiryDate = new Date(p.expiryDate);
        if (isNaN(expiryDate.getTime())) return false;
        const daysDiff = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysDiff <= 30;
      });
      setExpiredDrugs(expiredAndExpiring);
    } catch (error) {
      console.error("Error fetching expired drugs:", error);
      setExpiredDrugs([]);
    } finally {
      setLoading((prev) => ({ ...prev, expired: false }));
    }
  }, [center?.id, user?.id]);

  const fetchSalesStats = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    setLoading((prev) => ({ ...prev, sales: true }));
    try {
      const data = await apiFetch(`/api/centers/${center.id}/sales/stats`, {
        userId: user.id,
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
    } catch (error) {
      console.error("Error fetching sales stats:", error);
    } finally {
      setLoading((prev) => ({ ...prev, sales: false }));
    }
  }, [center?.id, user?.id]);

  const fetchAppointmentStats = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    setLoading((prev) => ({ ...prev, appointments: true }));
    try {
      const data = await apiFetch(`/api/centers/${center.id}/appointments`, {
        userId: user.id,
      });
      const appointments = Array.isArray(data) ? data : [];
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter((a) =>
        a.createdAt?.startsWith(today),
      );
      setAppointmentStats({
        total: appointments.length,
        upcoming: appointments.filter((a) =>
          ["scheduled", "pending"].includes(a.status),
        ).length,
        completedToday: todayAppointments.filter(
          (a) => a.status === "completed",
        ).length,
        pending: appointments.filter((a) => a.status === "pending").length,
      });
    } catch (error) {
      console.error("Error fetching appointment stats:", error);
    } finally {
      setLoading((prev) => ({ ...prev, appointments: false }));
    }
  }, [center?.id, user?.id]);

  const fetchBedStats = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    setLoading((prev) => ({ ...prev, beds: true }));
    try {
      const data = await apiFetch(`/api/centers/${center.id}/beds`, {
        userId: user.id,
      });
      if (data) setBedStats(data);
    } catch (error) {
      console.error("Error fetching bed stats:", error);
      setBedStats(null);
    } finally {
      setLoading((prev) => ({ ...prev, beds: false }));
    }
  }, [center?.id, user?.id]);

  const fetchProcedureStats = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    setLoading((prev) => ({ ...prev, procedures: true }));
    try {
      const data = await apiFetch(`/api/centers/${center.id}/surgeries`, {
        userId: user.id,
      });
      if (Array.isArray(data)) {
        const today = new Date().toISOString().split("T")[0];
        const todayItems = data.filter((p) => p.date?.startsWith(today));
        setProcedureStats({
          today: todayItems.length,
          completed: data.filter((p) => p.status === "completed").length,
          scheduled: data.filter((p) => p.status === "scheduled").length,
        });
      } else {
        setProcedureStats(null);
      }
    } catch (error) {
      console.error("Error fetching procedure stats:", error);
      setProcedureStats(null);
    } finally {
      setLoading((prev) => ({ ...prev, procedures: false }));
    }
  }, [center?.id, user?.id]);

  const fetchMedicStatus = useCallback(async () => {
    if (!user?.email) return;
    setLoading((prev) => ({ ...prev, medic: true }));
    try {
      const data = await apiFetch(
        `/api/medics/check?email=${encodeURIComponent(user.email)}`,
        { userId: user.id },
      );
      if (data.isRegistered && data.medicData) {
        setMedicData(data.medicData);
      } else {
        setMedicData(null);
      }
    } catch (error) {
      console.error("Error fetching medic status:", error);
      setMedicData(null);
    } finally {
      setLoading((prev) => ({ ...prev, medic: false }));
    }
  }, [user?.email, user?.id]);

  const fetchLowStockItems = useCallback(async () => {
    if (!center?.id || !user?.id) return;
    try {
      const data = await apiFetch(`/api/centers/${center.id}/inventory`, {
        userId: user.id,
      });
      let products: Product[] = [];
      if (data?.products) products = data.products;
      else if (Array.isArray(data)) products = data;
      else if (data?.data?.products) products = data.data.products;

      const lowStock = products
        .filter((p) => {
          const qty = p.quantity || 0;
          const reorder = p.reorderLevel || 10;
          return qty <= reorder && qty > 0;
        })
        .slice(0, 5);
      setLowStockItems(lowStock);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      setLowStockItems([]);
    }
  }, [center?.id, user?.id]);

  // ---------- Initial fetch ----------
  useEffect(() => {
    if (!center?.id || !user?.id || hasFetchedInitial) return;
    const fetchAll = async () => {
      setLoading((prev) => ({ ...prev, all: true }));
      await Promise.all([
        fetchMedicStatus(),
        fetchAppointmentStats(),
        fetchSalesStats(),
        fetchLowStockItems(),
        // Conditionally fetch center-type specific data
        centerType === "pharmacy" && fetchExpiredDrugs(),
        centerType === "hospital" && fetchBedStats(),
        (centerType === "hospital" || centerType === "emergency") &&
          fetchProcedureStats(),
      ]);
      setHasFetchedInitial(true);
      setLoading((prev) => ({ ...prev, all: false }));
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    center?.id,
    user?.id,
    centerType,
    hasFetchedInitial,
    fetchMedicStatus,
    fetchAppointmentStats,
    fetchSalesStats,
    fetchLowStockItems,
    fetchExpiredDrugs,
    fetchBedStats,
    fetchProcedureStats,
  ]);

  const refreshData = useCallback(async () => {
    setLoading((prev) => ({ ...prev, all: true }));
    await Promise.all([
      fetchMedicStatus(),
      fetchAppointmentStats(),
      fetchSalesStats(),
      fetchLowStockItems(),
      centerType === "pharmacy" && fetchExpiredDrugs(),
      centerType === "hospital" && fetchBedStats(),
      (centerType === "hospital" || centerType === "emergency") &&
        fetchProcedureStats(),
    ]);
    setLoading((prev) => ({ ...prev, all: false }));
  }, [
    fetchMedicStatus,
    fetchAppointmentStats,
    fetchSalesStats,
    fetchLowStockItems,
    fetchExpiredDrugs,
    fetchBedStats,
    fetchProcedureStats,
    centerType,
  ]);

  // ---------- Memoized stats ----------
  const expiredStats = useMemo(() => {
    const actuallyExpired = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Expired",
    );
    const expiringSoon = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Expiring Soon",
    );
    const nearExpiry = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Near Expiry",
    );
    const totalValue = expiredDrugs.reduce(
      (sum, d) => sum + (d.quantity || 0) * (d.unitPrice || 0),
      0,
    );
    return {
      totalExpired: actuallyExpired.length,
      totalExpiringSoon: expiringSoon.length,
      totalNearExpiry: nearExpiry.length,
      totalExpiryItems: expiredDrugs.length,
      totalValue,
    };
  }, [expiredDrugs, getExpiryStatus]);

  // ---------- Build dynamic stats based on center type ----------
  const stats = useMemo(() => {
    const baseStats = [
      {
        label: "Today's Revenue",
        value: formatCurrency(salesStats.todayRevenue || 0),
        change: salesStats.todayRevenue > 0 ? "+12%" : "No sales today",
        icon: DollarSign,
        color: "green",
        subtext: `${salesStats.todaySales || 0} transactions`,
        loading: loading.sales,
        trend: salesStats.todayRevenue > 0 ? "up" : "neutral",
        show: true,
      },
      {
        label: "Appointments Today",
        value: appointmentStats.completedToday.toString(),
        change: `${appointmentStats.upcoming} upcoming`,
        icon: CalendarX,
        color: "blue",
        subtext: `${appointmentStats.total} total`,
        loading: loading.appointments,
        trend: appointmentStats.completedToday > 0 ? "up" : "neutral",
        show: true,
      },
      {
        label: "Low Stock",
        value: lowStockItems.length.toString(),
        change: lowStockItems.length > 0 ? "Restock Needed" : "Optimal",
        icon: Package,
        color: lowStockItems.length > 0 ? "orange" : "green",
        subtext: "Items below reorder level",
        loading: false,
        trend: lowStockItems.length > 0 ? "down" : "neutral",
        show: true,
      },
      {
        label: "Total Customers",
        value: salesStats.totalCustomers?.toString() || "0",
        change: salesStats.totalCustomers > 0 ? "+5%" : "New",
        icon: Users,
        color: "blue",
        subtext: "All time customers",
        loading: loading.sales,
        trend: salesStats.totalCustomers > 0 ? "up" : "neutral",
        show: true,
      },
    ];

    // Add center-type-specific stats
    if (centerType === "hospital") {
      baseStats.push({
        label: "Bed Occupancy",
        value: bedStats ? `${bedStats.occupied}/${bedStats.totalBeds}` : "0/0",
        change: bedStats ? `${bedStats.available} available` : "No data",
        icon: Bed,
        color: "rose",
        subtext: "Hospital beds",
        loading: loading.beds,
        trend:
          bedStats && bedStats.occupied > bedStats.totalBeds * 0.7
            ? "down"
            : "up",
        show: true,
      });
    }

    if (centerType === "pharmacy") {
      baseStats.push({
        label: "Expired Drugs",
        value: expiredStats.totalExpired.toString(),
        change: `${expiredStats.totalExpiringSoon} expiring soon`,
        icon: AlertTriangle,
        color: expiredStats.totalExpired > 0 ? "red" : "green",
        subtext: `${expiredStats.totalExpiryItems} total expiry items`,
        loading: loading.expired,
        trend: expiredStats.totalExpired > 0 ? "down" : "neutral",
        show: true,
      });
    }

    if (["hospital", "emergency"].includes(centerType)) {
      baseStats.push({
        label: "Procedures Today",
        value: procedureStats?.today?.toString() || "0",
        change: procedureStats?.scheduled
          ? `${procedureStats.scheduled} scheduled`
          : "No data",
        icon: Activity,
        color: "purple",
        subtext: `${procedureStats?.completed || 0} completed`,
        loading: loading.procedures,
        trend: procedureStats && procedureStats.today > 0 ? "up" : "neutral",
        show: true,
      });
    }

    // Filter out stats that shouldn't be shown (based on show flag)
    return baseStats.filter((s) => s.show);
  }, [
    centerType,
    salesStats,
    appointmentStats,
    lowStockItems,
    bedStats,
    expiredStats,
    procedureStats,
    loading,
    formatCurrency,
  ]);

  // ---------- Render functions for different center types ----------
  const renderPharmacySpecific = () => {
    if (centerType !== "pharmacy") return null;
    // Expired drugs alert (only for pharmacy)
    return renderExpiredDrugsAlert();
  };

  const renderHospitalSpecific = () => {
    if (centerType !== "hospital") return null;
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Bed Occupancy</h3>
        {bedStats ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Beds</span>
              <span className="font-bold text-slate-900">
                {bedStats.totalBeds}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Occupied</span>
              <span className="font-bold text-rose-600">
                {bedStats.occupied}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Available</span>
              <span className="font-bold text-emerald-600">
                {bedStats.available}
              </span>
            </div>
            {bedStats.icuAvailable !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">ICU Available</span>
                <span className="font-bold text-blue-600">
                  {bedStats.icuAvailable}
                </span>
              </div>
            )}
            <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
              <div
                className="bg-rose-500 h-2.5 rounded-full"
                style={{
                  width: `${(bedStats.occupied / bedStats.totalBeds) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No bed data available</p>
        )}
      </div>
    );
  };

  const renderExpiredDrugsAlert = () => {
    if (loading.expired) {
      return (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
              <Image
                alt="Doza Logo"
                src="/logo.png"
                width={40}
                height={40}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      );
    }

    const actuallyExpired = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Expired",
    );
    const expiringSoon = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Expiring Soon",
    );
    const nearExpiry = expiredDrugs.filter(
      (d) => getExpiryStatus(d.expiryDate).text === "Near Expiry",
    );

    if (expiredDrugs.length === 0) {
      return (
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                All Inventory Valid
              </h3>
              <p className="text-slate-600 text-sm">
                No expired or soon-to-expire drugs found.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-6 border border-rose-200 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-rose-500 to-amber-500 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                Inventory Expiry Alert
              </h3>
              <p className="text-slate-600 text-sm">
                {actuallyExpired.length} expired • {expiringSoon.length}{" "}
                expiring soon • {nearExpiry.length} near expiry
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="px-3 py-1 bg-rose-100 text-rose-700 text-sm rounded-full font-medium">
              {expiredDrugs.length} total items
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Total value: {formatCurrency(expiredStats.totalValue)}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <span className="font-medium text-slate-900">Expired</span>
              </div>
              <span className="text-2xl font-bold text-rose-600">
                {actuallyExpired.length}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Past expiry date • Remove immediately
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <CalendarX className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-medium text-slate-900">
                  Expiring Soon
                </span>
              </div>
              <span className="text-2xl font-bold text-amber-600">
                {expiringSoon.length}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Within 30 days • Priority sale
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium text-slate-900">Near Expiry</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {nearExpiry.length}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Within 90 days • Monitor closely
            </div>
          </div>
        </div>

        {/* List of expired products */}
        {actuallyExpired.length > 0 && (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900">
                Expired Products List
              </h4>
              <span className="text-sm text-slate-500">
                Showing {actuallyExpired.slice(0, 10).length} of{" "}
                {actuallyExpired.length}
              </span>
            </div>
            {actuallyExpired.slice(0, 10).map((drug) => (
              <div
                key={drug.id}
                className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-rose-100 rounded-lg">
                        <Package className="w-5 h-5 text-rose-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">
                          {drug.name}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {drug.sku && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <Hash className="w-3 h-3" />
                              {drug.sku}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-600">
                            <Box className="w-3 h-3" />
                            Qty: {drug.quantity} {drug.unit || "units"}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3" />
                            {drug.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryStatus(drug.expiryDate).color}`}
                          >
                            {getExpiryStatus(drug.expiryDate).text}
                          </span>
                          <span className="text-xs text-slate-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Expired: {formatDate(drug.expiryDate)}
                          </span>
                          <span className="text-xs text-rose-500 font-medium">
                            {drug.expiryDate} days overdue
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() =>
            alert(
              "Please use the Inventory section in the sidebar to manage all items.",
            )
          }
          className="w-full mt-4 text-center text-white bg-gradient-to-r from-rose-500 to-amber-500 font-medium py-3 rounded-xl hover:from-rose-600 hover:to-amber-600 transition-all shadow-sm"
        >
          Manage All Expired Items in Inventory
        </button>
      </div>
    );
  };

  const renderLowStockItems = () => (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertOctagon className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Low Stock Items
            </h3>
            <p className="text-slate-600 text-sm">Need immediate restocking</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full font-medium">
          {lowStockItems.length}
        </span>
      </div>

      <div className="space-y-4">
        {lowStockItems.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-600 text-sm">All items are well-stocked</p>
          </div>
        ) : (
          lowStockItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 hover:bg-amber-50 rounded-xl transition-colors border border-amber-100"
            >
              <div className="bg-amber-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.category || "Uncategorized"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    {item.quantity} left
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Reorder at {item.reorderLevel || 10}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    SKU: {item.sku || "N/A"}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min((item.quantity / (item.reorderLevel || 10)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMedicStatusCard = () => {
    if (loading.medic) {
      return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
              <Image
                alt="Doza Logo"
                src="/logo.png"
                width={40}
                height={40}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      );
    }

    const isMedicRegistered = !!medicData;
    const isMedicApproved = medicData?.verified === true;
    const medicRole =
      medicData?.professionalInfo?.role || user?.role || "Staff";

    if (!isMedicRegistered) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg mb-2">
                Doza Medic Network
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Join verified healthcare professionals for drug verification and
                exclusive features.
              </p>
              <button
                onClick={() =>
                  alert(
                    "Medic registration is available in your account settings.",
                  )
                }
                className="bg-blue-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isMedicApproved) {
      return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  Medic Status: Pending
                </h3>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                  Under Review
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-3">
                Your medic application is being reviewed. You'll be notified
                once approved.
              </p>
              <div className="text-xs text-amber-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Estimated approval: 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Doza Medic</h3>
              <p className="text-slate-600 text-sm flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Verified</span>
                </span>
                <span>•</span>
                <span>{medicRole}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {medicData?.points?.totalPoints?.toLocaleString() || "0"}
            </div>
            <div className="text-slate-600 text-sm">Total Points</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Verified Drugs
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {medicData?.points?.verifiedDrugs || 0}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Pending Reviews
              </span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {medicData?.points?.pendingReview || 0}
            </div>
          </div>
        </div>

        {medicData?.points?.level && (
          <div className="pt-4 border-t border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current Level</span>
              <span className="font-medium text-emerald-600">
                {medicData.points.level}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSalesOverview = () => {
    if (loading.sales) {
      return (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
              <Image
                alt="Doza Logo"
                src="/logo.png"
                width={40}
                height={40}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Sales Overview</h3>
            <p className="text-slate-600 text-sm">Today's performance</p>
          </div>
          <button
            onClick={() =>
              alert(
                "Please check the Sales section in the sidebar for detailed reports.",
              )
            }
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View Details →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-600">
                +{Math.floor(Math.random() * 15) + 5}%
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(salesStats.todayRevenue || 0)}
            </div>
            <div className="text-slate-600 text-sm">Today's Revenue</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-blue-600">
                {salesStats.todaySales || 0} trans
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(salesStats.averageSaleValue || 0)}
            </div>
            <div className="text-slate-600 text-sm">Avg. Sale Value</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAppointmentOverview = () => {
    if (loading.appointments) {
      return (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
              <Image
                alt="Doza Logo"
                src="/logo.png"
                width={40}
                height={40}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              Appointment Overview
            </h3>
            <p className="text-slate-600 text-sm">Today's schedule</p>
          </div>
          <button
            onClick={() =>
              alert(
                "Please check the Appointments section in the sidebar for full schedule.",
              )
            }
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Completed Today
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {appointmentStats.completedToday}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                Upcoming
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {appointmentStats.upcoming}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------- Main render ----------
  if (loading.all) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-32 w-32 border-[6px] border-emerald-200 border-t-emerald-600"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Image
                src="/logo.png"
                alt="Doza Logo"
                width={60}
                height={60}
                className="animate-pulse"
              />
            </div>
          </div>
          <p
            className={cn(
              "text-slate-700 font-medium text-lg",
              poppins.className,
            )}
          >
            Loading Dashboard...
          </p>
          <p className={cn("text-slate-500 text-sm mt-2", poppins.className)}>
            Preparing your Doza Center Insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-screen bg-[#F8FAFC] pb-40 pt-8", poppins.className)}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 md:px-6"
      >
        {/* --- HEADER --- */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-[2px] w-8 bg-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">
                Center Overview
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              DASHBOARD
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {currentTime.greeting}, {user?.fullName?.split(" ")[0] || "User"}{" "}
              – real-time insights for {center?.centerName || "Medical Center"}
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading.all}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 text-slate-600",
                loading.all && "animate-spin",
              )}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Refresh
            </span>
          </button>
        </header>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow"
            >
              {stat.loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-emerald-200 border-t-emerald-600"></div>
                    <Image
                      src="/logo.png"
                      alt="Doza"
                      width={20}
                      height={20}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl",
                        stat.color === "green"
                          ? "bg-emerald-100"
                          : stat.color === "red"
                            ? "bg-rose-100"
                            : stat.color === "blue"
                              ? "bg-blue-100"
                              : stat.color === "purple"
                                ? "bg-purple-100"
                                : stat.color === "orange"
                                  ? "bg-amber-100"
                                  : "bg-slate-100",
                      )}
                    >
                      <stat.icon
                        className={cn(
                          "w-5 h-5",
                          stat.color === "green"
                            ? "text-emerald-600"
                            : stat.color === "red"
                              ? "text-rose-600"
                              : stat.color === "blue"
                                ? "text-blue-600"
                                : stat.color === "purple"
                                  ? "text-purple-600"
                                  : stat.color === "orange"
                                    ? "text-amber-600"
                                    : "text-slate-600",
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {stat.trend === "up" && (
                        <TrendingUpIcon className="w-4 h-4 text-emerald-500" />
                      )}
                      {stat.trend === "down" && (
                        <TrendingDownIcon className="w-4 h-4 text-rose-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          stat.change.includes("+")
                            ? "text-emerald-600"
                            : stat.change.includes("Needs") ||
                                stat.change.includes("Restock")
                              ? "text-rose-600"
                              : "text-slate-500",
                        )}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <h3
                    className={cn(
                      "text-3xl font-bold text-slate-900 leading-tight",
                      bebasNeue.className,
                    )}
                  >
                    {stat.value}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{stat.subtext}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* --- TWO COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {centerType === "pharmacy" && renderPharmacySpecific()}
            {centerType === "hospital" && renderHospitalSpecific()}
            {/* Always show low stock for centers with inventory */}
            {[
              "pharmacy",
              "hospital",
              "clinic",
              "optical",
              "dental",
              "diagnostic_lab",
            ].includes(centerType) && renderLowStockItems()}
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {renderMedicStatusCard()}
            {renderSalesOverview()}
            {renderAppointmentOverview()}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
