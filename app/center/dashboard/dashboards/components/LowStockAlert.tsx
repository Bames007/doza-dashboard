"use client";

import {
  Package,
  AlertOctagon,
  CheckCircle,
  MapPin,
  Target,
} from "lucide-react";
import { Product } from "../types";

interface LowStockAlertProps {
  items: Product[];
}

export default function LowStockAlert({ items }: LowStockAlertProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertOctagon className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Low Stock Items</h3>
            <p className="text-gray-600 text-sm">Need immediate restocking</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full font-medium">
          {items.length}
        </span>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">All items are well-stocked</p>
          </div>
        ) : (
          items.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 hover:bg-amber-50 rounded-lg transition-colors border border-amber-100"
            >
              <div className="bg-amber-100 p-2 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.category || "Uncategorized"}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-700">
                    {item.quantity} left
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Reorder at {item.reorderLevel || 10}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.location || "Unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    SKU: {item.sku || "N/A"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min((item.quantity / (item.reorderLevel || 10)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {items.length > 5 && (
        <button
          onClick={() =>
            alert(
              "Please check the Inventory section for complete stock management.",
            )
          }
          className="w-full mt-6 text-center text-amber-600 hover:text-amber-700 font-medium py-3 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors text-sm"
        >
          View All {items.length} Items in Inventory
        </button>
      )}
    </div>
  );
}
