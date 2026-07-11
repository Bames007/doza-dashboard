"use client";

import { Clock, AlertTriangle, User, ChevronRight } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface EmergencyWaitListProps {
  patients: Array<{
    id: string;
    name: string;
    waitTime: number;
    acuity: string;
  }>;
  loading: boolean;
}

export default function EmergencyWaitList({
  patients,
  loading,
}: EmergencyWaitListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse">
        <div className="h-6 w-40 bg-slate-100 rounded-lg mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3
              className={cn(
                "text-2xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              Emergency Wait List
            </h3>
          </div>
        </div>
        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          {patients.length} Active
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {patients.length > 0 ? (
          patients.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-bold text-slate-900",
                      poppins.className,
                    )}
                  >
                    {p.name}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-medium text-emerald-600 uppercase tracking-wide",
                      poppins.className,
                    )}
                  >
                    {p.acuity}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full font-bold text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  {p.waitTime} min
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            No patients currently in triage.
          </div>
        )}
      </div>
    </div>
  );
}
