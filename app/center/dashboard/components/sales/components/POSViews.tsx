// app/center/components/sales/components/POSView.tsx
"use client";

import { FC, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Center, User as UserType } from "@/app/center/type";
import { ApiWrapper } from "@/app/utils/apiWrapper";
import BarcodeScanner from "./BarcodeScanner";
import CartItems from "./CartItems";
import SalesTabs from "./SalesTabs";
import CustomerSection from "./CustomerSection";
import ProductQuickAdd from "./ProductQuickAdd";
import OrderSummary from "./OrderSummary";
import PaymentSection from "./PaymentSection";
import ActionButtons from "./ActionButtons";
import ProductSearchModal from "../modals/ProductSearchModal";
import DozaUserSearchModal from "../modals/DozaUserSearchModal";
import ReceiptModal from "../modals/ReceiptModal";
import { Sale, Product, Customer } from "../../../types/pharmacy";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface PaymentDetails {
  amountPaid: number;
  paymentMethod:
    | "CASH"
    | "CARD"
    | "TRANSFER"
    | "POS"
    | "INSURANCE"
    | "DOZA_TAB";
  reference: string;
}

interface DozaUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  balance?: number;
}

interface POSViewProps {
  scanning: boolean;
  setScanning: (scanning: boolean) => void;
  showProductSearch: boolean;
  setShowProductSearch: (show: boolean) => void;
  showDozaUser: boolean;
  setShowDozaUser: (show: boolean) => void;
  showReceipt: boolean;
  setShowReceipt: (show: boolean) => void;
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  activeSales: Sale[];
  selectedSaleIndex: number;
  currentSale: Sale;
  paymentDetails: PaymentDetails;
  selectedCustomer: Customer | null;
  selectedDozaUser: DozaUser | null;
  products: Product[];
  filteredProducts: Product[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
  customers: Customer[];
  customersLoading: boolean;
  customersError: string | null;
  center: Center;
  user: UserType;
  apiWrapper: ApiWrapper | null;
  onNewSale: () => void;
  onDeleteSale: (index: number) => void;
  onAddProduct: (product: Product) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (itemId: string, discountPercentage: number) => void;
  onToggleTax: () => void;
  onCompleteSale: () => Promise<void>;
  onSetPaymentDetails: (details: PaymentDetails) => void;
  onSetSelectedSaleIndex: (index: number) => void;
  onSetSelectedCustomer: (customer: Customer | null) => void;
  onSetSelectedDozaUser: (user: DozaUser | null) => void;
  onSetSearchTerm: (term: string) => void;
  onLoadProducts: () => Promise<void>;
  onLoadCustomers: () => Promise<void>;
  onProductSearch: (term: string) => Promise<Product | null>;
  onGetAvailableProductCount: (productId: string) => number;
  onDozaUserSelect: (user: DozaUser) => Promise<void>;
}

const POSView: FC<POSViewProps> = ({
  scanning,
  setScanning,
  showProductSearch,
  setShowProductSearch,
  showDozaUser,
  setShowDozaUser,
  showReceipt,
  setShowReceipt,
  globalLoading,
  setGlobalLoading,
  activeSales,
  selectedSaleIndex,
  currentSale,
  paymentDetails,
  selectedCustomer,
  selectedDozaUser,
  products,
  filteredProducts,
  searchTerm,
  loading,
  error,
  customers,
  customersLoading,
  customersError,
  center,
  user,
  apiWrapper,
  onNewSale,
  onDeleteSale,
  onAddProduct,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onToggleTax,
  onCompleteSale,
  onSetPaymentDetails,
  onSetSelectedSaleIndex,
  onSetSelectedCustomer,
  onSetSelectedDozaUser,
  onSetSearchTerm,
  onLoadProducts,
  onLoadCustomers,
  onProductSearch,
  onGetAvailableProductCount,
  onDozaUserSelect,
}) => {
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  }, []);

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) {
      alert("Please enter a barcode");
      return;
    }
    const product = await onProductSearch(barcode);
    if (product) {
      onAddProduct(product);
      setScanning(false);
    }
  };

  const handleDozaUserSelectWrapper = async (user: DozaUser) => {
    await onDozaUserSelect(user);
    setShowDozaUser(false);
  };

  const handleCompleteSaleWrapper = async () => {
    setGlobalLoading(true);
    try {
      await onCompleteSale();
      setShowReceipt(true);
      await onLoadProducts();
    } catch (error: unknown) {
      const err = error as Error;
      alert(err.message || "Failed to complete sale");
    } finally {
      setGlobalLoading(false);
    }
  };

  const refreshData = async () => {
    setGlobalLoading(true);
    try {
      await Promise.all([onLoadProducts(), onLoadCustomers()]);
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {(error || customersError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-1">
              <h3
                className={`text-sm font-medium text-red-800 ${bebasNeue.className}`}
              >
                Data Loading Error
              </h3>
              <div className={`mt-2 text-sm text-red-700 ${poppins.className}`}>
                {error && <p>Products: {error}</p>}
                {customersError && <p>Customers: {customersError}</p>}
              </div>
              <button
                onClick={refreshData}
                className={`mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${poppins.className}`}
              >
                Retry Loading Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      {scanning && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Active Sales Tabs */}
      <SalesTabs
        activeSales={activeSales}
        selectedSaleIndex={selectedSaleIndex}
        onSelectSale={onSetSelectedSaleIndex}
        onDeleteSale={onDeleteSale}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="space-y-3 sm:space-y-4">
          <CustomerSection
            selectedCustomer={selectedCustomer}
            selectedDozaUser={selectedDozaUser}
            onOpenDozaUser={() => setShowDozaUser(true)}
            onClearCustomer={() => {
              onSetSelectedCustomer(null);
              onSetSelectedDozaUser(null);
            }}
            formatCurrency={formatCurrency}
          />

          {loading ? (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/60">
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200/60">
              <div className="text-center py-6 text-gray-500">
                <p className={`${poppins.className}`}>
                  Failed to load products
                </p>
                <button
                  onClick={onLoadProducts}
                  className={`mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium ${poppins.className}`}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <ProductQuickAdd
              products={filteredProducts.slice(0, 5)}
              onAddProduct={(product) => {
                onAddProduct(product);
              }}
              onOpenSearch={() => setShowProductSearch(true)}
              getAvailableProductCount={onGetAvailableProductCount}
              formatCurrency={formatCurrency}
            />
          )}
        </div>

        {/* Middle Column */}
        <CartItems
          sale={currentSale}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onApplyDiscount={onApplyDiscount}
          selectedDozaUser={selectedDozaUser}
          formatCurrency={formatCurrency}
          getAvailableProductCount={onGetAvailableProductCount}
        />

        {/* Right Column */}
        <div className="space-y-3 sm:space-y-4">
          <OrderSummary
            sale={currentSale}
            onToggleTax={onToggleTax}
            formatCurrency={formatCurrency}
          />

          {!selectedDozaUser && (
            <PaymentSection
              paymentDetails={paymentDetails}
              onChange={onSetPaymentDetails}
              sale={currentSale}
              formatCurrency={formatCurrency}
            />
          )}

          <ActionButtons
            loading={globalLoading}
            sale={currentSale}
            selectedDozaUser={selectedDozaUser}
            paymentAmount={paymentDetails.amountPaid}
            onCompleteSale={handleCompleteSaleWrapper}
            onViewReceipt={() => setShowReceipt(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showProductSearch && (
          <ProductSearchModal
            isOpen={showProductSearch}
            onClose={() => setShowProductSearch(false)}
            products={filteredProducts}
            searchTerm={searchTerm}
            onSearchChange={onSetSearchTerm}
            onAddProduct={(product) => {
              onAddProduct(product);
              setShowProductSearch(false);
            }}
            getAvailableProductCount={onGetAvailableProductCount}
            formatCurrency={formatCurrency}
          />
        )}

        {showDozaUser && (
          <DozaUserSearchModal
            isOpen={showDozaUser}
            onClose={() => setShowDozaUser(false)}
            onSelectUser={handleDozaUserSelectWrapper}
            centerId={center.id}
            userId={user.id}
          />
        )}

        {showReceipt && currentSale.status === "COMPLETED" && (
          <ReceiptModal
            isOpen={showReceipt}
            onClose={() => setShowReceipt(false)}
            sale={currentSale}
            center={center}
            user={user}
            customer={selectedCustomer}
            dozaUser={selectedDozaUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default POSView;
