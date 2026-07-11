"use client";

import { AlertCircle } from "lucide-react";

interface CathLabScheduleProps {
  procedures: Array<{
    id: string;
    patient: string;
    procedure: string;
    startTime: string;
    labNumber: string;
    status: "scheduled" | "in-progress" | "completed";
  }>;
  loading: boolean;
}

export default function CathLabSchedule({
  procedures,
  loading,
}: CathLabScheduleProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const statusColors = {
    scheduled: "bg-gray-100 text-gray-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-gray-900">Cath Lab Schedule</h3>
      </div>
      <div className="space-y-3">
        {procedures.slice(0, 5).map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{p.patient}</p>
              <p className="text-xs text-gray-500">
                {p.procedure} • Lab {p.labNumber}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-1 rounded-full ${statusColors[p.status]}`}
              >
                {p.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{p.startTime}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
