import {
  Package,
  DollarSign,
  AlertTriangle,
  Stethoscope,
  Truck,
  Barcode,
  TrendingUp,
  Pill,
  Clock,
} from "lucide-react";
import { bebasNeue } from "@/app/utils/constants";

interface Statistics {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiredCount: number;
  equipmentCount: number;
  prescriptionCount: number;
}

interface StatisticsCardsProps {
  statistics: Statistics | null;
  suppliersCount: number;
  barcodedCount: number;
}

export const StatisticsCards = ({
  statistics,
  suppliersCount,
  barcodedCount,
}: StatisticsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper for abbreviated currency on mobile
  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`;
    }
    return `₦${amount}`;
  };

  return (
    <div className="space-y-3">
      {/* Mobile View - Card List */}
      <div className="lg:hidden space-y-2">
        {/* Total Products */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Products</p>
                <p
                  className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
                >
                  {statistics?.totalProducts || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <Pill className="w-3 h-3 mr-1" />
                Stock
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">Inventory Value</p>
                <p
                  className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
                >
                  {formatCurrencyCompact(statistics?.totalValue || 0)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Full: {formatCurrency(statistics?.totalValue || 0)}
          </div>
        </div>

        {/* Low Stock - Warning State */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 shadow-sm border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-amber-800">Low Stock Alert</p>
                <p
                  className={`text-xl font-bold text-amber-900 ${bebasNeue.className}`}
                >
                  {statistics?.lowStockCount || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-medium">
                <Clock className="w-3 h-3 mr-1" />
                Needs Restock
              </div>
            </div>
          </div>
        </div>

        {/* Equipment Count */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Stethoscope className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600">Medical Equipment</p>
              <p
                className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {statistics?.equipmentCount || 0}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Items</div>
            </div>
          </div>
        </div>

        {/* Suppliers & Barcoded - Combined on mobile */}
        <div className="grid grid-cols-2 gap-2">
          {/* Suppliers */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <Truck className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs text-gray-600">Suppliers</p>
              </div>
              <p
                className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {suppliersCount}
              </p>
            </div>
          </div>

          {/* Barcoded */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 rounded-lg">
                  <Barcode className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-xs text-gray-600">Barcoded</p>
              </div>
              <p
                className={`text-xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {barcodedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Expired Items (if exists) */}
        {statistics?.expiredCount && statistics.expiredCount > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-3 shadow-sm border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-xs text-red-800">Expired Items</p>
                  <p
                    className={`text-xl font-bold text-red-900 ${bebasNeue.className}`}
                  >
                    {statistics.expiredCount}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2 py-1 bg-red-100 text-red-900 rounded-full text-xs font-medium">
                  Urgent
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop View - Grid Layout */}
      <div className="hidden lg:grid grid-cols-2 xl:grid-cols-6 gap-3">
        {/* Total Products */}
        <div className="col-span-1 xl:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                  <Pill className="w-3 h-3 mr-1" />
                  Stock
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p
                className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {statistics?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="col-span-1 xl:col-span-2 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 shadow-sm border border-emerald-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-700" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12% this month
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-emerald-800">Inventory Value</p>
              <p
                className={`text-2xl font-bold text-emerald-900 ${bebasNeue.className}`}
              >
                {formatCurrency(statistics?.totalValue || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock */}
        <div className="col-span-1 xl:col-span-1 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 shadow-sm border border-amber-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-medium">
                  <Clock className="w-3 h-3 mr-1" />
                  Needs Restock
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-amber-800">Low Stock Items</p>
              <p
                className={`text-2xl font-bold text-amber-900 ${bebasNeue.className}`}
              >
                {statistics?.lowStockCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Equipment */}
        <div className="col-span-1 xl:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <Stethoscope className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Medical Equipment</p>
              <p
                className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {statistics?.equipmentCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Suppliers */}
        <div className="col-span-1 xl:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Suppliers</p>
              <p
                className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {suppliersCount}
              </p>
            </div>
          </div>
        </div>

        {/* Barcoded */}
        <div className="col-span-1 xl:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <Barcode className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-700 font-medium">
                  {statistics?.totalProducts
                    ? Math.round(
                        (barcodedCount / statistics.totalProducts) * 100
                      )
                    : 0}
                  % Coverage
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Barcoded Items</p>
              <p
                className={`text-2xl font-bold text-gray-900 ${bebasNeue.className}`}
              >
                {barcodedCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend for Mobile */}
      <div className="lg:hidden pt-2">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Products</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Value</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
};
