// app/center/components/sales/components/CartItems.tsx
"use client";

import { FC, useMemo } from "react";
import { Trash2, Percent } from "lucide-react";
import { Sale, SaleItem } from "../../../types/pharmacy";

interface DozaUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  balance?: number;
}

interface CartItemsProps {
  sale: Sale;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (itemId: string, discountPercentage: number) => void;
  selectedDozaUser: DozaUser | null;
  formatCurrency: (amount: number) => string;
  getAvailableProductCount: (productId: string) => number;
}

const CartItems: FC<CartItemsProps> = ({
  sale,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  selectedDozaUser,
  formatCurrency,
  getAvailableProductCount,
}) => {
  // Memoize valid items to prevent unnecessary re-renders
  const validItems = useMemo(() => {
    return sale.items.filter(
      (item) => item && item.id && item.productId && item.quantity > 0
    );
  }, [sale.items]);

  // Memoize item stock calculations
  const itemStockInfo = useMemo(() => {
    const stock: Record<string, number> = {};
    validItems.forEach((item) => {
      if (item.productId) {
        stock[item.productId] = getAvailableProductCount(item.productId);
      }
    });
    return stock;
  }, [validItems, getAvailableProductCount]);

  const handleQuantityChange = (
    itemId: string,
    productId: string,
    newQuantity: number
  ) => {
    const availableStock = getAvailableProductCount(productId);
    const currentCartQuantity =
      validItems.find((item) => item.id === itemId)?.quantity || 0;

    // Prevent negative quantities
    const quantity = Math.max(0, newQuantity);

    // Check if we have enough stock
    if (quantity > availableStock) {
      alert(
        `Cannot set quantity to ${quantity}. Only ${availableStock} items left in stock.`
      );
      return;
    }

    onUpdateQuantity(itemId, quantity);
  };

  const handleDiscountChange = (itemId: string, discount: string) => {
    const discountValue = parseFloat(discount) || 0;
    const clampedDiscount = Math.min(100, Math.max(0, discountValue));
    onApplyDiscount(itemId, clampedDiscount);
  };

  const getStockStatus = (availableStock: number, cartQuantity: number) => {
    if (availableStock <= 0)
      return { text: "Out of Stock", color: "bg-red-100 text-red-700" };
    if (availableStock <= 5)
      return {
        text: `Low: ${availableStock}`,
        color: "bg-yellow-100 text-yellow-700",
      };
    if (cartQuantity > availableStock)
      return { text: `Exceeds stock!`, color: "bg-red-100 text-red-700" };
    return {
      text: `Stock: ${availableStock}`,
      color: "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Cart Items
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {validItems.length} items in cart
              {selectedDozaUser && " • Doza Tab"}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-xs px-1.5 py-1 bg-gray-100 text-gray-600 rounded">
              {sale.saleNumber}
            </span>
            {selectedDozaUser && (
              <span className="text-xs px-1.5 py-1 bg-blue-100 text-blue-600 rounded">
                Doza
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {validItems.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600">No items in cart</p>
            <p className="text-xs text-gray-500 mt-1">
              Scan barcode or add products to start a sale
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 flex-1 min-h-0 overflow-y-auto">
            {validItems.map((item) => {
              const availableStock = itemStockInfo[item.productId] || 0;
              const stockStatus = getStockStatus(
                availableStock,
                item.quantity || 0
              );

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-2.5 sm:p-3 transition-all duration-200 ${
                    availableStock <= 0
                      ? "border-red-200 bg-red-50/50"
                      : availableStock <= 5
                      ? "border-yellow-200 bg-yellow-50/30"
                      : "border-gray-200 hover:border-emerald-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                    <div className="flex-1 mr-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name || "Unknown Product"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          SKU: {item.sku || "N/A"}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${stockStatus.color}`}
                        >
                          {stockStatus.text}
                        </span>
                      </div>
                      {item.batchNumber && (
                        <p className="text-xs text-gray-500 mt-1">
                          Batch: {item.batchNumber}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 flex-shrink-0 p-1"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.productId,
                            (item.quantity || 1) - 1
                          )
                        }
                        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(item.quantity || 0) <= 1}
                      >
                        <span className="text-gray-600 text-sm">-</span>
                      </button>
                      <span className="w-8 sm:w-10 text-center text-gray-600 font-medium text-sm">
                        {item.quantity || 1}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.id,
                            item.productId,
                            (item.quantity || 1) + 1
                          )
                        }
                        className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors ${
                          availableStock <= item.quantity
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        disabled={availableStock <= item.quantity}
                        title={
                          availableStock <= item.quantity
                            ? `Only ${availableStock} items left`
                            : undefined
                        }
                      >
                        <span className="text-sm">+</span>
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-emerald-600">
                        {formatCurrency(item.subtotal || 0)}
                      </p>
                      {(item.discountAmount || 0) > 0 && (
                        <p className="text-xs text-amber-600">
                          -{formatCurrency(item.discountAmount || 0)} discount
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Percent className="w-3 h-3 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={item.discountPercentage || 0}
                          onChange={(e) =>
                            handleDiscountChange(item.id, e.target.value)
                          }
                          className="w-16 sm:w-20 px-2 text-gray-700 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0%"
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        Total:{" "}
                        {formatCurrency(item.total || item.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartItems;
