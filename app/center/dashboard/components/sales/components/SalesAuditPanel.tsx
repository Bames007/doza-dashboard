// app/center/components/sales/audit/SalesAuditPanel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Calendar,
  User,
  TrendingUp,
  Receipt,
  Building,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Center, User as UserType } from "@/app/center/type";
import { Sale } from "../../../types/pharmacy";
import { ApiWrapper } from "@/app/utils/apiWrapper";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface SalesAuditPanelProps {
  center: Center;
  user: UserType;
}

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  salesCountByDay: Record<string, number>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

interface Filters {
  startDate: string;
  endDate: string;
  paymentMethod: string;
  minAmount: number;
  maxAmount: number;
  searchTerm: string;
}

const SalesAuditPanel = ({ center, user }: SalesAuditPanelProps) => {
  const [apiWrapper, setApiWrapper] = useState<ApiWrapper | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [filters, setFilters] = useState<Filters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0],
    paymentMethod: "all",
    minAmount: 0,
    maxAmount: 1000000,
    searchTerm: "",
  });

  useEffect(() => {
    const wrapper = new ApiWrapper({
      userId: user.id,
      centerId: center.id,
      offlineFirst: true,
    });
    setApiWrapper(wrapper);
  }, [center.id, user.id]);

  const loadSales = useCallback(async () => {
    if (!apiWrapper) return;

    setLoading(true);
    try {
      const result = await apiWrapper.get(
        `/api/centers/${center.id}/sales/audit`,
        {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }
      );

      if (result.success) {
        const salesData = result.data?.sales || [];
        setSales(salesData);
        setFilteredSales(salesData);

        // Calculate statistics
        calculateStats(salesData);
      }
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  }, [apiWrapper, center.id, filters.startDate, filters.endDate]);

  useEffect(() => {
    if (apiWrapper) {
      loadSales();
    }
  }, [apiWrapper, loadSales]);

  const calculateStats = (salesData: Sale[]) => {
    const completedSales = salesData.filter(
      (sale) => sale.status === "COMPLETED"
    );

    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const averageSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group by day
    const salesCountByDay: Record<string, number> = {};
    completedSales.forEach((sale) => {
      const date = new Date(sale.createdAt).toISOString().split("T")[0];
      salesCountByDay[date] = (salesCountByDay[date] || 0) + 1;
    });

    // Top products
    const productMap = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();
    completedSales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.productId;
        const existing = productMap.get(key) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity || 0;
        existing.revenue += (item.subtotal || 0) - (item.discountAmount || 0);
        productMap.set(key, existing);
      });
    });

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setStats({
      totalSales,
      totalRevenue,
      averageSaleValue,
      salesCountByDay,
      topProducts,
    });
  };

  const applyFilters = useCallback(() => {
    let filtered = [...sales];

    // Filter by date range
    filtered = filtered.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      return saleDate >= start && saleDate <= end;
    });

    // Filter by payment method
    if (filters.paymentMethod !== "all") {
      filtered = filtered.filter(
        (sale) => sale.paymentMethod === filters.paymentMethod
      );
    }

    // Filter by amount range
    filtered = filtered.filter((sale) => {
      const amount = sale.totalAmount || 0;
      return amount >= filters.minAmount && amount <= filters.maxAmount;
    });

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sale) =>
          sale.saleNumber.toLowerCase().includes(term) ||
          sale.customerName?.toLowerCase().includes(term) ||
          sale.soldByName?.toLowerCase().includes(term)
      );
    }

    setFilteredSales(filtered);
  }, [sales, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers = [
        "Sale Number",
        "Date",
        "Time",
        "Customer Name",
        "Customer Phone",
        "Items Count",
        "Subtotal",
        "Discount",
        "Tax",
        "Total Amount",
        "Payment Method",
        "Amount Paid",
        "Change",
        "Sold By",
        "Status",
        "Notes",
      ];

      const csvData = filteredSales.map((sale) => [
        sale.saleNumber,
        formatDate(sale.createdAt),
        new Date(sale.createdAt).toLocaleTimeString(),
        sale.customerName || "Walk-in",
        sale.customerPhone || "",
        sale.items?.length || 0,
        sale.subTotal,
        sale.discountAmount,
        sale.taxAmount,
        sale.totalAmount,
        sale.paymentMethod,
        sale.amountPaid,
        sale.changeAmount,
        sale.soldByName,
        sale.status,
        sale.notes || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sales_audit_${center.id}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    } finally {
      setExporting(false);
    }
  };

  const paginatedSales = filteredSales.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className={`text-gray-600 ${poppins.className}`}>
            Loading sales audit...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                Sales Audit & Records
              </h1>
              <p className={`text-gray-600 mt-1 ${poppins.className}`}>
                View and analyze all sales transactions for {center.centerName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 ${poppins.className}`}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 ${poppins.className}`}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by sale number, customer name, or staff..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
              }
              className={`w-full pl-10 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${poppins.className}`}
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1 ${poppins.className}`}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${poppins.className}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1 ${poppins.className}`}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${poppins.className}`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1 ${poppins.className}`}
                >
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      paymentMethod: e.target.value,
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${poppins.className}`}
                >
                  <option value="all">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="POS">POS</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="DOZA_TAB">Doza Tab</option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium text-gray-700 mb-1 ${poppins.className}`}
                >
                  Amount Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minAmount}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minAmount: Number(e.target.value),
                      }))
                    }
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${poppins.className}`}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxAmount}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxAmount: Number(e.target.value),
                      }))
                    }
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg ${poppins.className}`}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() =>
                  setFilters({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                    endDate: new Date().toISOString().split("T")[0],
                    paymentMethod: "all",
                    minAmount: 0,
                    maxAmount: 1000000,
                    searchTerm: "",
                  })
                }
                className={`px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${poppins.className}`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className={`text-sm text-gray-600 ${poppins.className}`}>
                    Total Sales
                  </p>
                  <p
                    className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
                  >
                    {stats.totalSales}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className={`text-sm text-gray-600 ${poppins.className}`}>
                    Total Revenue
                  </p>
                  <p
                    className={`text-2xl font-bold text-emerald-700 ${bebasNeue.className}`}
                  >
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className={`text-sm text-gray-600 ${poppins.className}`}>
                    Avg. Sale Value
                  </p>
                  <p
                    className={`text-2xl font-bold text-purple-700 ${bebasNeue.className}`}
                  >
                    {formatCurrency(stats.averageSaleValue)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <User className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className={`text-sm text-gray-600 ${poppins.className}`}>
                    Sales Today
                  </p>
                  <p
                    className={`text-2xl font-bold text-amber-700 ${bebasNeue.className}`}
                  >
                    {stats.salesCountByDay[
                      new Date().toISOString().split("T")[0]
                    ] || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Sale Details
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Customer
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Items
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Amount
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Payment
                  </th>
                  <th
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${bebasNeue.className}`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div
                          className={`font-medium text-gray-900 ${bebasNeue.className}`}
                        >
                          {sale.saleNumber}
                        </div>
                        <div
                          className={`text-sm text-gray-500 ${poppins.className}`}
                        >
                          {formatDateTime(sale.createdAt)}
                        </div>
                        <div
                          className={`text-xs text-gray-400 ${poppins.className}`}
                        >
                          By: {sale.soldByName}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {sale.customerName ? (
                        <div>
                          <div
                            className={`font-medium text-gray-900 ${bebasNeue.className}`}
                          >
                            {sale.customerName}
                          </div>
                          <div
                            className={`text-sm text-gray-500 ${poppins.className}`}
                          >
                            {sale.customerPhone}
                          </div>
                        </div>
                      ) : (
                        <span
                          className={`text-gray-400 italic ${poppins.className}`}
                        >
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`text-sm text-gray-900 ${bebasNeue.className}`}
                      >
                        {sale.items?.length || 0} items
                      </div>
                      {sale.items && sale.items.length > 0 && (
                        <div
                          className={`text-xs text-gray-500 truncate max-w-[200px] ${poppins.className}`}
                        >
                          {sale.items
                            .slice(0, 2)
                            .map((item) => item.name)
                            .join(", ")}
                          {sale.items.length > 2 && "..."}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`font-medium text-gray-900 ${bebasNeue.className}`}
                      >
                        {formatCurrency(sale.totalAmount || 0)}
                      </div>
                      <div
                        className={`text-xs text-gray-500 ${poppins.className}`}
                      >
                        Tax: {formatCurrency(sale.taxAmount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            poppins.className
                          } ${
                            sale.paymentMethod === "DOZA_TAB"
                              ? "bg-blue-100 text-blue-800"
                              : sale.paymentMethod === "CASH"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {sale.paymentMethod}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            poppins.className
                          } ${
                            sale.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {sale.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className={`px-3 py-1.5 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg ${poppins.className}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className={`text-gray-500 ${poppins.className}`}>
                No sales found matching your filters
              </p>
            </div>
          )}

          {/* Pagination */}
          {filteredSales.length > itemsPerPage && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className={`text-sm text-gray-700 ${poppins.className}`}>
                Showing {(page - 1) * itemsPerPage + 1} to{" "}
                {Math.min(page * itemsPerPage, filteredSales.length)} of{" "}
                {filteredSales.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 ${poppins.className}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page * itemsPerPage >= filteredSales.length}
                  className={`px-3 py-1.5 border border-gray-300 rounded disabled:opacity-50 ${poppins.className}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
                    >
                      Sale Details
                    </h2>
                    <p className={`text-gray-600 ${poppins.className}`}>
                      {selectedSale.saleNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Sale details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div>
                      <h3
                        className={`text-sm font-medium text-gray-500 mb-1 ${poppins.className}`}
                      >
                        Transaction Info
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p
                              className={`text-xs text-gray-500 ${poppins.className}`}
                            >
                              Date & Time
                            </p>
                            <p className={`font-medium ${bebasNeue.className}`}>
                              {formatDateTime(selectedSale.createdAt)}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-xs text-gray-500 ${poppins.className}`}
                            >
                              Status
                            </p>
                            <p
                              className={`font-medium ${bebasNeue.className} ${
                                selectedSale.status === "COMPLETED"
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {selectedSale.status}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-xs text-gray-500 ${poppins.className}`}
                            >
                              Sold By
                            </p>
                            <p className={`font-medium ${bebasNeue.className}`}>
                              {selectedSale.soldByName}
                            </p>
                          </div>
                          <div>
                            <p
                              className={`text-xs text-gray-500 ${poppins.className}`}
                            >
                              Payment Method
                            </p>
                            <p className={`font-medium ${bebasNeue.className}`}>
                              {selectedSale.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedSale.customerName && (
                      <div>
                        <h3
                          className={`text-sm font-medium text-gray-500 mb-1 ${poppins.className}`}
                        >
                          Customer Info
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p
                            className={`font-medium text-gray-900 ${bebasNeue.className}`}
                          >
                            {selectedSale.customerName}
                          </p>
                          <p
                            className={`text-sm text-gray-600 ${poppins.className}`}
                          >
                            {selectedSale.customerPhone}
                          </p>
                          {selectedSale.customerEmail && (
                            <p
                              className={`text-sm text-gray-600 ${poppins.className}`}
                            >
                              {selectedSale.customerEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-medium text-gray-500 mb-1 ${poppins.className}`}
                    >
                      Payment Summary
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span
                            className={`text-gray-600 ${poppins.className}`}
                          >
                            Subtotal
                          </span>
                          <span
                            className={`font-medium ${bebasNeue.className}`}
                          >
                            {formatCurrency(selectedSale.subTotal || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={`text-gray-600 ${poppins.className}`}
                          >
                            Discount
                          </span>
                          <span
                            className={`font-medium text-red-600 ${bebasNeue.className}`}
                          >
                            -{formatCurrency(selectedSale.discountAmount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={`text-gray-600 ${poppins.className}`}
                          >
                            Tax ({selectedSale.taxAmount || 7.5}%)
                          </span>
                          <span
                            className={`font-medium ${bebasNeue.className}`}
                          >
                            {formatCurrency(selectedSale.taxAmount || 0)}
                          </span>
                        </div>
                        <div className="border-t border-gray-300 pt-2">
                          <div
                            className={`flex justify-between font-bold text-lg ${bebasNeue.className}`}
                          >
                            <span>Total Amount</span>
                            <span className="text-emerald-700">
                              {formatCurrency(selectedSale.totalAmount || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span
                              className={`text-gray-600 ${poppins.className}`}
                            >
                              Amount Paid
                            </span>
                            <span
                              className={`font-medium ${bebasNeue.className}`}
                            >
                              {formatCurrency(selectedSale.amountPaid || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span
                              className={`text-gray-600 ${poppins.className}`}
                            >
                              Change
                            </span>
                            <span
                              className={`font-medium ${bebasNeue.className}`}
                            >
                              {formatCurrency(selectedSale.changeAmount || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3
                    className={`text-sm font-medium text-gray-500 mb-3 ${poppins.className}`}
                  >
                    Items Purchased
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${bebasNeue.className}`}
                          >
                            Item
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${bebasNeue.className}`}
                          >
                            Quantity
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${bebasNeue.className}`}
                          >
                            Unit Price
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${bebasNeue.className}`}
                          >
                            Discount
                          </th>
                          <th
                            className={`px-4 py-3 text-left text-xs font-medium text-gray-500 ${bebasNeue.className}`}
                          >
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(selectedSale.items || []).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p
                                  className={`font-medium text-gray-900 ${bebasNeue.className}`}
                                >
                                  {item.name}
                                </p>
                                <p
                                  className={`text-xs text-gray-500 ${poppins.className}`}
                                >
                                  SKU: {item.sku}
                                </p>
                              </div>
                            </td>
                            <td className={`px-4 py-3 ${poppins.className}`}>
                              {item.quantity}
                            </td>
                            <td className={`px-4 py-3 ${poppins.className}`}>
                              {formatCurrency(item.unitPrice || 0)}
                            </td>
                            <td className="px-4 py-3">
                              <div
                                className={`text-red-600 ${poppins.className}`}
                              >
                                {item.discountPercentage > 0 &&
                                  `(${item.discountPercentage}%) `}
                                -{formatCurrency(item.discountAmount || 0)}
                              </div>
                            </td>
                            <td
                              className={`px-4 py-3 font-medium ${bebasNeue.className}`}
                            >
                              {formatCurrency(item.subtotal || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedSale.notes && (
                  <div className="mt-6">
                    <h3
                      className={`text-sm font-medium text-gray-500 mb-1 ${poppins.className}`}
                    >
                      Notes
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className={`text-gray-700 ${poppins.className}`}>
                        {selectedSale.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedSale(null)}
                    className={`px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg ${poppins.className}`}
                  >
                    Close
                  </button>
                  <button
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${poppins.className}`}
                  >
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAuditPanel;
