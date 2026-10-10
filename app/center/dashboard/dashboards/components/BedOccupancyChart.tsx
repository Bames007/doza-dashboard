"use client";

import { Bed, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface BedOccupancyChartProps {
  data: {
    total: number;
    occupied: number;
    reserved?: number;
    history?: { date: string; occupancy: number }[];
  };
}

export default function BedOccupancyChart({ data }: BedOccupancyChartProps) {
  const total = data?.total || 1;
  const occupied = data?.occupied || 0;
  const reserved = data?.reserved ?? Math.max(0, Math.floor(total * 0.1));
  const available = Math.max(0, total - occupied - reserved);
  const occupancyRate = Math.round((occupied / total) * 100);

  const tone =
    occupancyRate > 85
      ? {
          text: "text-rose-600",
          bg: "bg-rose-50",
          bar: "bg-rose-500",
        }
      : occupancyRate > 70
        ? {
            text: "text-amber-600",
            bg: "bg-amber-50",
            bar: "bg-amber-500",
          }
        : {
            text: "text-emerald-600",
            bg: "bg-emerald-50",
            bar: "bg-emerald-500",
          };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 md:p-2 bg-emerald-50 rounded-lg shrink-0">
              <Bed className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-slate-700 truncate">
              Bed Utilization
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            LIVE
          </span>
        </div>

        {/* Main stat + sparkline */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2
            className={cn(
              "text-4xl md:text-5xl font-bold tracking-tight text-slate-900 tabular-nums",
              bebasNeue.className,
            )}
          >
            {occupancyRate}%
          </h2>

          {/* Sparkline — real occupancy trend, or fallback SVG shape */}
          <div className="w-24 h-9 md:w-28 md:h-10 shrink-0">
            <svg
              viewBox="0 0 100 30"
              className="w-full h-full overflow-visible"
            >
              {data.history && data.history.length > 1 ? (
                <>
                  {(() => {
                    const max = Math.max(
                      ...data.history.map((h) => h.occupancy),
                      1,
                    );
                    const step = 100 / (data.history.length - 1);
                    const path = data.history
                      .map((h, i) => {
                        const x = i * step;
                        const y = 28 - (h.occupancy / max) * 24;
                        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      })
                      .join(" ");
                    return (
                      <>
                        <path
                          d={path}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="100"
                          cy={
                            28 -
                            (data.history[data.history.length - 1].occupancy /
                              max) *
                              24
                          }
                          r="3.5"
                          fill="#10B981"
                        />
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <path
                    d="M 0 25 Q 15 18 30 22 T 60 12 T 80 15 T 100 5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="5" r="3.5" fill="#10B981" />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Trend pill */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 md:mb-7">
          <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3.5 h-3.5" /> +2.4%
          </span>
          <span>vs last week</span>
        </div>
      </div>

      {/* Sub-metrics */}
      <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] md:text-[11px] text-slate-500 font-medium mb-0.5">
            Occupied
          </p>
          <p className="text-base md:text-lg font-bold text-slate-900 tabular-nums">
            {occupied}
          </p>
        </div>
        <div>
          <p className="text-[10px] md:text-[11px] text-slate-500 font-medium mb-0.5">
            Available
          </p>
          <p className="text-base md:text-lg font-bold text-emerald-600 tabular-nums">
            {available}
          </p>
        </div>
        <div>
          <p className="text-[10px] md:text-[11px] text-slate-500 font-medium mb-0.5">
            Total
          </p>
          <p className="text-base md:text-lg font-bold text-slate-900 tabular-nums">
            {total}
          </p>
        </div>
      </div>
    </div>
  );
}
