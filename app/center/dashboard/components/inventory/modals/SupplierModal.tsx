"use client";

import React, { useState } from "react";
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Truck,
  Grid,
  List,
  Search,
} from "lucide-react";
import { Supplier } from "../../../types/pharmacy";
import { ModalWrapper } from "../ModalWrapper";

interface SupplierModalProps {
  suppliers: Supplier[];
  onClose: () => void;
  onAddSupplier: () => void;
  onEditSupplier: (supplier: Supplier) => void;
  onDeleteSupplier?: (supplierId: string) => void;
}

export const SupplierModal = ({
  suppliers,
  onClose,
  onAddSupplier,
  onEditSupplier,
  onDeleteSupplier,
}: SupplierModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm)
  );

  const handleDelete = (
    e: React.MouseEvent,
    supplierId: string,
    supplierName: string
  ) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete "${supplierName}"? This action cannot be undone.`
      )
    ) {
      onDeleteSupplier?.(supplierId);
    }
  };

  return (
    <ModalWrapper onClose={onClose} fullScreen>
      <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                Suppliers
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                {filteredSuppliers.length} supplier
                {filteredSuppliers.length !== 1 ? "s" : ""} found
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white text-gray-600"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white text-gray-600"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Add Supplier Button */}
              <button
                onClick={onAddSupplier}
                className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Supplier</span>
                <span className="sm:hidden">Add</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers by name, contact, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No suppliers found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm
                  ? `No suppliers match "${searchTerm}"`
                  : "Get started by adding your first supplier"}
              </p>
              {!searchTerm && (
                <button
                  onClick={onAddSupplier}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-5 h-5" />
                  Add First Supplier
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="group border border-gray-200 rounded-xl p-4 md:p-5 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                  onClick={() => onEditSupplier(supplier)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Truck className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {supplier.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {supplier.contactPerson || "No contact"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSupplier(supplier);
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {onDeleteSupplier && (
                        <button
                          onClick={(e) =>
                            handleDelete(e, supplier.id, supplier.name)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 text-xs">📞</span>
                      </div>
                      <a
                        href={`tel:${supplier.phone}`}
                        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {supplier.phone}
                      </a>
                    </div>

                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 text-xs">✉️</span>
                        </div>
                        <a
                          href={`mailto:${supplier.email}`}
                          className="font-medium text-purple-600 hover:text-purple-700 hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {supplier.email}
                        </a>
                      </div>
                    )}

                    {supplier.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-gray-600 text-xs">📍</span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">
                          {supplier.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {supplier.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {supplier.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-2">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onEditSupplier(supplier)}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-indigo-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {supplier.name}
                      </h3>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditSupplier(supplier);
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onDeleteSupplier && (
                          <button
                            onClick={(e) =>
                              handleDelete(e, supplier.id, supplier.name)
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>👤</span>
                        {supplier.contactPerson || "No contact"}
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📞</span>
                        {supplier.phone}
                      </span>
                      {supplier.email && (
                        <span className="flex items-center gap-1">
                          <span>✉️</span>
                          {supplier.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
