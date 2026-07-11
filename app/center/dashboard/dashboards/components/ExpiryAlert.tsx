"use client";

import {
  AlertTriangle,
  Package,
  Clock,
  MapPin,
  Hash,
  Box,
  CalendarX,
  XCircle,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { ExpiredDrug } from "../types";

interface ExpiryAlertProps {
  expiredDrugs: ExpiredDrug[];
  loading: boolean;
}

export default function ExpiryAlert({
  expiredDrugs,
  loading,
}: ExpiryAlertProps) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
            <Image
              alt="Doza Logo"
              src="/logo.png"
              width={40}
              height={40}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>
    );
  }

  const actuallyExpired = expiredDrugs.filter((d) => d.status === "expired");
  const expiringSoon = expiredDrugs.filter((d) => d.status === "expiring_soon");
  const nearExpiry = expiredDrugs.filter((d) => d.status === "near_expiry");

  if (expiredDrugs.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              All Inventory Valid
            </h3>
            <p className="text-gray-600 text-sm">
              No expired or soon-to-expire drugs found in your inventory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              Inventory Expiry Alert
            </h3>
            <p className="text-gray-600 text-sm">
              {actuallyExpired.length} expired • {expiringSoon.length} expiring
              soon • {nearExpiry.length} near expiry
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="font-medium text-gray-900">Expired</span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {actuallyExpired.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Past expiry date • Remove immediately
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <CalendarX className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-medium text-gray-900">Expiring Soon</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">
              {expiringSoon.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Within 30 days • Priority sale
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900">Near Expiry</span>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {nearExpiry.length}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Within 90 days • Monitor closely
          </div>
        </div>
      </div>

      {/* Expired Products List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Expired Products List</h4>
          <span className="text-sm text-gray-500">
            Showing {actuallyExpired.slice(0, 10).length} of{" "}
            {actuallyExpired.length} expired
          </span>
        </div>

        {actuallyExpired.length === 0 ? (
          <div className="text-center py-4 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-gray-600">No expired products found</p>
          </div>
        ) : (
          actuallyExpired.slice(0, 10).map((drug) => (
            <div
              key={drug.id}
              className="bg-white rounded-lg p-4 border border-red-200 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Package className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {drug.name}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {drug.sku && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Hash className="w-3 h-3" />
                            {drug.sku}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-gray-600">
                          <Box className="w-3 h-3" />
                          Qty: {drug.quantity} {drug.unit || "units"}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {drug.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          Expired
                        </span>
                        <span className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Expired:{" "}
                          {new Date(drug.expiryDate).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-red-500 font-medium">
                          {drug.daysRemaining} days overdue
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    alert("Please use the Inventory section to remove items.")
                  }
                  className="text-sm text-red-600 hover:text-red-700 font-medium ml-4 flex items-center gap-1"
                >
                  Remove
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() =>
          alert("Please go to Inventory section for full management.")
        }
        className="w-full mt-4 text-center text-white bg-gradient-to-r from-red-500 to-orange-500 font-medium py-3 rounded-lg hover:from-red-600 hover:to-orange-600 transition-all shadow-sm"
      >
        Manage All Expired Items in Inventory Section
      </button>
    </div>
  );
}
