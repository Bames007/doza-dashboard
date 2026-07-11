"use client";

import { Users, Clock, AlertTriangle } from "lucide-react";

interface EmergencyCensusProps {
  patients: Array<{
    id: string;
    name: string;
    acuity: "1" | "2" | "3" | "4" | "5";
    chiefComplaint: string;
    arrivalTime: string;
    waitTime: number;
    bedAssigned?: string;
  }>;
  loading: boolean;
}

export default function EmergencyCensus({
  patients,
  loading,
}: EmergencyCensusProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const acuityColors = {
    "1": "bg-red-600 text-white",
    "2": "bg-orange-500 text-white",
    "3": "bg-yellow-500 text-white",
    "4": "bg-green-500 text-white",
    "5": "bg-blue-500 text-white",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Emergency Census</h3>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {patients.slice(0, 8).map((p) => (
          <div
            key={p.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <span
              className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${acuityColors[p.acuity]}`}
            >
              {p.acuity}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Clock className="w-3 h-3" />
                  {p.waitTime} min
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{p.chiefComplaint}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>Arrived: {p.arrivalTime}</span>
                {p.bedAssigned && (
                  <>
                    <span>•</span>
                    <span>Bed: {p.bedAssigned}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
