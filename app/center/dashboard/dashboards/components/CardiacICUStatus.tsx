"use client";

import { Bed, Activity, AlertCircle } from "lucide-react";

interface CardiacICUStatusProps {
  patients: Array<{
    id: string;
    name: string;
    bed: string;
    ventilator: boolean;
    condition: "stable" | "critical" | "recovering";
  }>;
  loading: boolean;
}

export default function CardiacICUStatus({
  patients,
  loading,
}: CardiacICUStatusProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const conditionColors = {
    stable: "bg-green-100 text-green-700",
    critical: "bg-red-100 text-red-700",
    recovering: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Bed className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Cardiac ICU Status</h3>
      </div>
      <div className="space-y-3">
        {patients.slice(0, 5).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {p.name}
                </span>
                {p.ventilator && <Activity className="w-4 h-4 text-blue-500" />}
              </div>
              <p className="text-xs text-gray-500">Bed {p.bed}</p>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${conditionColors[p.condition]}`}
            >
              {p.condition}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
