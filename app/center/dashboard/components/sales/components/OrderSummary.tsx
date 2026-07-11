// app/center/components/sales/components/OrderSummary.tsx
"use client";

import { FC } from "react";
import { Sale } from "../../../types/pharmacy";

interface OrderSummaryProps {
  sale: Sale;
  onToggleTax: () => void;
  formatCurrency: (amount: number) => string;
}

const OrderSummary: FC<OrderSummaryProps> = ({
  sale,
  onToggleTax,
  formatCurrency,
}) => {
  // Ensure we have valid numbers
  const subTotal = sale.subTotal || 0;
  const discountAmount = sale.discountAmount || 0;
  const taxAmount = sale.taxEnabled ? sale.taxAmount || 0 : 0;
  const totalAmount = sale.totalAmount || 0;

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200/60 sticky top-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Order Summary
        </h2>
        <button
          onClick={onToggleTax}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            sale.taxEnabled
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          }`}
        >
          {sale.taxEnabled ? "Tax: ON" : "Tax: OFF"}
        </button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Subtotal:</span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(subTotal)}
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Discount:</span>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        {sale.taxEnabled && taxAmount > 0 && (
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">
                Tax ({sale.taxAmount || 7.5}%):
              </span>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {formatCurrency(taxAmount)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-300 pt-2 sm:pt-3 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-bold text-gray-900">
              Total:
            </span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Payment info if any */}
        {(sale.amountPaid || 0) > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(sale.amountPaid || 0)}
              </span>
            </div>
            {(sale.changeAmount || 0) > 0 && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Change:</span>
                <span className="font-medium text-blue-700">
                  {formatCurrency(sale.changeAmount || 0)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
