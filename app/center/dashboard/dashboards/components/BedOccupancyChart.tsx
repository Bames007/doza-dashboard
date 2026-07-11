"use client";

import { Bed } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface BedOccupancyChartProps {
  data: {
    total: number;
    occupied: number;
    history?: { date: string; occupancy: number }[];
  };
}

export default function BedOccupancyChart({ data }: BedOccupancyChartProps) {
  const occupancyRate =
    data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0;

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
          <Bed className="w-6 h-6" />
        </div>
        <div>
          <h3
            className={cn(
              "text-2xl text-slate-900 leading-none",
              bebasNeue.className,
            )}
          >
            Bed Occupancy
          </h3>
          <p
            className={cn(
              "text-xs text-slate-400 font-medium uppercase tracking-wider mt-1",
              poppins.className,
            )}
          >
            Live Utilization
          </p>
        </div>
      </div>

      {/* Main Metric */}
      <div className="flex items-baseline gap-2 mb-6">
        <span
          className={cn(
            "text-5xl font-bold text-slate-900",
            bebasNeue.className,
          )}
        >
          {occupancyRate}%
        </span>
        <span
          className={cn(
            "text-sm text-slate-500 font-medium",
            poppins.className,
          )}
        >
          Occupied
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <p
            className={cn(
              "text-xs font-semibold text-slate-600",
              poppins.className,
            )}
          >
            {data.occupied} of {data.total} beds occupied
          </p>
          <span
            className={cn(
              "text-[10px] font-bold text-slate-400 uppercase tracking-widest",
              poppins.className,
            )}
          >
            {data.total - data.occupied} Available
          </span>
        </div>
      </div>
    </div>
  );
}
