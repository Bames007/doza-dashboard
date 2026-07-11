// app/center/components/sales/components/PaymentSection.tsx
"use client";

import { FC } from "react";
import { Sale } from "../../../types/pharmacy";

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

interface PaymentSectionProps {
  paymentDetails: PaymentDetails;
  onChange: (details: PaymentDetails) => void;
  sale: Sale;
  formatCurrency: (amount: number) => string;
}

const PaymentSection: FC<PaymentSectionProps> = ({
  paymentDetails,
  onChange,
  sale,
  formatCurrency,
}) => {
  const handleAmountPaidChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    onChange({ ...paymentDetails, amountPaid: amount });
  };

  const handlePaymentMethodChange = (
    method: PaymentDetails["paymentMethod"]
  ) => {
    onChange({ ...paymentDetails, paymentMethod: method });
  };

  const handleReferenceChange = (reference: string) => {
    onChange({ ...paymentDetails, reference });
  };

  // Calculate change automatically
  const changeAmount = Math.max(
    0,
    (paymentDetails.amountPaid || 0) - (sale.totalAmount || 0)
  );

  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200/60">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
        Payment
      </h2>

      <div className="space-y-2 sm:space-y-3">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {["CASH", "CARD", "POS", "TRANSFER"].map((method) => (
              <button
                key={method}
                type="button"
                onClick={() =>
                  handlePaymentMethodChange(
                    method as PaymentDetails["paymentMethod"]
                  )
                }
                className={`p-1.5 sm:p-2 rounded-lg border transition-all duration-200 text-xs sm:text-sm ${
                  paymentDetails.paymentMethod === method
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                    : "border-gray-300 text-gray-700 hover:border-emerald-300 hover:bg-gray-50"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Amount Paid
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              ₦
            </span>
            <input
              type="number"
              value={paymentDetails.amountPaid || ""}
              onChange={(e) => handleAmountPaidChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          {sale.totalAmount > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Due: {formatCurrency(sale.totalAmount)}
            </div>
          )}
        </div>

        {paymentDetails.paymentMethod !== "CASH" && (
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={paymentDetails.reference}
              onChange={(e) => handleReferenceChange(e.target.value)}
              className="w-full px-3 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              placeholder="Enter reference"
            />
          </div>
        )}

        {(paymentDetails.amountPaid || 0) > 0 && (
          <div
            className={`rounded-lg p-2 sm:p-3 ${
              changeAmount > 0
                ? "bg-blue-50 border border-blue-200"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Change Due:
              </span>
              <span
                className={`text-sm sm:text-base font-bold ${
                  changeAmount > 0 ? "text-blue-700" : "text-gray-700"
                }`}
              >
                {formatCurrency(changeAmount)}
              </span>
            </div>
            {changeAmount > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Customer will receive {formatCurrency(changeAmount)} as change
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSection;
