"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color:
    | "green"
    | "red"
    | "blue"
    | "purple"
    | "orange"
    | "amber"
    | "emerald"
    | "gray";
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  index?: number;
}

// Optimized color variants for a modern, high-contrast dashboard
const colorVariants = {
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    trend: "text-emerald-600",
    border: "border-emerald-100",
    shadow: "hover:shadow-emerald-500/10",
  },
  red: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    trend: "text-rose-600",
    border: "border-rose-100",
    shadow: "hover:shadow-rose-500/10",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    trend: "text-blue-600",
    border: "border-blue-100",
    shadow: "hover:shadow-blue-500/10",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    trend: "text-purple-600",
    border: "border-purple-100",
    shadow: "hover:shadow-purple-500/10",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    trend: "text-orange-600",
    border: "border-orange-100",
    shadow: "hover:shadow-orange-500/10",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    trend: "text-amber-600",
    border: "border-amber-100",
    shadow: "hover:shadow-amber-500/10",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    trend: "text-emerald-600",
    border: "border-emerald-100",
    shadow: "hover:shadow-emerald-500/10",
  },
  gray: {
    bg: "bg-slate-50",
    icon: "text-slate-600",
    trend: "text-slate-600",
    border: "border-slate-100",
    shadow: "hover:shadow-slate-500/10",
  },
};

export default function StatsCard({
  label,
  value,
  change,
  icon: Icon,
  color,
  subtext,
  trend,
  loading = false,
  index = 0,
}: StatsCardProps) {
  const colors = colorVariants[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-100",
        "shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
        colors.shadow,
      )}
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin" />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div className={cn("p-3 rounded-2xl", colors.bg)}>
              <Icon className={cn("w-6 h-6", colors.icon)} />
            </div>

            {change && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
                  trend === "up"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700",
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change}
              </div>
            )}
          </div>

          <div>
            <h3
              className={cn(
                "text-4xl text-slate-900 leading-none mb-2",
                bebasNeue.className,
              )}
            >
              {value}
            </h3>
            <p
              className={cn(
                "text-sm font-semibold text-slate-500 uppercase tracking-wider",
                poppins.className,
              )}
            >
              {label}
            </p>
            {subtext && (
              <p
                className={cn(
                  "text-[11px] text-slate-400 mt-1 font-medium",
                  poppins.className,
                )}
              >
                {subtext}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Decorative hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );
}
