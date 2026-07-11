"use client";

import { Package } from "lucide-react";

interface LensOrderStatusProps {
  orders: Array<{
    id: string;
    patient: string;
    prescription: string;
    orderedAt: string;
    status: "pending" | "processing" | "ready" | "delivered";
  }>;
  loading: boolean;
}

export default function LensOrderStatus({
  orders,
  loading,
}: LensOrderStatusProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const statusColors = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    ready: "bg-green-100 text-green-700",
    delivered: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Lens Order Status</h3>
      </div>
      <div className="space-y-3">
        {orders.slice(0, 5).map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.patient}
              </p>
              <p className="text-xs text-gray-500">{order.prescription}</p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}
              >
                {order.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{order.orderedAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
