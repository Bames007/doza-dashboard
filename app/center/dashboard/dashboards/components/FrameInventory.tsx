"use client";

import { Glasses, AlertCircle } from "lucide-react";

interface FrameInventoryProps {
  items: Array<{
    id: string;
    model: string;
    brand: string;
    quantity: number;
    reorderLevel: number;
    price: number;
  }>;
  loading: boolean;
}

export default function FrameInventory({
  items,
  loading,
}: FrameInventoryProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Glasses className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Frame Inventory</h3>
      </div>
      <div className="space-y-3">
        {items.slice(0, 5).map((frame) => (
          <div
            key={frame.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{frame.model}</p>
              <p className="text-xs text-gray-500">{frame.brand}</p>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-bold ${
                  frame.quantity <= frame.reorderLevel
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {frame.quantity}
              </span>
              <p className="text-xs text-gray-500">
                reorder at {frame.reorderLevel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
