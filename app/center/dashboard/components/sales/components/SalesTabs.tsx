// app/center/components/sales/components/SalesTabs.tsx
import { FC } from "react";
import { ShoppingCart, X, Check } from "lucide-react";
import { Sale } from "../../../types/pharmacy";

interface SalesTabsProps {
  activeSales: Sale[];
  selectedSaleIndex: number;
  onSelectSale: (index: number) => void;
  onDeleteSale: (index: number) => void;
}

const SalesTabs: FC<SalesTabsProps> = ({
  activeSales,
  selectedSaleIndex,
  onSelectSale,
  onDeleteSale,
}) => {
  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-2">
      {activeSales.map((sale, index) => (
        <div
          key={sale.id || `sale-tab-${index}`} // Added fallback key
          className="flex items-center gap-0.5 sm:gap-1"
        >
          <button
            onClick={() => onSelectSale(index)}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-l-xl transition-all duration-200 ${
              selectedSaleIndex === index
                ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium">
              Sale {index + 1}
            </span>
            {sale.status === "PENDING" && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full ml-1"></span>
            )}
            {sale.status === "COMPLETED" && (
              <Check className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
            )}
          </button>

          {sale.status === "PENDING" && activeSales.length > 1 && (
            <button
              onClick={() => onDeleteSale(index)}
              className="px-2 sm:px-3 py-2 sm:py-2.5 bg-red-500 text-white rounded-r-xl hover:bg-red-600 transition-all duration-200"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default SalesTabs;
