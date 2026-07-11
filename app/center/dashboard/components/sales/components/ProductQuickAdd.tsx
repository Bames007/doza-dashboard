// app/center/components/sales/components/ProductQuickAdd.tsx
"use client";

import { FC, useMemo } from "react";
import { Search, AlertTriangle, Package } from "lucide-react";
import { Product } from "../../../types/pharmacy";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface ProductQuickAddProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onOpenSearch: () => void;
  getAvailableProductCount: (productId: string) => number;
  formatCurrency: (amount: number) => string;
}

const ProductQuickAdd: FC<ProductQuickAddProps> = ({
  products,
  onAddProduct,
  onOpenSearch,
  getAvailableProductCount,
  formatCurrency,
}) => {
  // Use memo to compute derived data and prevent unnecessary re-renders
  const quickAddProducts = useMemo(() => {
    // Filter out inactive products and sort by availability
    return products
      .filter((p) => p.isActive)
      .sort((a, b) => {
        const aStock = getAvailableProductCount(a.id);
        const bStock = getAvailableProductCount(b.id);

        // Prioritize products with stock
        if (aStock === 0 && bStock > 0) return 1;
        if (aStock > 0 && bStock === 0) return -1;

        // Then by name
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [products, getAvailableProductCount]);

  const totalInStock = useMemo(() => {
    return products.filter((p) => {
      const stock = getAvailableProductCount(p.id);
      return stock > 0 && p.isActive;
    }).length;
  }, [products, getAvailableProductCount]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = getAvailableProductCount(p.id);
      return stock > 0 && stock <= 5 && p.isActive;
    });
  }, [products, getAvailableProductCount]);

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200/60">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2
          className={`text-base sm:text-lg font-bold text-gray-900 ${bebasNeue.className}`}
        >
          Quick Add Products
        </h2>
        <span
          className={`text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full font-medium ${poppins.className}`}
        >
          {totalInStock} in stock
        </span>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        {quickAddProducts.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <p className={`text-sm text-gray-500 ${poppins.className}`}>
              No products available
            </p>
          </div>
        ) : (
          quickAddProducts.map((product) => {
            const availableStock = getAvailableProductCount(product.id);
            const isOutOfStock = availableStock <= 0;
            const isLowStock = availableStock <= 5 && availableStock > 0;

            return (
              <button
                key={product.id}
                onClick={() => {
                  if (!isOutOfStock) {
                    onAddProduct(product);
                  }
                }}
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-all duration-200 group ${
                  isOutOfStock
                    ? "opacity-60 cursor-not-allowed bg-gray-50"
                    : "hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                }`}
              >
                <div className="text-left flex-1">
                  <p
                    className={`text-xs sm:text-sm font-medium text-gray-900 truncate ${bebasNeue.className}`}
                  >
                    {product.name || "Unknown Product"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs text-gray-500 ${poppins.className}`}
                    >
                      {product.sku || "No SKU"}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                        poppins.className
                      } ${
                        isOutOfStock
                          ? "bg-red-100 text-red-700"
                          : isLowStock
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {isOutOfStock
                        ? "Out of Stock"
                        : `Stock: ${availableStock}`}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p
                    className={`text-xs sm:text-sm font-bold text-emerald-600 ${bebasNeue.className}`}
                  >
                    {formatCurrency(product.sellingPrice || 0)}
                  </p>
                  {!isOutOfStock && (
                    <span
                      className={`text-xs text-emerald-600 font-medium ${poppins.className}`}
                    >
                      Add →
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <button
        onClick={onOpenSearch}
        className={`w-full mt-3 sm:mt-4 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 active:scale-[0.98] ${poppins.className}`}
      >
        <Search className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="text-xs sm:text-sm font-medium">
          Search All Products ({products.filter((p) => p.isActive).length})
        </span>
      </button>

      {lowStockProducts.length > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p
                className={`text-xs font-medium text-yellow-800 ${bebasNeue.className}`}
              >
                Low Stock Alert
              </p>
              <p className={`text-xs text-yellow-700 ${poppins.className}`}>
                {lowStockProducts.length} product
                {lowStockProducts.length !== 1 ? "s" : ""} have low stock (≤5
                units)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductQuickAdd;
