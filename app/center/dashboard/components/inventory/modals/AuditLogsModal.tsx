"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  User,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import { Product, InventoryAudit } from "../../../types/pharmacy";
import { ModalWrapper } from "../ModalWrapper";

interface AuditLogsModalProps {
  auditLogs: InventoryAudit[];
  selectedProduct: Product | null;
  selectedProductId: string | null;
  onClose: () => void;
}

export const AuditLogsModal = ({
  auditLogs,
  selectedProduct,
  selectedProductId,
  onClose,
}: AuditLogsModalProps) => {
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "STOCK_IN":
        return "bg-emerald-100 text-emerald-800";
      case "STOCK_OUT":
        return "bg-red-100 text-red-800";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "STOCK_IN":
        return <TrendingUp className="w-3 h-3" />;
      case "STOCK_OUT":
        return <TrendingDown className="w-3 h-3" />;
      case "ADJUSTMENT":
        return <RefreshCw className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filter !== "all" && log.action !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.reason?.toLowerCase().includes(searchLower) ||
        log.notes?.toLowerCase().includes(searchLower) ||
        log.userId?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <ModalWrapper onClose={onClose} fullScreen>
      <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900">
                Audit Logs
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5">
                {selectedProduct?.name || "Product History"}
                {selectedProductId && (
                  <span className="text-gray-400">
                    {" "}
                    • ID: {selectedProductId}
                  </span>
                )}
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

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search in logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === "all"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("STOCK_IN")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === "STOCK_IN"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Stock In
              </button>
              <button
                onClick={() => setFilter("STOCK_OUT")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === "STOCK_OUT"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Stock Out
              </button>
              <button
                onClick={() => setFilter("ADJUSTMENT")}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  filter === "ADJUSTMENT"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Adjustments
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No audit logs found
              </h3>
              <p className="text-gray-600 mb-1">
                {searchTerm || filter !== "all"
                  ? "No logs match your search criteria"
                  : "There are no audit logs for this product yet"}
              </p>
              {(searchTerm || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("all");
                  }}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">
                  Showing {filteredLogs.length} audit log
                  {filteredLogs.length !== 1 ? "s" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Latest first</span>
                </div>
              </div>

              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left Column - Action Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(
                            log.action
                          )}`}
                        >
                          {getActionIcon(log.action)}
                          {log.action.replace("_", " ")}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(log.timestamp)}
                        </span>
                        {log.userId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            <User className="w-3 h-3" />
                            {log.userId.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      {/* Quantity Changes */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Previous</p>
                          <p className="text-lg font-bold text-gray-800">
                            {log.previousQuantity || 0}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">New</p>
                          <p className="text-lg font-bold text-gray-800">
                            {log.newQuantity || 0}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">
                            Difference
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              (log.difference || 0) > 0
                                ? "text-emerald-600"
                                : (log.difference || 0) < 0
                                ? "text-red-600"
                                : "text-gray-600"
                            }`}
                          >
                            {(log.difference || 0) > 0 ? "+" : ""}
                            {log.difference || 0}
                          </p>
                        </div>
                      </div>

                      {/* Reason and Notes */}
                      {log.reason && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Reason
                          </p>
                          <p className="text-sm text-gray-900">{log.reason}</p>
                        </div>
                      )}

                      {log.notes && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-gray-600">{log.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
          >
            Close Audit Logs
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};
