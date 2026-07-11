"use client";

import {
  AlertOctagon,
  Activity,
  Heart,
  Thermometer,
  Bed,
  Clock,
} from "lucide-react";
import { cn } from "@/app/utils/utils";

interface CriticalPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  condition: string;
  vitalSigns: {
    bp: string;
    hr: number;
    rr: number;
    o2sat: number;
    temp?: number;
  };
  arrivalTime: string;
  needICU: boolean;
  needVentilator: boolean;
}

interface CriticalListProps {
  patients: CriticalPatient[];
  loading: boolean;
}

export default function CriticalList({ patients, loading }: CriticalListProps) {
  if (loading) {
    return (
      <div
        className="bg-white rounded-xl p-6 border border-red-200 shadow-sm animate-pulse"
        aria-label="Loading critical patients"
      >
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section
      className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-6 border border-red-200 shadow-sm"
      aria-label="Critical patients list"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" aria-hidden="true" />
          <h3 className="font-semibold text-slate-900">Critical Patients</h3>
          <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full font-medium">
            {patients.length} patients
          </span>
        </div>
        <span className="text-xs text-slate-500 hidden sm:block">
          Immediate attention required
        </span>
      </div>

      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-3">
            <AlertOctagon className="w-8 h-8 text-rose-300" />
          </div>
          <p className="font-medium text-slate-700">No critical patients</p>
          <p className="text-sm text-slate-500 max-w-sm">
            All patients are currently stable. Critical cases will appear here
            automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg p-4 border border-red-200 shadow-sm hover:shadow-md transition-shadow"
              role="article"
              aria-label={`Critical patient: ${p.name}`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {p.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {p.age}y • {p.gender}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.needICU && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium border border-purple-200">
                          <Bed className="w-3 h-3" />
                          ICU
                        </span>
                      )}
                      {p.needVentilator && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium border border-blue-200">
                          <Activity className="w-3 h-3" />
                          Vent
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mt-1.5 font-medium">
                    {p.condition}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                      {p.vitalSigns.bp && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Activity
                            className="w-3 h-3 text-blue-500"
                            aria-hidden="true"
                          />
                          <span className="font-mono font-medium text-slate-700">
                            {p.vitalSigns.bp}
                          </span>
                          <span className="text-slate-400">BP</span>
                        </div>
                      )}
                      {p.vitalSigns.hr && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Heart
                            className="w-3 h-3 text-rose-500"
                            aria-hidden="true"
                          />
                          <span className="font-mono font-medium text-slate-700">
                            {p.vitalSigns.hr}
                          </span>
                          <span className="text-slate-400">HR</span>
                        </div>
                      )}
                      {p.vitalSigns.rr && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-mono font-medium text-slate-700">
                            {p.vitalSigns.rr}
                          </span>
                          <span className="text-slate-400">RR</span>
                        </div>
                      )}
                      {p.vitalSigns.o2sat && (
                        <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          <span className="font-mono font-medium text-slate-700">
                            {p.vitalSigns.o2sat}%
                          </span>
                          <span className="text-slate-400">O₂</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 whitespace-nowrap">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>{p.arrivalTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {patients.length > 0 && (
        <div className="mt-4 pt-3 border-t border-red-200/50 flex justify-between text-xs text-slate-500">
          <span>Showing {patients.length} critical patients</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </section>
  );
}
