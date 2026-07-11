// app/center/components/sales/components/ActionButtons.tsx
import { FC } from "react";
import { Check, CreditCard, Receipt, Printer, Loader2 } from "lucide-react";
import { Sale } from "../../../types/pharmacy";

interface DozaUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  balance?: number;
}

interface ActionButtonsProps {
  loading: boolean;
  sale: Sale;
  selectedDozaUser: DozaUser | null;
  paymentAmount: number;
  onCompleteSale: () => void;
  onViewReceipt: () => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({
  loading,
  sale,
  selectedDozaUser,
  paymentAmount,
  onCompleteSale,
  onViewReceipt,
}) => {
  const isSaleEmpty = !sale.items || sale.items.length === 0;
  const totalAmount = sale.totalAmount || 0;
  const amountPaid = paymentAmount || 0;
  const canCompleteSale =
    !isSaleEmpty && (selectedDozaUser || amountPaid >= totalAmount);
  const changeAmount = selectedDozaUser
    ? 0
    : Math.max(0, amountPaid - totalAmount);

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Mobile Compact View */}
      <div className="lg:hidden space-y-2">
        {/* Change Display - Mobile */}
        {!selectedDozaUser && amountPaid > 0 && totalAmount > 0 && (
          <div
            className={`p-3 rounded-xl ${
              changeAmount > 0
                ? "bg-amber-50 border border-amber-200"
                : "bg-emerald-50 border border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                {changeAmount > 0 ? "Change Due" : "Exact Amount"}
              </span>
              <span
                className={`font-bold ${
                  changeAmount > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {changeAmount > 0 ? `+${changeAmount.toLocaleString()}` : "✓"}
              </span>
            </div>
          </div>
        )}

        {/* Complete Sale Button - Mobile */}
        <button
          onClick={onCompleteSale}
          disabled={!canCompleteSale || loading || sale.status === "COMPLETED"}
          className={`w-full py-3 md:py-4 rounded-xl font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
            !canCompleteSale || sale.status === "COMPLETED"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : sale.status === "COMPLETED" ? (
            <>
              <Check className="w-5 h-5" />
              Sale Completed
            </>
          ) : selectedDozaUser ? (
            <>
              <CreditCard className="w-5 h-5" />
              Charge Doza Tab
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Complete Sale
            </>
          )}
        </button>

        {/* Secondary Actions - Mobile */}
        {sale.status === "COMPLETED" && (
          <button
            onClick={onViewReceipt}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Receipt className="w-5 h-5" />
            View Receipt
          </button>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block space-y-3">
        {/* Change Display - Desktop */}
        {!selectedDozaUser && amountPaid > 0 && totalAmount > 0 && (
          <div
            className={`p-4 rounded-xl ${
              changeAmount > 0
                ? "bg-amber-50 border border-amber-200"
                : "bg-emerald-50 border border-emerald-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600">
                {changeAmount > 0 ? "Change Due" : "Exact Amount"}
              </span>
              <span
                className={`text-xl font-bold ${
                  changeAmount > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {changeAmount > 0 ? `+${changeAmount.toLocaleString()}` : "✓"}
              </span>
            </div>
            {changeAmount > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Return {changeAmount.toLocaleString()} to customer
              </p>
            )}
          </div>
        )}

        {/* Complete Sale Button - Desktop */}
        <button
          onClick={onCompleteSale}
          disabled={!canCompleteSale || loading || sale.status === "COMPLETED"}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-colors duration-200 flex items-center justify-center gap-3 ${
            !canCompleteSale || sale.status === "COMPLETED"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processing Sale...
            </>
          ) : sale.status === "COMPLETED" ? (
            <>
              <Check className="w-6 h-6" />
              Sale Completed Successfully
            </>
          ) : selectedDozaUser ? (
            <>
              <CreditCard className="w-6 h-6" />
              Charge Doza Tab Account
            </>
          ) : (
            <>
              <CreditCard className="w-6 h-6" />
              Complete Sale & Print Receipt
            </>
          )}
        </button>

        {/* Secondary Actions - Desktop */}
        {sale.status === "COMPLETED" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onViewReceipt}
              className="py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              View Receipt
            </button>
            <button
              onClick={() => window.print()}
              className="py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs md:text-sm text-gray-500 text-center pt-2">
        {isSaleEmpty && <p>Add items to cart to enable checkout</p>}
        {!isSaleEmpty && !selectedDozaUser && amountPaid < totalAmount && (
          <p>Enter payment amount to complete sale</p>
        )}
        {selectedDozaUser && (
          <p>This sale will be charged to the Doza Tab account</p>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
