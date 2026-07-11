import { FC } from "react";
import { User, UserCheck, X, Phone, MapPin, CreditCard } from "lucide-react";
import { Customer } from "../../../types/pharmacy";

interface CustomerSectionProps {
  selectedCustomer: Customer | null;
  selectedDozaUser: any | null;
  onOpenDozaUser: () => void;
  onClearCustomer: () => void;
  formatCurrency: (amount: number) => string;
}

const CustomerSection: FC<CustomerSectionProps> = ({
  selectedCustomer,
  selectedDozaUser,
  onOpenDozaUser,
  onClearCustomer,
  formatCurrency,
}) => {
  return (
    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200/60">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900">
          {selectedDozaUser ? "Doza User" : "Customer"}
        </h2>
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={onOpenDozaUser}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-all"
          >
            <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Doza
          </button>
          <button
            onClick={() => alert("Customer form will be implemented here")}
            className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium"
          >
            + New
          </button>
        </div>
      </div>

      {selectedDozaUser ? (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-gray-900">
                {selectedDozaUser.fullName} (Doza User)
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                {selectedDozaUser.dozaCode}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <Phone className="w-3 h-3 inline mr-1" />
                {selectedDozaUser.phone}
              </p>
            </div>
            <button
              onClick={onClearCustomer}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-2 sm:p-3">
            <div className="grid grid-cols-2 gap-1 sm:gap-2">
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  <CreditCard className="w-3 h-3 inline mr-1" />
                  Credit Limit
                </p>
                <p className="text-sm sm:text-lg font-bold text-blue-700">
                  {formatCurrency(selectedDozaUser.creditLimit || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">
                  Current Balance
                </p>
                <p className="text-sm sm:text-lg font-bold text-blue-700">
                  {formatCurrency(selectedDozaUser.currentBalance || 0)}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-1 sm:mt-2">
              Sale will be added to Doza Tab
            </p>
          </div>
        </div>
      ) : selectedCustomer ? (
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm sm:text-base font-medium text-gray-900">
                {selectedCustomer.fullName}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <Phone className="w-3 h-3 inline mr-1" />
                {selectedCustomer.phone}
              </p>
              {selectedCustomer.address && (
                <p className="text-xs sm:text-sm text-gray-600">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {selectedCustomer.address}
                </p>
              )}
            </div>
            <button
              onClick={onClearCustomer}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <div className="bg-blue-50 rounded-lg p-1.5 sm:p-2">
              <p className="text-xs text-blue-600 font-medium">
                Loyalty Points
              </p>
              <p className="text-sm sm:text-lg font-bold text-blue-700">
                {selectedCustomer.loyaltyPoints || 0}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-1.5 sm:p-2">
              <p className="text-xs text-emerald-600 font-medium">
                Total Spent
              </p>
              <p className="text-sm sm:text-lg font-bold text-emerald-700">
                {formatCurrency(selectedCustomer.totalSpent || 0)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-3 sm:py-4">
          <User className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            No customer selected
          </p>
          <div className="flex flex-col gap-1 sm:gap-2">
            <button
              onClick={onOpenDozaUser}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
            >
              <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Scan Doza user code
            </button>
            <button
              onClick={() => alert("Customer form will be implemented here")}
              className="text-emerald-600 hover:text-emerald-700 text-xs sm:text-sm font-medium"
            >
              + Add new customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSection;
