// app/center/components/sales/components/SalesHistoryTab.tsx
"use client";

import { FC, useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Calendar,
  Filter,
  Download,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  BarChart3,
  RefreshCw,
  Eye,
  Receipt,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Cloud,
  Database,
  Check,
  AlertTriangle,
  CalendarDays,
  FileText,
  Package,
  CreditCard,
  CheckSquare,
  XCircle,
  Menu,
  Smartphone,
  Monitor,
} from "lucide-react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isAfter,
  parseISO,
} from "date-fns";
import { Center, User as UserType } from "@/app/center/type";
import { Sale, SaleItem, Customer } from "../../../types/pharmacy";
import { ApiWrapper } from "@/app/utils/apiWrapper";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface SalesHistoryTabProps {
  center: Center;
  user: UserType;
  apiWrapper: ApiWrapper | null;
}

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

interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  syncInProgress: boolean;
  hasPendingChanges: boolean;
  offlineSalesCount: number;
}

const SalesHistoryTab: FC<SalesHistoryTabProps> = ({
  center,
  user,
  apiWrapper,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [onlineSales, setOnlineSales] = useState<Sale[]>([]);
  const [offlineSales, setOfflineSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showReceipt, setShowReceipt] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: null,
    syncInProgress: false,
    hasPendingChanges: false,
    offlineSalesCount: 0,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentView, setCurrentView] = useState<"list" | "grid">("list");

  // Refs for data persistence
  const salesRef = useRef<Sale[]>([]);
  const offlineSalesRef = useRef<Sale[]>([]);
  const statsRef = useRef<SalesStats>({
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

  // Filters
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "custom" | "all"
  >("today");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "items">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"all" | "online" | "offline">("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalSalesCount, setTotalSalesCount] = useState(0);

  const [stats, setStats] = useState<SalesStats>({
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

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Format currency helper
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Format date helper
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM dd, yyyy HH:mm");
    } catch {
      return "Invalid Date";
    }
  }, []);

  // Format date for display
  const formatDisplayDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return "";
    }
  }, []);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = useCallback(() => {
    return format(new Date(), "yyyy-MM-dd");
  }, []);

  // Get maximum date (today)
  const getMaxDate = useCallback(() => {
    return getTodayDate();
  }, [getTodayDate]);

  // Handle date range change
  const handleStartDateChange = useCallback(
    (value: string) => {
      setStartDate(value);
      // If end date is empty or after today, set it to today or start date
      if (!endDate || isAfter(new Date(endDate), new Date())) {
        setEndDate(getTodayDate());
      }
    },
    [endDate, getTodayDate]
  );

  const handleEndDateChange = useCallback(
    (value: string) => {
      const today = new Date(getTodayDate());
      const selectedEndDate = new Date(value);

      // Prevent selecting future dates
      if (isAfter(selectedEndDate, today)) {
        setEndDate(getTodayDate());
      } else {
        setEndDate(value);
      }
    },
    [getTodayDate]
  );

  useEffect(() => {
    loadSalesData(1);
  }, [dateFilter, startDate, endDate]);

  // Initialize date filters
  useEffect(() => {
    const today = getTodayDate();

    if (dateFilter === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (dateFilter === "week") {
      const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      setStartDate(weekAgo);
      setEndDate(today);
    } else if (dateFilter === "month") {
      const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      setStartDate(monthAgo);
      setEndDate(today);
    } else if (dateFilter === "all") {
      setStartDate("");
      setEndDate("");
    }
  }, [dateFilter, getTodayDate]);

  // Load offline sales from localStorage
  const loadOfflineSales = useCallback((): Sale[] => {
    try {
      const offlineData = localStorage.getItem(`sales_offline_${center.id}`);
      if (offlineData) {
        const parsedData = JSON.parse(offlineData) as Sale[];
        setOfflineSales(parsedData);
        offlineSalesRef.current = parsedData;
        return parsedData;
      }
    } catch (error) {
      console.error("Error loading offline sales:", error);
    }
    return [];
  }, [center.id]);

  // Save offline sales to localStorage
  const saveOfflineSales = useCallback(
    (salesData: Sale[]) => {
      try {
        localStorage.setItem(
          `sales_offline_${center.id}`,
          JSON.stringify(salesData)
        );
        setOfflineSales(salesData);
        offlineSalesRef.current = salesData;
      } catch (error) {
        console.error("Error saving offline sales:", error);
      }
    },
    [center.id]
  );

  // Check online status
  const updateOnlineStatus = useCallback(() => {
    const isOnline = navigator.onLine;
    setSyncStatus((prev) => ({
      ...prev,
      isOnline,
    }));

    // Sync if we come online and have offline sales
    if (isOnline && offlineSalesRef.current.length > 0) {
      syncOfflineSales();
    }
  }, []);

  // Network status listeners
  useEffect(() => {
    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [updateOnlineStatus]);

  // Merge online and offline sales
  const mergeSales = useCallback((online: Sale[], offline: Sale[]) => {
    const merged = [...online, ...offline];

    // Remove duplicates based on sale number or ID
    const uniqueSales = merged.reduce((acc: Sale[], current) => {
      const existingIndex = acc.findIndex(
        (s) =>
          (s.saleNumber && s.saleNumber === current.saleNumber) ||
          (s.id && s.id === current.id)
      );

      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // Prefer online version if both exist
        const currentIsOffline = (current as any)._source === "offline";
        const existingIsOffline =
          (acc[existingIndex] as any)._source === "offline";

        if (!currentIsOffline && existingIsOffline) {
          acc[existingIndex] = current;
        }
      }

      return acc;
    }, []);

    return uniqueSales;
  }, []);

  // Sync offline sales when online
  const syncOfflineSales = useCallback(async () => {
    if (
      !apiWrapper ||
      !syncStatus.isOnline ||
      offlineSalesRef.current.length === 0
    )
      return;

    setSyncStatus((prev) => ({ ...prev, syncInProgress: true }));

    try {
      const offlineSalesToSync = [...offlineSalesRef.current];
      const syncedSales: Sale[] = [];
      const failedSales: Sale[] = [];

      for (const sale of offlineSalesToSync) {
        try {
          // Try to save sale to server
          const result = await apiWrapper.post(
            `/api/centers/${center.id}/sales`,
            {
              ...sale,
              _local: true, // Mark as offline sync
              syncedAt: new Date().toISOString(),
            }
          );

          if (result.success) {
            syncedSales.push(sale);
          } else {
            failedSales.push(sale);
          }
        } catch (error) {
          console.error("Failed to sync sale:", sale.id, error);
          failedSales.push(sale);
        }
      }

      // Update offline storage with failed sales only
      if (failedSales.length > 0) {
        saveOfflineSales(failedSales);
      } else {
        // Clear offline sales if all synced
        saveOfflineSales([]);
      }

      // Update sync status
      setSyncStatus((prev) => ({
        ...prev,
        syncInProgress: false,
        lastSync: new Date().toISOString(),
        hasPendingChanges: failedSales.length > 0,
        offlineSalesCount: failedSales.length,
      }));

      // Reload sales to get updated data
      if (syncedSales.length > 0) {
        await loadSalesData(currentPage);
      }
    } catch (error) {
      console.error("Error syncing offline sales:", error);
      setSyncStatus((prev) => ({ ...prev, syncInProgress: false }));
    }
  }, [
    apiWrapper,
    center.id,
    syncStatus.isOnline,
    currentPage,
    saveOfflineSales,
  ]);

  // Load sales data with improved offline support
  const loadSalesData = useCallback(
    async (page: number = currentPage) => {
      if (!apiWrapper && syncStatus.isOnline) {
        setError("API wrapper not initialized");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let onlineData: Sale[] = [];
        let totalCount = 0;

        // Try to load online data if available
        if (syncStatus.isOnline && apiWrapper) {
          try {
            // Build query parameters
            const params = new URLSearchParams();

            // Add date filter
            if (dateFilter !== "all" && dateFilter !== "custom") {
              const now = new Date();
              let start = new Date();

              if (dateFilter === "today") {
                start = startOfDay(now);
              } else if (dateFilter === "week") {
                start = startOfDay(subDays(now, 7));
              } else if (dateFilter === "month") {
                start = startOfDay(subDays(now, 30));
              }

              params.set("startDate", start.toISOString());
              params.set("endDate", endOfDay(now).toISOString());
            }

            // Add custom date range
            if (dateFilter === "custom" && startDate && endDate) {
              const start = startOfDay(parseISO(startDate));
              const end = endOfDay(parseISO(endDate));

              params.set("startDate", start.toISOString());
              params.set("endDate", end.toISOString());
            }

            // Add payment filter
            if (paymentFilter !== "all") {
              params.set("paymentMethod", paymentFilter);
            }

            // Add status filter
            if (statusFilter !== "all") {
              params.set("status", statusFilter);
            }

            // Add search term
            if (searchTerm) {
              params.set("search", searchTerm);
            }

            // Add pagination
            params.set("page", page.toString());
            params.set("limit", itemsPerPage.toString());

            // Add sort
            params.set("sortBy", sortBy);
            params.set("sortOrder", sortOrder);

            const queryString = params.toString();
            const url = `/api/centers/${center.id}/sales${
              queryString ? `?${queryString}` : ""
            }`;

            const result = await apiWrapper.get(url);

            if (result.success) {
              // Parse different response structures
              if (result.data?.data && Array.isArray(result.data.data)) {
                onlineData = result.data.data;
                totalCount =
                  result.data.total || result.data.count || onlineData.length;
              } else if (
                result.data?.sales &&
                Array.isArray(result.data.sales)
              ) {
                onlineData = result.data.sales;
                totalCount =
                  result.data.total || result.data.count || onlineData.length;
              } else if (Array.isArray(result.data)) {
                onlineData = result.data;
                totalCount = onlineData.length;
              } else if (result.data && typeof result.data === "object") {
                // Convert Firebase-style object to array
                onlineData = Object.entries(result.data).map(
                  ([key, value]) => ({
                    id: key,
                    ...(value as any),
                  })
                );
                totalCount = onlineData.length;
              }

              // Cache online data for offline use
              try {
                localStorage.setItem(
                  `sales_online_${center.id}`,
                  JSON.stringify(onlineData)
                );
                localStorage.setItem(
                  `sales_last_sync_${center.id}`,
                  new Date().toISOString()
                );
              } catch (storageError) {
                console.warn("Could not cache sales:", storageError);
              }
            }
          } catch (onlineError: unknown) {
            // Load cached online data if available
            try {
              const cached = localStorage.getItem(`sales_online_${center.id}`);
              if (cached) {
                onlineData = JSON.parse(cached);
              }
            } catch (cacheError) {
              console.error("Error loading cached sales:", cacheError);
            }
          }
        } else {
          // Offline mode: load cached online data
          try {
            const cached = localStorage.getItem(`sales_online_${center.id}`);
            if (cached) {
              onlineData = JSON.parse(cached);
            }
          } catch (cacheError) {
            console.error("Error loading cached sales:", cacheError);
          }
        }

        // Load offline sales
        const offlineData = loadOfflineSales();

        // Merge sales
        const mergedSales = mergeSales(onlineData, offlineData);

        // Apply filters to merged sales
        let filteredSales = mergedSales.filter((sale) => {
          // Date filter
          if (dateFilter !== "all") {
            const saleDate = parseISO(
              sale.createdAt || new Date().toISOString()
            );
            let start: Date, end: Date;

            if (dateFilter === "today") {
              start = startOfDay(new Date());
              end = endOfDay(new Date());
            } else if (dateFilter === "week") {
              start = startOfDay(subDays(new Date(), 7));
              end = endOfDay(new Date());
            } else if (dateFilter === "month") {
              start = startOfDay(subDays(new Date(), 30));
              end = endOfDay(new Date());
            } else if (dateFilter === "custom" && startDate && endDate) {
              start = startOfDay(parseISO(startDate));
              end = endOfDay(parseISO(endDate));
            } else {
              return true;
            }

            if (!(saleDate >= start && saleDate <= end)) {
              return false;
            }
          }

          // Payment filter
          if (paymentFilter !== "all" && sale.paymentMethod !== paymentFilter) {
            return false;
          }

          // Status filter
          if (statusFilter !== "all" && sale.status !== statusFilter) {
            return false;
          }

          // Search filter
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              sale.saleNumber?.toLowerCase().includes(term) ||
              sale.customerName?.toLowerCase().includes(term) ||
              sale.customerPhone?.includes(term) ||
              sale.soldByName?.toLowerCase().includes(term)
            );
          }

          return true;
        });

        // Apply view mode filter
        if (viewMode !== "all") {
          filteredSales = filteredSales.filter((sale) => {
            const isOffline = (sale as any)._source === "offline";
            if (viewMode === "online") return !isOffline;
            if (viewMode === "offline") return isOffline;
            return true;
          });
        }

        // Sort sales
        filteredSales.sort((a, b) => {
          let aValue = 0;
          let bValue = 0;

          if (sortBy === "date") {
            aValue = parseISO(a.createdAt || "").getTime();
            bValue = parseISO(b.createdAt || "").getTime();
          } else if (sortBy === "amount") {
            aValue = a.totalAmount || 0;
            bValue = b.totalAmount || 0;
          } else if (sortBy === "items") {
            aValue =
              a.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
              0;
            bValue =
              b.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ||
              0;
          }

          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        });

        // Update state
        setSales(filteredSales);
        setOnlineSales(onlineData);
        setTotalSalesCount(filteredSales.length);
        salesRef.current = filteredSales;

        // Update sync status
        setSyncStatus((prev) => ({
          ...prev,
          offlineSalesCount: offlineData.length,
          lastSync: localStorage.getItem(`sales_last_sync_${center.id}`),
        }));
      } catch (err: unknown) {
        const error = err as Error;
        setError(
          error.message || "Failed to load sales data. Please try again."
        );

        // Try to load from cache
        try {
          const cached = localStorage.getItem(`sales_online_${center.id}`);
          if (cached) {
            const cachedSales = JSON.parse(cached);
            setSales(cachedSales);
          }
        } catch (cacheError) {
          console.error("Error loading cached sales:", cacheError);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      apiWrapper,
      center.id,
      currentPage,
      dateFilter,
      startDate,
      endDate,
      paymentFilter,
      statusFilter,
      searchTerm,
      sortBy,
      sortOrder,
      viewMode,
      itemsPerPage,
      syncStatus.isOnline,
      loadOfflineSales,
      mergeSales,
    ]
  );

  // Load stats separately
  const loadStats = useCallback(async () => {
    const calculateStats = (salesData: Sale[]) => {
      const today = new Date().toISOString().split("T")[0];
      const totalRevenue = salesData.reduce(
        (sum, sale) => sum + (sale.totalAmount || 0),
        0
      );

      const todaySales = salesData.filter((s) =>
        s.createdAt?.startsWith(today)
      );

      const uniqueCustomers = new Set(
        salesData
          .map((s) => s.customerPhone || s.customerId || s.customerName)
          .filter(Boolean)
      );

      const totalItemsSold = salesData.reduce(
        (sum, sale) =>
          sum +
          (sale.items?.reduce(
            (itemSum, item) => itemSum + (item.quantity || 0),
            0
          ) || 0),
        0
      );

      const onlineSalesCount = salesData.filter(
        (s) => !(s as any)._source || (s as any)._source !== "offline"
      ).length;
      const offlineSalesCount = salesData.filter(
        (s) => (s as any)._source === "offline"
      ).length;

      return {
        totalSales: salesData.length,
        totalRevenue,
        averageSaleValue:
          salesData.length > 0 ? totalRevenue / salesData.length : 0,
        totalCustomers: uniqueCustomers.size,
        itemsSold: totalItemsSold,
        todaySales: todaySales.length,
        todayRevenue: todaySales.reduce(
          (sum, sale) => sum + (sale.totalAmount || 0),
          0
        ),
        onlineSales: onlineSalesCount,
        offlineSales: offlineSalesCount,
      };
    };

    if (syncStatus.isOnline && apiWrapper) {
      try {
        const result = await apiWrapper.get(
          `/api/centers/${center.id}/sales/stats`
        );

        if (result.success && result.data) {
          const newStats: SalesStats = {
            totalSales: result.data.totalSales || 0,
            totalRevenue: result.data.totalRevenue || 0,
            averageSaleValue: result.data.averageSaleValue || 0,
            totalCustomers: result.data.totalCustomers || 0,
            itemsSold: result.data.itemsSold || 0,
            todaySales: result.data.todaySales || 0,
            todayRevenue: result.data.todayRevenue || 0,
            onlineSales: result.data.onlineSales || 0,
            offlineSales: result.data.offlineSales || offlineSales.length,
          };

          setStats(newStats);
          statsRef.current = newStats;
          return;
        }
      } catch (err) {
        console.error("Failed to load stats from server:", err);
      }
    }

    // Calculate stats from local data
    const localStats = calculateStats(salesRef.current);
    setStats(localStats);
    statsRef.current = localStats;
  }, [apiWrapper, center.id, offlineSales.length, syncStatus.isOnline]);

  // Initial load
  useEffect(() => {
    loadSalesData();
    loadStats();
  }, []);

  // Handle filter changes
  useEffect(() => {
    if (apiWrapper || offlineSales.length > 0) {
      setCurrentPage(1);
      loadSalesData(1);
      loadStats();
    }
  }, [
    dateFilter,
    startDate,
    endDate,
    paymentFilter,
    statusFilter,
    sortBy,
    sortOrder,
    viewMode,
  ]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadSalesData(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
        };
      case "PENDING":
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
        };
      case "CANCELLED":
        return {
          color: "bg-rose-50 text-rose-700 border-rose-200",
          icon: XCircle,
        };
      case "REFUNDED":
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: RefreshCw,
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: FileText,
        };
    }
  };

  // Get payment color and icon
  const getPaymentConfig = (method: string) => {
    switch (method?.toUpperCase()) {
      case "CASH":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: DollarSign,
        };
      case "CARD":
        return {
          color: "bg-blue-50 text-blue-700 border-blue-200",
          icon: CreditCard,
        };
      case "TRANSFER":
        return {
          color: "bg-violet-50 text-violet-700 border-violet-200",
          icon: TrendingUp,
        };
      case "POS":
        return {
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: CreditCard,
        };
      case "INSURANCE":
        return {
          color: "bg-teal-50 text-teal-700 border-teal-200",
          icon: CheckSquare,
        };
      case "DOZA_TAB":
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: FileText,
        };
      default:
        return {
          color: "bg-gray-50 text-gray-700 border-gray-200",
          icon: CreditCard,
        };
    }
  };

  // Handle view sale
  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  // Handle print receipt
  const handlePrintReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setShowReceipt(true);
  };

  // Handle delete sale
  const handleDeleteSale = async (saleId: string) => {
    if (!apiWrapper && syncStatus.isOnline) {
      setError("Cannot delete sale while offline");
      return;
    }

    try {
      setLoading(true);

      if (syncStatus.isOnline && apiWrapper) {
        // Online deletion
        const result = await apiWrapper.delete(
          `/api/centers/${center.id}/sales/${saleId}`
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to delete sale");
        }
      }

      // Remove from local state regardless of online/offline
      setSales((prev) => prev.filter((s) => s.id !== saleId));
      setOnlineSales((prev) => prev.filter((s) => s.id !== saleId));

      // Also remove from offline storage if it exists there
      const updatedOfflineSales = offlineSales.filter((s) => s.id !== saleId);
      saveOfflineSales(updatedOfflineSales);

      setShowDeleteConfirm(null);

      // Reload stats
      await loadStats();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to delete sale");
    } finally {
      setLoading(false);
    }
  };

  // Export sales data
  const handleExport = async () => {
    try {
      const dataToExport = sales.map((sale) => ({
        "Sale Number": sale.saleNumber || "N/A",
        Date: formatDate(sale.createdAt || ""),
        Customer: sale.customerName || sale.customerId || "Walk-in",
        Phone: sale.customerPhone || "N/A",
        Items: sale.items?.length || 0,
        Quantity:
          sale.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        Subtotal: sale.subTotal || 0,
        Discount: sale.discountAmount || 0,
        Tax: sale.taxAmount || 0,
        Total: sale.totalAmount || 0,
        "Payment Method": sale.paymentMethod || "CASH",
        Status: sale.status || "COMPLETED",
        "Sold By": sale.soldByName || user.fullName || "Staff",
        Source: (sale as any)._source === "offline" ? "Offline" : "Online",
        "Last Synced": (sale as any).syncedAt
          ? formatDate((sale as any).syncedAt)
          : "Never",
      }));

      const csvHeaders = Object.keys(dataToExport[0] || {}).join(",");
      const csvRows = dataToExport.map((row) =>
        Object.values(row)
          .map((value) =>
            typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          )
          .join(",")
      );

      const csvContent = [csvHeaders, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sales_${center.centerName.replace(/\s+/g, "_")}_${format(
          new Date(),
          "yyyy-MM-dd"
        )}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as Error;
      setError("Failed to export sales data");
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalSalesCount / itemsPerPage);

  // Manual sync function
  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      setError("Cannot sync while offline");
      return;
    }
    await syncOfflineSales();
  };

  // Render sync status badge
  const renderSyncStatus = () => {
    if (syncStatus.syncInProgress) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span className="hidden sm:inline">Syncing...</span>
        </div>
      );
    }

    if (!syncStatus.isOnline) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
          <WifiOff className="w-3 h-3" />
          <span className="hidden sm:inline">Offline</span>
        </div>
      );
    }

    if (syncStatus.hasPendingChanges) {
      return (
        <button
          onClick={handleManualSync}
          disabled={syncStatus.syncInProgress}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-full text-sm font-medium transition-colors"
        >
          <Cloud className="w-3 h-3" />
          <span className="hidden sm:inline">
            {syncStatus.offlineSalesCount} pending
          </span>
          <span className="sm:hidden">{syncStatus.offlineSalesCount}</span>
        </button>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
        <Check className="w-3 h-3" />
        <span className="hidden sm:inline">Synced</span>
        {syncStatus.lastSync && (
          <span className="hidden md:inline">
            {formatDisplayDate(syncStatus.lastSync)}
          </span>
        )}
      </div>
    );
  };

  // Calculate pagination display range
  const getPaginationRange = () => {
    const maxVisible = isMobile ? 3 : 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Mobile sales item view
  const MobileSaleItem = ({ sale }: { sale: Sale }) => {
    const statusConfig = getStatusConfig(sale.status || "COMPLETED");
    const paymentConfig = getPaymentConfig(sale.paymentMethod || "CASH");
    const StatusIcon = statusConfig.icon;
    const PaymentIcon = paymentConfig.icon;
    const isOffline = (sale as any)._source === "offline";

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-semibold text-gray-900 text-base">
              {sale.saleNumber || `SALE-${sale.id?.slice(-8)}`}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(sale.createdAt || new Date().toISOString())}
            </p>
          </div>
          {isOffline && (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Database className="w-3 h-3" />
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-900">
              {sale.customerName || sale.customerId || "Walk-in Customer"}
            </p>
            {sale.customerPhone && (
              <p className="text-sm text-gray-600">{sale.customerPhone}</p>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {sale.items?.length || 0} items •{" "}
              {sale.items?.reduce(
                (sum, item) => sum + (item.quantity || 0),
                0
              ) || 0}{" "}
              units
            </div>
            <div className="font-bold text-gray-900 text-lg">
              {formatCurrency(sale.totalAmount || 0)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PaymentIcon className="w-3 h-3 text-gray-500" />
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${paymentConfig.color}`}
            >
              {sale.paymentMethod || "CASH"}
            </span>
            <StatusIcon className="w-3 h-3 text-gray-500 ml-2" />
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusConfig.color}`}
            >
              {sale.status || "COMPLETED"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              by {sale.soldByName || user.fullName || "Staff"}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewSale(sale)}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="View Details"
                disabled={loading}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePrintReceipt(sale)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Print Receipt"
                disabled={loading}
              >
                <Printer className="w-4 h-4" />
              </button>
              {sale.status === "PENDING" && (
                <button
                  onClick={() => setShowDeleteConfirm(sale.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Cancel Sale"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Filter Toggle */}
      {isMobile && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView("list")}
              className={`p-2 rounded-lg ${
                currentView === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView("grid")}
              className={`p-2 rounded-lg ${
                currentView === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header with Sync Status */}
      {!isMobile && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Receipt className="w-6 h-6 text-emerald-600" />
              </div>
              <h1
                className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                Sales History
              </h1>
              {renderSyncStatus()}
            </div>
            <p className={`text-gray-600 ${poppins.className}`}>
              Track and analyze all pharmacy transactions
              {!syncStatus.isOnline && (
                <span className="ml-2 text-amber-600 font-medium">
                  • Working offline
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(["all", "online", "offline"] as const).map((mode) => (
                <button
                  key={`desktop-viewmode-${mode}`}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors flex items-center gap-1 ${
                    viewMode === mode
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {mode === "online" ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span className="hidden sm:inline">Online</span>
                    </>
                  ) : mode === "offline" ? (
                    <>
                      <Database className="w-3 h-3" />
                      <span className="hidden sm:inline">Offline</span>
                    </>
                  ) : (
                    "All"
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => loadSalesData(currentPage)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-500 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline text-gray-500">Refresh</span>
            </button>

            <button
              onClick={handleExport}
              disabled={loading || sales.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            title: "Total Revenue",
            value: formatCurrency(stats.totalRevenue),
            subValue: `Today: ${formatCurrency(stats.todayRevenue)}`,
            icon: DollarSign,
            color: "emerald",
            count: stats.todaySales,
            countLabel: "sales",
          },
          {
            title: "Total Sales",
            value: stats.totalSales,
            subValue: "Avg sale value",
            subValue2: formatCurrency(stats.averageSaleValue),
            icon: ShoppingBag,
            color: "blue",
          },
          {
            title: "Customers",
            value: stats.totalCustomers,
            subValue: `Online: ${stats.onlineSales}`,
            subValue2: `Offline: ${stats.offlineSales}`,
            icon: Users,
            color: "violet",
          },
          {
            title: "Items Sold",
            value: stats.itemsSold,
            subValue: `Across ${stats.totalSales} transactions`,
            icon: Package,
            color: "amber",
          },
        ].map((stat, index) => (
          <div
            key={`stat-card-${index}`}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-xs sm:text-sm text-gray-500 font-medium ${poppins.className}`}
                >
                  {stat.title}
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold text-gray-900 mt-1 ${bebasNeue.className}`}
                >
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center`}
              >
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100">
              <div
                className={`text-xs sm:text-sm text-gray-500 ${poppins.className}`}
              >
                {stat.subValue}
                {stat.subValue2 && (
                  <span className="block text-emerald-600 font-medium mt-1">
                    {stat.subValue2}
                  </span>
                )}
                {stat.count && (
                  <span className="block text-emerald-600 font-medium">
                    {stat.count} {stat.countLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Card - Desktop */}
      {!isMobile && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3
                className={`text-lg sm:text-xl font-semibold text-gray-900 ${bebasNeue.className}`}
              >
                Filter Sales
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays className="w-4 h-4" />
                <span className={`${poppins.className}`}>
                  {dateFilter === "custom" && startDate && endDate
                    ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(
                        endDate
                      )}`
                    : dateFilter === "today"
                    ? "Today"
                    : dateFilter === "week"
                    ? "Last 7 days"
                    : dateFilter === "month"
                    ? "Last 30 days"
                    : "All time"}
                </span>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by sale number, customer, phone, or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-500 text-gray-600 ${poppins.className} text-base`}
                disabled={loading}
              />
            </div>

            {/* Quick Date Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(["today", "week", "month", "all"] as const).map((period) => (
                <button
                  key={`desktop-quickfilter-${period}`}
                  onClick={() => {
                    setDateFilter(period);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    poppins.className
                  } ${
                    dateFilter === period
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {period}
                </button>
              ))}
              <button
                onClick={() => {
                  setDateFilter("custom");
                  setCurrentPage(1);
                }}
                disabled={loading}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  poppins.className
                } ${
                  dateFilter === "custom"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Custom</span>
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Custom Date Range */}
              {dateFilter === "custom" && (
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium text-gray-700 mb-1.5 ${poppins.className}`}
                      >
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) =>
                            handleStartDateChange(e.target.value)
                          }
                          max={endDate || getMaxDate()}
                          className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-gray-600 ${poppins.className} text-base`}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium text-gray-700 mb-1.5 ${poppins.className}`}
                      >
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          max={getMaxDate()}
                          min={startDate}
                          className={`w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white text-gray-600 ${poppins.className} text-base`}
                          disabled={loading}
                        />
                      </div>
                      {endDate && isAfter(new Date(endDate), new Date()) && (
                        <p
                          className={`mt-1 text-xs text-amber-600 ${poppins.className}`}
                        >
                          End date cannot be in the future
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Filter */}
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1.5 ${poppins.className}`}
                >
                  Payment Method
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                  className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white disabled:opacity-50 text-gray-600 ${poppins.className} text-base`}
                >
                  <option value="all">All Payment Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="POS">POS</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="DOZA_TAB">Doza Tab</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1.5 ${poppins.className}`}
                >
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  disabled={loading}
                  className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white disabled:opacity-50 text-gray-600 ${poppins.className} text-base`}
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label
                  className={`text-sm font-medium text-gray-700 ${poppins.className}`}
                >
                  Sort by:
                </label>
                <div className="flex gap-2">
                  {(["date", "amount", "items"] as const).map((sort) => (
                    <button
                      key={`desktop-sort-${sort}`}
                      onClick={() => {
                        if (sortBy === sort) {
                          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                        } else {
                          setSortBy(sort);
                          setSortOrder("desc");
                        }
                        setCurrentPage(1);
                      }}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors flex items-center gap-1 ${
                        poppins.className
                      } ${
                        sortBy === sort
                          ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {sort === "date"
                        ? "Date"
                        : sort === "amount"
                        ? "Amount"
                        : "Items"}
                      {sortBy === sort && (
                        <span className="text-xs">
                          {sortOrder === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {!syncStatus.isOnline && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  <span className={poppins.className}>
                    Offline - changes will sync when back online
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Display */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3
                className={`text-lg sm:text-xl font-semibold text-gray-900 ${bebasNeue.className}`}
              >
                Sales Records
              </h3>
              <p className={`text-sm text-gray-600 mt-1 ${poppins.className}`}>
                Showing {sales.length} of {totalSalesCount} sales
                {stats.onlineSales > 0 && ` • ${stats.onlineSales} online`}
                {stats.offlineSales > 0 && ` • ${stats.offlineSales} offline`}
              </p>
            </div>
            {loading && (
              <div
                className={`flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg ${poppins.className}`}
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                Loading sales...
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="p-6 sm:p-8 text-center">
            <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14 text-rose-400 mx-auto mb-4" />
            <h4
              className={`text-lg font-semibold text-gray-900 mb-2 ${bebasNeue.className}`}
            >
              Unable to Load Sales
            </h4>
            <p
              className={`text-gray-600 mb-4 max-w-md mx-auto ${poppins.className}`}
            >
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => loadSalesData(currentPage)}
                className={`px-5 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium ${poppins.className}`}
              >
                Retry Loading
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium ${poppins.className}`}
              >
                Refresh Page
              </button>
            </div>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6 sm:p-10 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-5">
              <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h4
              className={`text-xl font-semibold text-gray-900 mb-2 ${bebasNeue.className}`}
            >
              No sales found
            </h4>
            <p
              className={`text-gray-600 max-w-sm mx-auto mb-6 ${poppins.className}`}
            >
              {searchTerm ||
              dateFilter !== "all" ||
              paymentFilter !== "all" ||
              statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : loading
                ? "Loading sales data..."
                : "Start making sales to see them appear here."}
            </p>
            {!loading && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("all");
                  setPaymentFilter("all");
                  setStatusFilter("all");
                  setViewMode("all");
                }}
                className={`px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium ${poppins.className}`}
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Grid View */}
            {isMobile && currentView === "grid" && (
              <div className="p-4">
                {sales
                  .slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )
                  .map((sale) => (
                    <MobileSaleItem
                      key={`mobile-sale-${
                        sale.id || sale.saleNumber || Math.random()
                      }`}
                      sale={sale}
                    />
                  ))}
              </div>
            )}

            {/* Desktop Table / Mobile List View */}
            {(!isMobile || currentView === "list") && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Sale Details
                      </th>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Customer
                      </th>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Items
                      </th>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Amount
                      </th>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Payment & Status
                      </th>
                      <th
                        className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${bebasNeue.className}`}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((sale) => {
                        const statusConfig = getStatusConfig(
                          sale.status || "COMPLETED"
                        );
                        const paymentConfig = getPaymentConfig(
                          sale.paymentMethod || "CASH"
                        );
                        const StatusIcon = statusConfig.icon;
                        const PaymentIcon = paymentConfig.icon;
                        const isOffline = (sale as any)._source === "offline";

                        return (
                          <tr
                            key={`sale-row-${
                              sale.id || sale.saleNumber || Math.random()
                            }`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`font-semibold text-gray-900 text-sm sm:text-base ${bebasNeue.className}`}
                                  >
                                    {sale.saleNumber ||
                                      `SALE-${sale.id?.slice(-8)}`}
                                  </div>
                                  {isOffline && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                                      <Database className="w-3 h-3" />
                                      <span className="hidden sm:inline">
                                        Offline
                                      </span>
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`text-sm text-gray-500 ${poppins.className}`}
                                >
                                  {formatDate(
                                    sale.createdAt || new Date().toISOString()
                                  )}
                                </div>
                                <div
                                  className={`text-xs text-gray-400 ${poppins.className}`}
                                >
                                  by{" "}
                                  {sale.soldByName || user.fullName || "Staff"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="space-y-1.5">
                                <div
                                  className={`font-medium text-gray-900 text-sm sm:text-base ${bebasNeue.className}`}
                                >
                                  {sale.customerName ||
                                    sale.customerId ||
                                    "Walk-in Customer"}
                                </div>
                                {sale.customerPhone && (
                                  <div
                                    className={`text-sm text-gray-500 ${poppins.className}`}
                                  >
                                    {sale.customerPhone}
                                  </div>
                                )}
                                {sale.dozaUserId && (
                                  <div
                                    className={`text-xs text-emerald-600 font-medium flex items-center gap-1 ${poppins.className}`}
                                  >
                                    <CheckSquare className="w-3 h-3" />
                                    Doza User
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="space-y-1.5">
                                <div
                                  className={`text-sm font-medium text-gray-900 ${bebasNeue.className}`}
                                >
                                  {sale.items?.length || 0} items
                                </div>
                                <div
                                  className={`text-xs text-gray-500 ${poppins.className}`}
                                >
                                  {sale.items?.reduce(
                                    (sum, item) => sum + (item.quantity || 0),
                                    0
                                  ) || 0}{" "}
                                  units
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="space-y-1.5">
                                <div
                                  className={`font-bold text-gray-900 text-base sm:text-lg ${bebasNeue.className}`}
                                >
                                  {formatCurrency(sale.totalAmount || 0)}
                                </div>
                                {sale.discountAmount &&
                                  sale.discountAmount > 0 && (
                                    <div
                                      className={`text-sm text-gray-600 ${poppins.className}`}
                                    >
                                      -{formatCurrency(sale.discountAmount)}
                                    </div>
                                  )}
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <PaymentIcon className="w-3 h-3" />
                                  <span
                                    className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${paymentConfig.color} ${poppins.className}`}
                                  >
                                    {sale.paymentMethod || "CASH"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="w-3 h-3" />
                                  <span
                                    className={`inline-flex px-2 sm:px-3 py-1 text-xs font-medium rounded-full border ${statusConfig.color} ${poppins.className}`}
                                  >
                                    {sale.status || "COMPLETED"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewSale(sale)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="View Details"
                                  disabled={loading}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handlePrintReceipt(sale)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Print Receipt"
                                  disabled={loading}
                                >
                                  <Printer className="w-4 h-4" />
                                </button>

                                {sale.status === "PENDING" && (
                                  <button
                                    onClick={() =>
                                      setShowDeleteConfirm(sale.id)
                                    }
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Cancel Sale"
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className={`text-sm text-gray-700 ${poppins.className}`}>
                    Showing{" "}
                    <span className="font-medium">
                      {Math.min(
                        (currentPage - 1) * itemsPerPage + 1,
                        totalSalesCount
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, totalSalesCount)}
                    </span>{" "}
                    of <span className="font-medium">{totalSalesCount}</span>{" "}
                    sales
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newPage = Math.max(1, currentPage - 1);
                        setCurrentPage(newPage);
                        loadSalesData(newPage);
                      }}
                      disabled={currentPage === 1 || loading}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {getPaginationRange().map((pageNum) => (
                        <button
                          key={`pagination-${pageNum}`}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            loadSalesData(pageNum);
                          }}
                          disabled={loading}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-sm font-medium transition-colors ${
                            poppins.className
                          } ${
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "text-gray-700 hover:bg-gray-100"
                          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const newPage = Math.min(totalPages, currentPage + 1);
                        setCurrentPage(newPage);
                        loadSalesData(newPage);
                      }}
                      disabled={currentPage === totalPages || loading}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sale Details Modal */}
      {showSaleDetails && selectedSale && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-4 sm:p-6 md:p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
                <div>
                  <h3
                    className={`text-xl sm:text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
                  >
                    Sale Details
                  </h3>
                  <p
                    className={`text-gray-600 mt-1 text-sm sm:text-base ${poppins.className}`}
                  >
                    Complete transaction information
                  </p>
                </div>
                <button
                  onClick={() => setShowSaleDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* Sale Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium text-gray-500 ${poppins.className}`}
                    >
                      Sale Number
                    </label>
                    <p
                      className={`font-semibold text-gray-900 text-base sm:text-lg ${bebasNeue.className}`}
                    >
                      {selectedSale.saleNumber ||
                        `SALE-${selectedSale.id?.slice(-8)}`}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium text-gray-500 ${poppins.className}`}
                    >
                      Date & Time
                    </label>
                    <p
                      className={`font-semibold text-gray-900 text-sm sm:text-base ${poppins.className}`}
                    >
                      {formatDate(
                        selectedSale.createdAt || new Date().toISOString()
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium text-gray-500 ${poppins.className}`}
                    >
                      Customer
                    </label>
                    <p
                      className={`font-semibold text-gray-900 text-sm sm:text-base ${bebasNeue.className}`}
                    >
                      {selectedSale.customerName ||
                        selectedSale.customerId ||
                        "Walk-in Customer"}
                    </p>
                    {selectedSale.customerPhone && (
                      <p
                        className={`text-sm text-gray-600 ${poppins.className}`}
                      >
                        {selectedSale.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium text-gray-500 ${poppins.className}`}
                    >
                      Sold By
                    </label>
                    <p
                      className={`font-semibold text-gray-900 text-sm sm:text-base ${bebasNeue.className}`}
                    >
                      {selectedSale.soldByName || user.fullName || "Staff"}
                    </p>
                    {(selectedSale as any)._source === "offline" && (
                      <p
                        className={`text-xs text-amber-600 font-medium flex items-center gap-1 ${poppins.className}`}
                      >
                        <Database className="w-3 h-3" />
                        Offline Sale
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Section */}
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h4
                    className={`font-semibold text-gray-900 text-lg mb-4 ${bebasNeue.className}`}
                  >
                    Items Purchased ({selectedSale.items?.length || 0})
                  </h4>
                  <div className="space-y-3">
                    {selectedSale.items?.map((item) => (
                      <div
                        key={`sale-item-${item.id || Math.random()}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 gap-3"
                      >
                        <div className="flex-1">
                          <p
                            className={`font-medium text-gray-900 ${bebasNeue.className}`}
                          >
                            {item.name || "Unknown Product"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                            <span className={poppins.className}>
                              Qty: {item.quantity || 0}
                            </span>
                            <span className={poppins.className}>
                              × {formatCurrency(item.unitPrice || 0)}
                            </span>
                            {item.batchNumber && (
                              <span
                                className={`text-xs bg-gray-100 px-2 py-1 rounded ${poppins.className}`}
                              >
                                Batch: {item.batchNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold text-gray-900 text-lg ${bebasNeue.className}`}
                          >
                            {formatCurrency(item.subtotal || item.total || 0)}
                          </p>
                          {item.discountAmount && item.discountAmount > 0 && (
                            <p
                              className={`text-sm text-amber-600 ${poppins.className}`}
                            >
                              -{formatCurrency(item.discountAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="bg-emerald-50 rounded-xl p-4 sm:p-6">
                  <h4
                    className={`font-semibold text-emerald-900 text-lg mb-4 ${bebasNeue.className}`}
                  >
                    Payment Summary
                  </h4>
                  <div className="space-y-3 max-w-md">
                    <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                      <span className={`text-emerald-700 ${poppins.className}`}>
                        Subtotal
                      </span>
                      <span
                        className={`font-semibold text-emerald-900 ${bebasNeue.className}`}
                      >
                        {formatCurrency(selectedSale.subTotal || 0)}
                      </span>
                    </div>
                    {selectedSale.discountAmount &&
                      selectedSale.discountAmount > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span
                            className={`text-amber-600 ${poppins.className}`}
                          >
                            Discount
                          </span>
                          <span
                            className={`font-semibold text-amber-600 ${bebasNeue.className}`}
                          >
                            -{formatCurrency(selectedSale.discountAmount)}
                          </span>
                        </div>
                      )}
                    {selectedSale.taxEnabled &&
                      selectedSale.taxAmount &&
                      selectedSale.taxAmount > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-emerald-100">
                          <span
                            className={`text-blue-600 ${poppins.className}`}
                          >
                            Tax (7.5%)
                          </span>
                          <span
                            className={`font-semibold text-blue-600 ${bebasNeue.className}`}
                          >
                            {formatCurrency(selectedSale.taxAmount)}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between items-center py-2 border-t border-emerald-200 pt-4">
                      <span
                        className={`text-lg font-bold text-emerald-900 ${bebasNeue.className}`}
                      >
                        Total
                      </span>
                      <span
                        className={`text-xl sm:text-2xl font-bold text-emerald-900 ${bebasNeue.className}`}
                      >
                        {formatCurrency(selectedSale.totalAmount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mt-6 pt-6 border-t border-emerald-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label
                          className={`text-sm font-medium text-emerald-700 ${poppins.className}`}
                        >
                          Payment Method
                        </label>
                        <p
                          className={`font-semibold text-emerald-900 text-lg mt-1 ${bebasNeue.className}`}
                        >
                          {selectedSale.paymentMethod || "CASH"}
                        </p>
                      </div>
                      <div>
                        <label
                          className={`text-sm font-medium text-emerald-700 ${poppins.className}`}
                        >
                          Amount Paid
                        </label>
                        <p
                          className={`font-semibold text-emerald-900 text-lg mt-1 ${bebasNeue.className}`}
                        >
                          {formatCurrency(selectedSale.amountPaid || 0)}
                        </p>
                        {selectedSale.changeAmount &&
                          selectedSale.changeAmount > 0 && (
                            <p
                              className={`text-sm text-emerald-600 mt-1 ${poppins.className}`}
                            >
                              Change:{" "}
                              {formatCurrency(selectedSale.changeAmount)}
                            </p>
                          )}
                      </div>
                    </div>
                    {selectedSale.paymentReference && (
                      <div className="mt-4">
                        <label
                          className={`text-sm font-medium text-emerald-700 ${poppins.className}`}
                        >
                          Reference
                        </label>
                        <p
                          className={`font-medium text-emerald-900 mt-1 ${poppins.className}`}
                        >
                          {selectedSale.paymentReference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setShowSaleDetails(false)}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium ${poppins.className} text-sm sm:text-base`}
                  disabled={loading}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowSaleDetails(false);
                    handlePrintReceipt(selectedSale);
                  }}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center gap-2 ${poppins.className} text-sm sm:text-base`}
                  disabled={loading}
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Trash2 className="w-7 h-7 sm:w-8 sm:h-8 text-rose-600" />
              </div>

              <h3
                className={`text-lg sm:text-xl font-bold text-gray-900 mb-3 ${bebasNeue.className}`}
              >
                Cancel Sale
              </h3>
              <p
                className={`text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base ${poppins.className}`}
              >
                Are you sure you want to cancel this sale? This action cannot be
                undone and will remove the sale from your records.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium ${poppins.className} text-sm sm:text-base`}
                  disabled={loading}
                >
                  Keep Sale
                </button>
                <button
                  onClick={() => handleDeleteSale(showDeleteConfirm)}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium ${poppins.className} text-sm sm:text-base`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </span>
                  ) : (
                    "Cancel Sale"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryTab;
