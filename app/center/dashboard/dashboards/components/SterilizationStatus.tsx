"use client";

import { Syringe, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface SterilizationStatusProps {
  items: Array<{
    id: string;
    name: string;
    status: "ready" | "in-progress" | "needs-cleaning";
    lastCycle: string;
    cycleNumber?: string;
  }>;
  loading: boolean;
}

export default function SterilizationStatus({
  items,
  loading,
}: SterilizationStatusProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const statusConfig = {
    ready: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Ready",
    },
    "in-progress": {
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "In Progress",
    },
    "needs-cleaning": {
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-100",
      label: "Needs Cleaning",
    },
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Syringe className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">Sterilization Status</h3>
      </div>
      <div className="space-y-3">
        {items.slice(0, 5).map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Cycle #{item.cycleNumber || "—"} • {item.lastCycle}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
