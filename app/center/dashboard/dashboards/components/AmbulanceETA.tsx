"use client";

import { Ambulance, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/app/utils/utils";

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
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const priorityBorder: Record<string, string> = {
    high: "border-l-rose-500",
    medium: "border-l-amber-400",
    low: "border-l-slate-300",
  };
  const priorityIcon: Record<string, string> = {
    high: "bg-rose-50 text-rose-600",
    medium: "bg-amber-50 text-amber-600",
    low: "bg-slate-100 text-slate-600",
  };

  const hasArrivals = arrivals && arrivals.length > 0;

  return (
    <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 md:p-2 bg-emerald-50 rounded-lg shrink-0">
            <Ambulance className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
          </div>
          <h3 className="text-sm md:text-base font-bold text-slate-800 truncate">
            Incoming Ambulances
          </h3>
        </div>
        <span className="text-[10px] md:text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold shrink-0">
          {arrivals?.length || 0}
        </span>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {hasArrivals ? (
          arrivals.slice(0, 5).map((amb) => (
            <div
              key={amb.id}
              className={cn(
                "flex items-center justify-between gap-2 p-2 md:p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 border-l-2",
                priorityBorder[amb.priority] || priorityBorder.low,
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className={cn(
                    "p-1.5 rounded-lg shrink-0",
                    priorityIcon[amb.priority] || priorityIcon.low,
                  )}
                >
                  {amb.priority === "high" ? (
                    <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  ) : (
                    <Ambulance className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] md:text-xs font-bold text-slate-900 truncate">
                    {amb.provider}
                  </p>
                  {amb.patientName && (
                    <p className="text-[9px] md:text-[10px] text-slate-500 truncate">
                      {amb.patientName}
                      {amb.chiefComplaint ? ` · ${amb.chiefComplaint}` : ""}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                <Clock className="w-3 h-3" />
                <span className="text-[11px] md:text-xs font-bold tabular-nums">
                  {amb.eta}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] text-slate-500 text-center py-5">
            No incoming transit
          </p>
        )}
      </div>
    </div>
  );
}
