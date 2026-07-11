"use client";

import { X } from "lucide-react";
import { Supplier } from "../../../types/pharmacy";
import { ModalWrapper } from "../ModalWrapper";

interface SupplierFormData {
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: string;
  notes: string;
}

interface SupplierFormModalProps {
  supplierForm: SupplierFormData;
  selectedSupplier: Supplier | null;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: keyof SupplierFormData, value: string) => void;
}

export const SupplierFormModal = ({
  supplierForm,
  selectedSupplier,
  onClose,
  onSave,
  onFormChange,
}: SupplierFormModalProps) => {
  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-2xl mx-auto shadow-2xl">
        <div className="border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                {selectedSupplier ? "Edit Supplier" : "Add Supplier"}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                {selectedSupplier?.code || "Enter supplier details"}
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

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierForm.code}
                onChange={(e) => onFormChange("code", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="e.g., SUP001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierForm.name}
                onChange={(e) => onFormChange("name", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierForm.contactPerson}
                onChange={(e) => onFormChange("contactPerson", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={supplierForm.phone}
                onChange={(e) => onFormChange("phone", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
                placeholder="+234 800 000 0000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => onFormChange("email", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="supplier@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={supplierForm.address}
                onChange={(e) => onFormChange("address", e.target.value)}
                rows={2}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Enter complete address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={supplierForm.city}
                onChange={(e) => onFormChange("city", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={supplierForm.state}
                onChange={(e) => onFormChange("state", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="State"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <input
                type="text"
                value={supplierForm.paymentTerms}
                onChange={(e) => onFormChange("paymentTerms", e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., Net 30, COD, 50% Advance"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={supplierForm.notes}
                onChange={(e) => onFormChange("notes", e.target.value)}
                rows={3}
                className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Additional notes about this supplier..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all"
            >
              {selectedSupplier ? "Update Supplier" : "Add Supplier"}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
