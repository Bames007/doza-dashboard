"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Box,
  Clock,
  ExternalLink,
  Package,
  PlayCircle,
  Target,
  Crown,
  ArrowRight,
} from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";

const AdSection = () => {
  const ads = [
    {
      id: 1,
      title: "Premium Suite",
      description: "Unlock advanced analytics and automated ordering.",
      cta: "Upgrade Now",
      icon: Crown,
      accent: "amber",
    },
    {
      id: 2,
      title: "Batch Tracking",
      description: "Seamless serial numbers and QR code integration.",
      cta: "Try Free",
      icon: Box,
      accent: "emerald",
    },
    {
      id: 3,
      title: "Team Training",
      description: "Certify your team with specialized courses.",
      cta: "View Courses",
      icon: Target,
      accent: "blue",
    },
  ];

  const tutorials = [
    {
      id: 1,
      title: "Inventory Basics",
      description: "Master efficient stock management.",
      duration: "12:45",
      icon: Package,
    },
    {
      id: 2,
      title: "Expiry Tracking",
      description: "Proactive prevention of expired items.",
      duration: "18:30",
      icon: Clock,
    },
    {
      id: 3,
      title: "Analytics Masterclass",
      description: "Deep dive into your pharmacy data.",
      duration: "15:20",
      icon: BarChart,
    },
  ];

  const accentMap: Record<string, { bg: string; text: string }> = {
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    blue: { bg: "bg-blue-50", text: "text-blue-600" },
  };

  return (
    <div className={cn("space-y-6 md:space-y-10", poppins.className)}>
      {/* Featured Solutions */}
      <section>
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <div className="min-w-0">
            <h3
              className={cn(
                "text-xl md:text-2xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              Featured Solutions
            </h3>
            <p className="text-slate-500 text-[11px] md:text-xs mt-1">
              Tools to accelerate your operations
            </p>
          </div>
          <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-emerald-50 text-emerald-700 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100 shrink-0">
            Sponsored
          </span>
        </div>

        {/* Horizontal snap-scroll on mobile, 3-col grid on desktop */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-3 gap-3 md:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ads.map((ad) => {
            const accent = accentMap[ad.accent] || accentMap.emerald;
            return (
              <motion.div
                key={ad.id}
                whileHover={{ y: -3 }}
                className="snap-start shrink-0 w-[78%] sm:w-[60%] md:w-auto bg-white rounded-2xl p-3.5 md:p-5 border border-slate-100 shadow-sm hover:shadow-lg transition-all flex flex-col"
              >
                <div
                  className={cn(
                    "w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center mb-3 md:mb-4",
                    accent.bg,
                    accent.text,
                  )}
                >
                  <ad.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>

                <h4
                  className={cn(
                    "text-base md:text-lg text-slate-900 mb-1",
                    bebasNeue.className,
                  )}
                >
                  {ad.title}
                </h4>
                <p className="text-slate-500 text-[11px] md:text-xs mb-3 md:mb-5 leading-relaxed flex-grow">
                  {ad.description}
                </p>
                <button
                  className={cn(
                    "w-full text-[11px] md:text-xs font-bold text-white py-2 md:py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5",
                    ad.accent === "amber"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : ad.accent === "blue"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-slate-900 hover:bg-emerald-600",
                  )}
                >
                  {ad.cta}
                  <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Learning Center */}
      <section className="bg-white rounded-2xl p-3.5 md:p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3 md:mb-5 gap-3">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl shrink-0">
              <PlayCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-lg md:text-2xl text-slate-900 leading-none",
                  bebasNeue.className,
                )}
              >
                Learning Center
              </h3>
              <p className="text-slate-500 text-[11px] md:text-xs mt-1 truncate">
                Grow your skills with Doza
              </p>
            </div>
          </div>
          <button className="text-[10px] md:text-xs text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider shrink-0">
            Library
            <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>

        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
          {tutorials.map((t) => (
            <div
              key={t.id}
              className="group border border-slate-100 bg-slate-50/50 rounded-xl p-3 md:p-4 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 mb-2 md:mb-3">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all shrink-0">
                  <t.icon className="w-4 h-4 md:w-4.5 md:h-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-xs md:text-sm truncate">
                    {t.title}
                  </h4>
                  <p className="text-emerald-600 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {t.duration}
                  </p>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] md:text-xs mb-2 md:mb-3 line-clamp-2">
                {t.description}
              </p>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 group-hover:w-full transition-all duration-500 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdSection;
