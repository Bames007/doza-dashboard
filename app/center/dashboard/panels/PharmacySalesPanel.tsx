// app/center/components/sales/PharmacySalesPanel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Center, User as UserType } from "@/app/center/type";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import { useCustomers } from "../hooks/useCustomers";
import SalesHeader from "../components/sales/components/SalesHeader";
import SalesTabs from "../components/sales/components/SalesTabs";
import { ApiWrapper } from "@/app/utils/apiWrapper";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Package,
  TrendingUp,
  Users,
  Shield,
} from "lucide-react";
import SalesHistoryTab from "../components/sales/components/SalesHistory";
import POSView from "../components/sales/components/POSViews";

interface PharmacySalesPanelProps {
  center: Center;
  user: UserType;
}

const PharmacySalesPanel = ({ center, user }: PharmacySalesPanelProps) => {
  const [apiWrapper, setApiWrapper] = useState<ApiWrapper | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showDozaUser, setShowDozaUser] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pos" | "history">("pos");
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySales: 0,
    availableProducts: 0,
    activeCustomers: 0,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const wrapper = new ApiWrapper({
      userId: user.id,
      centerId: center.id,
      offlineFirst: true,
    });
    setApiWrapper(wrapper);
  }, [center.id, user.id]);

  const {
    products,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    loading: productsLoading,
    error: productsError,
    loadProducts,
    handleProductSearch,
    getAvailableProductCount,
    updateProductQuantity,
  } = useProducts(center.id, user.id, apiWrapper);

  const {
    activeSales,
    selectedSaleIndex,
    currentSale,
    paymentDetails,
    handleNewSale,
    handleDeleteSale,
    handleAddProduct,
    handleUpdateQuantity,
    handleRemoveItem,
    handleApplyDiscount,
    handleToggleTax,
    handleCompleteSale,
    setPaymentDetails,
    setSelectedSaleIndex,
  } = useSales({
    center,
    user,
    apiWrapper,
    updateProductQuantity,
    getAvailableProductCount,
  });

  const {
    customers,
    selectedCustomer,
    selectedDozaUser,
    loading: customersLoading,
    loadCustomers,
    setSelectedCustomer,
    setSelectedDozaUser,
  } = useCustomers(center.id, user.id, apiWrapper);
  const customersError: string | null = null;

  // Load data with improved error handling
  useEffect(() => {
    const initializeData = async () => {
      setGlobalLoading(true);
      try {
        await Promise.all([loadProducts(), loadCustomers()]);

        // Calculate stats
        const productCount = products.length;
        const customerCount = customers.length;
        const today = new Date().toISOString().split("T")[0];
        const todaySales = activeSales.filter((sale) =>
          sale.createdAt?.startsWith(today),
        ).length;
        const todayRevenue = todaySales * 1000; // Mock calculation

        setStats({
          todayRevenue,
          todaySales,
          availableProducts: productCount,
          activeCustomers: customerCount,
        });
      } catch (error) {
        console.error("❌ Error loading data:", error);
      } finally {
        setGlobalLoading(false);
      }
    };

    if (apiWrapper) {
      initializeData();
    }
  }, [apiWrapper, center.id]);

  // Handle Doza user selection
  const handleDozaUserSelect = async (dozaUser: any) => {
    setSelectedDozaUser(dozaUser);
    setSelectedCustomer(null);
    setShowDozaUser(false);
  };

  const handleCompleteSaleWrapper = async () => {
    setGlobalLoading(true);
    try {
      await handleCompleteSale({
        selectedCustomer,
        selectedDozaUser,
        paymentDetails,
        onSuccess: () => {
          setShowReceipt(true);
          loadProducts();
          setSelectedCustomer(null);
          setSelectedDozaUser(null);
        },
      });
    } catch (error: any) {
      alert(error.message || "Failed to complete sale");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setGlobalLoading(true);
    try {
      await Promise.all([loadProducts(), loadCustomers()]);
    } finally {
      setGlobalLoading(false);
    }
  };

  // Format currency helper
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Loading state
  if (globalLoading && products.length === 0 && customers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <ShoppingBag className="w-10 h-10 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              Loading Pharmacy System
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Initializing sales dashboard and loading inventory...
            </p>
          </div>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Loading Products</span>
            </span>
            <span className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Loading Customers</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* Top Navigation Bar */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-sm">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {center.centerName}
                </h1>
                <p className="text-xs text-gray-600">Pharmacy Sales System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Online Status */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-emerald-700">
                  Online
                </span>
              </div>

              {/* Quick Stats */}
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Today</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                </div>
                <div className="h-8 w-px bg-gray-200"></div>
                <div className="text-center">
                  <p className="text-gray-600">Products</p>
                  <p className="font-bold text-gray-900">
                    {stats.availableProducts}
                  </p>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={globalLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all duration-200"
              >
                <RefreshCw
                  className={`w-4 h-4 ${globalLoading ? "animate-spin" : ""}`}
                />
                <span className="text-sm font-medium hidden sm:inline">
                  Refresh
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert */}
        <AnimatePresence>
          {(productsError || customersError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800">
                      Data Loading Error
                    </h3>
                    <div className="mt-1 text-sm text-red-700 space-y-1">
                      {productsError && <p>• {productsError}</p>}
                      {customersError && <p>• {customersError}</p>}
                    </div>
                    <button
                      onClick={refreshData}
                      className="mt-3 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Loading Data
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {activeTab === "pos" ? "Point of Sale" : "Sales History"}
              </h2>
              <p className="text-gray-600 mt-1">
                {activeTab === "pos"
                  ? "Process customer transactions quickly and efficiently"
                  : "Track and analyze your pharmacy sales performance"}
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:flex md:space-x-4 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs min-w-[140px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Today's Sales</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatCurrency(stats.todayRevenue)}
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs min-w-[140px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Products</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {stats.availableProducts}
                    </p>
                  </div>
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="relative">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl max-w-md">
              <button
                onClick={() => setActiveTab("pos")}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "pos"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>POS System</span>
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Sales History</span>
              </button>
            </div>

            {/* Active Tab Indicator */}
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500"
              style={{
                width: "50%",
                left: activeTab === "pos" ? "0%" : "50%",
              }}
            />
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {activeTab === "pos" ? (
              <div className="p-6">
                <POSView
                  scanning={scanning}
                  setScanning={setScanning}
                  showProductSearch={showProductSearch}
                  setShowProductSearch={setShowProductSearch}
                  showDozaUser={showDozaUser}
                  setShowDozaUser={setShowDozaUser}
                  showReceipt={showReceipt}
                  setShowReceipt={setShowReceipt}
                  globalLoading={globalLoading}
                  setGlobalLoading={setGlobalLoading}
                  activeSales={activeSales}
                  selectedSaleIndex={selectedSaleIndex}
                  currentSale={currentSale}
                  paymentDetails={paymentDetails}
                  selectedCustomer={selectedCustomer}
                  selectedDozaUser={selectedDozaUser}
                  products={products}
                  filteredProducts={filteredProducts}
                  searchTerm={searchTerm}
                  loading={productsLoading}
                  error={productsError}
                  customers={customers}
                  customersLoading={customersLoading}
                  customersError={customersError}
                  center={center}
                  user={user}
                  apiWrapper={apiWrapper}
                  onNewSale={handleNewSale}
                  onDeleteSale={handleDeleteSale}
                  onAddProduct={handleAddProduct}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onApplyDiscount={handleApplyDiscount}
                  onToggleTax={handleToggleTax}
                  onCompleteSale={handleCompleteSaleWrapper}
                  onSetPaymentDetails={setPaymentDetails}
                  onSetSelectedSaleIndex={setSelectedSaleIndex}
                  onSetSelectedCustomer={setSelectedCustomer}
                  onSetSelectedDozaUser={setSelectedDozaUser}
                  onSetSearchTerm={setSearchTerm}
                  onLoadProducts={loadProducts}
                  onLoadCustomers={loadCustomers}
                  onProductSearch={handleProductSearch}
                  onGetAvailableProductCount={getAvailableProductCount}
                  onDozaUserSelect={handleDozaUserSelect}
                />
              </div>
            ) : (
              <SalesHistoryTab
                center={center}
                user={user}
                apiWrapper={apiWrapper}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {activeTab === "pos"
              ? "Press F2 to start scanning • F3 to new sale • F4 to open calculator"
              : "Last updated: Just now • All data is encrypted and secure"}
          </p>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab("pos")}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg ${
                activeTab === "pos"
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-medium">POS</span>
            </button>

            <button
              onClick={() => setScanning(!scanning)}
              className="flex flex-col items-center space-y-1 px-4 py-2 rounded-lg text-blue-600"
            >
              <div
                className={`w-10 h-10 rounded-full ${scanning ? "bg-blue-600" : "bg-blue-100"} flex items-center justify-center`}
              >
                {scanning ? (
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                ) : (
                  <div className="w-5 h-5 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <span className="text-xs font-medium">Scan</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg ${
                activeTab === "history"
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-gray-600"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs font-medium">History</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacySalesPanel;
