"use client";

import { Ambulance, Clock, AlertCircle } from "lucide-react";

interface AmbulanceETAProps {
  arrivals: Array<{
    id: string;
    provider: string;
    eta: string;
    patientName?: string;
    chiefComplaint?: string;
    priority: "high" | "medium" | "low";
  }>;
  loading: boolean;
}

export default function AmbulanceETA({ arrivals, loading }: AmbulanceETAProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Ambulance className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-gray-900">Ambulance ETA</h3>
      </div>
      <div className="space-y-3">
        {arrivals.slice(0, 5).map((amb) => (
          <div
            key={amb.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-lg ${priorityColors[amb.priority].split(" ")[0]}`}
              >
                {amb.priority === "high" ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Ambulance className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {amb.provider}
                </p>
                {amb.patientName && (
                  <p className="text-xs text-gray-600">
                    {amb.patientName} • {amb.chiefComplaint}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-sm font-semibold text-gray-900">
                {amb.eta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
