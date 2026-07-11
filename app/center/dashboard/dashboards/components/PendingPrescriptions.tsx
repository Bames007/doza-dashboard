"use client";

import { FileText, AlertCircle } from "lucide-react";

interface PendingPrescriptionsProps {
  prescriptions: Array<{
    id: string;
    patient: string;
    medication: string;
    prescribedAt: string;
    status: "pending" | "ready" | "picked-up";
    urgent: boolean;
  }>;
  loading: boolean;
}

export default function PendingPrescriptions({
  prescriptions,
  loading,
}: PendingPrescriptionsProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-gray-900">Pending Prescriptions</h3>
      </div>
      <div className="space-y-3">
        {prescriptions.slice(0, 5).map((rx) => (
          <div
            key={rx.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {rx.urgent && <AlertCircle className="w-4 h-4 text-red-500" />}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {rx.patient}
                </p>
                <p className="text-xs text-gray-500">{rx.medication}</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  rx.status === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : rx.status === "ready"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {rx.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{rx.prescribedAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
