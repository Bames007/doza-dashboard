"use client";

import { Activity } from "lucide-react";

interface RecentVitalsProps {
  vitals: Array<{
    id: string;
    patient: string;
    bp: string;
    hr: number;
    temp: string;
    time: string;
  }>;
  loading: boolean;
}

export default function RecentVitals({ vitals, loading }: RecentVitalsProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Recent Vitals</h3>
      </div>
      <div className="space-y-3">
        {vitals.slice(0, 5).map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{v.patient}</p>
              <p className="text-xs text-gray-500">{v.time}</p>
            </div>
            <div className="text-right text-xs">
              <span className="block font-mono">{v.bp}</span>
              <span className="block text-gray-600">
                {v.hr} bpm • {v.temp}°C
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
