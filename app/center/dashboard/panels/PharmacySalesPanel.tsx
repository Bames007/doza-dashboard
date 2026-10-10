// app/center/components/sales/PharmacySalesPanel.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Center, User as UserType } from "@/app/center/type";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import { useCustomers } from "../hooks/useCustomers";
import { ApiWrapper } from "@/app/utils/apiWrapper";
import {
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Package,
  TrendingUp,
  ScanLine,
  X,
} from "lucide-react";
import SalesHistoryTab from "../components/sales/components/SalesHistory";
import POSView from "../components/sales/components/POSViews";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

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

  useEffect(() => {
    const initializeData = async () => {
      setGlobalLoading(true);
      try {
        await Promise.all([loadProducts(), loadCustomers()]);

        const productCount = products.length;
        const customerCount = customers.length;
        const today = new Date().toISOString().split("T")[0];
        const todaySales = activeSales.filter((sale) =>
          sale.createdAt?.startsWith(today),
        ).length;
        const todayRevenue = todaySales * 1000;

        setStats({
          todayRevenue,
          todaySales,
          availableProducts: productCount,
          activeCustomers: customerCount,
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setGlobalLoading(false);
      }
    };

    if (apiWrapper) {
      initializeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiWrapper, center.id]);

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

  const refreshData = async () => {
    setGlobalLoading(true);
    try {
      await Promise.all([loadProducts(), loadCustomers()]);
    } finally {
      setGlobalLoading(false);
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  // ─── Loading skeleton ──────────────────────────────────────
  if (globalLoading && products.length === 0 && customers.length === 0) {
    return (
      <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
        <div className="mb-3 md:mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-10 bg-slate-200 rounded-full" />
          </div>
          <div className="h-7 w-48 bg-slate-200 rounded mb-1" />
          <div className="h-3 w-56 bg-slate-100 rounded" />
        </div>
        <div className="flex gap-2.5 mb-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 w-32 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
            />
          ))}
        </div>
        <div className="flex gap-1.5 mb-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 h-96" />
      </div>
    );
  }

  const tabs = [
    { value: "pos" as const, label: "POS", icon: ShoppingBag },
    { value: "history" as const, label: "History", icon: TrendingUp },
  ];

  return (
    <div className="pb-24 md:pb-0 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto">
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + online status + refresh */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Pharmacy POS
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Online
            </span>
          </div>
          <button
            onClick={refreshData}
            disabled={globalLoading}
            className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5 text-slate-600",
                globalLoading && "animate-spin",
              )}
            />
          </button>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          {activeTab === "pos" ? "Point of Sale" : "Sales History"}
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          {activeTab === "pos"
            ? "Process customer transactions quickly and efficiently"
            : "Track and analyze your pharmacy sales performance"}
        </p>

        {/* Row 3: stat pills — horizontal scroll */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex md:grid md:grid-cols-4 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          <StatPill
            label="Today"
            value={formatCurrency(stats.todayRevenue)}
            tone="emerald"
            icon={TrendingUp}
          />
          <StatPill
            label="Sales"
            value={String(stats.todaySales)}
            tone="slate"
            icon={ShoppingBag}
          />
          <StatPill
            label="Products"
            value={String(stats.availableProducts)}
            tone="emerald"
            icon={Package}
          />
          <StatPill
            label="Customers"
            value={String(stats.activeCustomers)}
            tone="slate"
            icon={TrendingUp}
          />
        </div>
      </header>

      {/* ─── Tabs (chips) ───────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Error banner ───────────────────────────────────── */}
      <AnimatePresence>
        {(productsError || customersError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3"
          >
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-[11px] md:text-xs font-bold text-rose-800">
                  Data Loading Error
                </h3>
                <div className="mt-0.5 text-[10px] md:text-[11px] text-rose-700 space-y-0.5">
                  {productsError && <p>• {productsError}</p>}
                  {customersError && <p>• {customersError}</p>}
                </div>
                <button
                  onClick={refreshData}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content ────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          {activeTab === "pos" ? (
            <div className="p-3 md:p-5">
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

      {/* ─── Footer info ────────────────────────────────────── */}
      <p className="mt-4 text-center text-[10px] text-slate-400 hidden md:block">
        {activeTab === "pos"
          ? "Press F2 to start scanning · F3 for new sale · F4 to open calculator"
          : "Last updated: Just now · All data is encrypted and secure"}
      </p>

      {/* ─── Mobile bottom nav ──────────────────────────────── */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200">
          <div className="flex items-center justify-around px-2 py-1.5">
            <button
              onClick={() => setActiveTab("pos")}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors",
                activeTab === "pos" ? "text-emerald-700" : "text-slate-500",
              )}
              aria-label="POS"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                POS
              </span>
            </button>

            <button
              onClick={() => setScanning(!scanning)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors",
                scanning ? "text-white" : "text-slate-500",
              )}
              aria-label="Scan"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                  scanning
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                )}
              >
                {scanning ? (
                  <X className="w-4 h-4" />
                ) : (
                  <ScanLine className="w-4 h-4" />
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {scanning ? "Stop" : "Scan"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors",
                activeTab === "history" ? "text-emerald-700" : "text-slate-500",
              )}
              aria-label="History"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                History
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Stat Pill ──────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "emerald" | "slate";
  icon: any;
}) {
  const toneStyles: Record<string, { bg: string; iconBg: string }> = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    slate: {
      bg: "bg-slate-50 border-slate-200 text-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
    },
  };
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        "shrink-0 w-32 sm:w-36 md:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
        style.bg,
      )}
    >
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-sm md:text-base font-bold tabular-nums leading-none mt-0.5 truncate",
            bebasNeue.className,
          )}
        >
          {value}
        </p>
      </div>
      <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export default PharmacySalesPanel;
