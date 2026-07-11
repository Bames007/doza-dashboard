"use client";

import { Activity, Clock, AlertCircle } from "lucide-react";

interface ECGQueueProps {
  queue: Array<{
    id: string;
    patient: string;
    orderedAt: string;
    priority: "routine" | "urgent";
  }>;
  loading: boolean;
}

export default function ECGQueue({ queue, loading }: ECGQueueProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">ECG Queue</h3>
      </div>
      <div className="space-y-3">
        {queue.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {item.priority === "urgent" && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {item.patient}
                </p>
                <p className="text-xs text-gray-500">
                  Ordered: {item.orderedAt}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                item.priority === "urgent"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
