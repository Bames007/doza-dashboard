"use client";

import { Droplet, AlertTriangle } from "lucide-react";

interface DentalInventoryAlertProps {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    reorderLevel: number;
    category: string;
    supplier?: string;
  }>;
}

export default function DentalInventoryAlert({
  items,
}: DentalInventoryAlertProps) {
  if (items.length === 0) {
    return (
      <div className="bg-green-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Droplet className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            All dental supplies are well-stocked
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">
          Critical Dental Inventory
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg p-4 border border-amber-100"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <span className="text-sm font-bold text-red-600">
                {item.quantity}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-600">
                Reorder at: {item.reorderLevel}
              </span>
              {item.supplier && (
                <span className="text-gray-500">{item.supplier}</span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-red-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.min((item.quantity / item.reorderLevel) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <button
          onClick={() =>
            alert("Please check the Inventory section for full details.")
          }
          className="w-full mt-4 text-center text-amber-600 hover:text-amber-700 font-medium py-2 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors text-sm"
        >
          View All {items.length} Critical Items
        </button>
      )}
    </div>
  );
}
