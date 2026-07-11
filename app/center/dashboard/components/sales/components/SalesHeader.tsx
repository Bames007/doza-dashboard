// app/center/components/sales/components/SalesHeader.tsx
"use client";

import { FC } from "react";
import { ShoppingCart, Scan, Plus, X, History, Menu } from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface SalesHeaderProps {
  scanning: boolean;
  setScanning: (scanning: boolean) => void;
  onNewSale: () => void;
  activeTab: "pos" | "history";
  onTabChange: (tab: "pos" | "history") => void;
}

const SalesHeader: FC<SalesHeaderProps> = ({
  scanning,
  setScanning,
  onNewSale,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="rounded-xl top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Main Header */}
      <div className="p-3 sm:p-4">
        {/* Title Section */}
        <div className="mb-3 sm:mb-0">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight ${bebasNeue.className}`}
              >
                Pharmacy POS
              </h1>
              <p className={`text-sm text-gray-500 mt-1 ${poppins.className}`}>
                Scan, sell, and manage transactions
              </p>
            </div>

            {/* Mobile Menu Button */}
            <button className="sm:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs & Actions Container */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Tab Switcher */}
          <div className="relative w-full">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => onTabChange("pos")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "pos"
                    ? "bg-white text-gray-900 shadow-sm scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">POS</span>
              </button>
              <button
                onClick={() => onTabChange("history")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === "history"
                    ? "bg-white text-gray-900 shadow-sm scale-[1.02]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">History</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          {activeTab === "pos" && (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              {/* Scan Button */}
              <button
                onClick={() => setScanning(!scanning)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 ${
                  scanning
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {scanning ? (
                  <>
                    <X className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      Stop Scan
                    </span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium truncate">
                      Scan
                    </span>
                  </>
                )}
              </button>

              {/* New Sale Button */}
              <button
                onClick={onNewSale}
                className="flex items-center justify-center gap-2 px-3 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  New Sale
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Tab Indicator */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500 animate-pulse" />

      {/* Quick Stats Bar */}
      <div className="bg-gray-50 border-t border-gray-100 px-3 py-2 hidden sm:flex">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="font-medium">Today:</span>
            <span className="font-bold text-emerald-600">₦0.00</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="font-medium">Sales:</span>
            <span className="font-bold text-gray-900">0</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="flex items-center gap-1">
            <span className="font-medium">Items:</span>
            <span className="font-bold text-gray-900">0</span>
          </div>
        </div>
      </div>

      {/* Mobile Quick Stats */}
      <div className="sm:hidden border-t border-gray-200">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="text-center flex-1">
              <div className="text-gray-500">Today</div>
              <div className="font-bold text-emerald-600">₦0.00</div>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-center flex-1">
              <div className="text-gray-500">Sales</div>
              <div className="font-bold text-gray-900">0</div>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-center flex-1">
              <div className="text-gray-500">Items</div>
              <div className="font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesHeader;
