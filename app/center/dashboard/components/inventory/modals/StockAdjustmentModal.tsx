"use client";

import { useState } from "react";
import { X, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { ModalWrapper } from "../ModalWrapper";

interface StockAdjustmentData {
  productName: string;
  currentQuantity: number;
  newQuantity: number;
  unit: string;
  reason: string;
  notes: string;
}

interface StockAdjustmentModalProps {
  stockAdjustment: StockAdjustmentData;
  onClose: () => void;
  onSave: () => void;
  onAdjustmentChange: (
    field: keyof StockAdjustmentData,
    value: string | number
  ) => void;
}

export const StockAdjustmentModal = ({
  stockAdjustment,
  onClose,
  onSave,
  onAdjustmentChange,
}: StockAdjustmentModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave();
    } finally {
      setLoading(false);
    }
  };

  const difference =
    stockAdjustment.newQuantity - stockAdjustment.currentQuantity;

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        <div className="border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
                Adjust Stock
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">
                {stockAdjustment.productName || "Product"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Current Stock Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Current Stock
                </p>
                <p className="text-xs text-blue-600">Available quantity</p>
              </div>
              <div className="text-right">
                <div className="text-2xl md:text-3xl font-bold text-blue-800">
                  {stockAdjustment.currentQuantity}
                </div>
                <p className="text-xs text-blue-600 mt-0.5">
                  {stockAdjustment.unit || "units"}
                </p>
              </div>
            </div>
          </div>

          {/* New Quantity Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              New Quantity <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={stockAdjustment.newQuantity}
                onChange={(e) =>
                  onAdjustmentChange(
                    "newQuantity",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                min="0"
                required
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <span className="text-gray-500">
                  {stockAdjustment.unit || "units"}
                </span>
              </div>
            </div>
          </div>

          {/* Difference Indicator */}
          <div
            className={`rounded-xl p-4 transition-all ${
              difference === 0
                ? "bg-gray-50"
                : difference > 0
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {difference > 0 ? (
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : difference < 0 ? (
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-800">
                    {difference > 0
                      ? "Stock Increase"
                      : difference < 0
                      ? "Stock Decrease"
                      : "No Change"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.abs(difference)} units{" "}
                    {difference > 0 ? "added" : difference < 0 ? "removed" : ""}
                  </p>
                </div>
              </div>
              <div
                className={`text-xl font-bold ${
                  difference > 0
                    ? "text-emerald-600"
                    : difference < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {difference > 0 ? "+" : ""}
                {difference}
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Adjustment Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={stockAdjustment.reason}
              onChange={(e) => onAdjustmentChange("reason", e.target.value)}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            >
              <option value="">Select Reason</option>
              <option value="INITIAL_STOCK">Initial Stock</option>
              <option value="PURCHASE_ORDER">Purchase Order</option>
              <option value="SALE">Sale</option>
              <option value="RETURN">Customer Return</option>
              <option value="DAMAGED">Damaged Goods</option>
              <option value="EXPIRED">Expired</option>
              <option value="THEFT">Theft/Loss</option>
              <option value="ADJUSTMENT">Manual Adjustment</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Notes
            </label>
            <textarea
              value={stockAdjustment.notes}
              onChange={(e) => onAdjustmentChange("notes", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Enter adjustment details, reference numbers, or additional information..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                stockAdjustment.newQuantity ===
                  stockAdjustment.currentQuantity ||
                !stockAdjustment.reason
              }
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Adjustment"
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
