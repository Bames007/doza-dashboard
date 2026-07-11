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
  Zap,
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
      icon: Zap,
    },
    {
      id: 2,
      title: "Batch Tracking",
      description: "Seamless serial numbers and QR code integration.",
      cta: "Try Free",
      icon: Box,
    },
    {
      id: 3,
      title: "Team Training",
      description: "Certify your team with specialized courses.",
      cta: "View Courses",
      icon: Target,
    },
  ];

  const tutorials = [
    {
      id: 1,
      title: "Inventory Basics",
      description: "Master efficient stock management.",
      duration: "12:45",
      icon: Package,
      url: "#",
    },
    {
      id: 2,
      title: "Expiry Tracking",
      description: "Proactive prevention of expired items.",
      duration: "18:30",
      icon: Clock,
      url: "#",
    },
    {
      id: 3,
      title: "Analytics Masterclass",
      description: "Deep dive into your pharmacy data.",
      duration: "15:20",
      icon: BarChart,
      url: "#",
    },
  ];

  return (
    <div className={cn("space-y-12 py-4", poppins.className)}>
      {/* Featured Solutions (Ads) */}
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3
              className={cn(
                "text-3xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              Featured Solutions
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Tools to accelerate your operations
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
            Sponsored
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group flex flex-col"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                <ad.icon className="w-6 h-6" />
              </div>
              <h4
                className={cn(
                  "text-xl text-slate-900 mb-2",
                  bebasNeue.className,
                )}
              >
                {ad.title}
              </h4>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed flex-grow">
                {ad.description}
              </p>
              <button className="w-full text-sm font-bold bg-slate-900 text-white py-3 rounded-xl hover:bg-emerald-600 transition-colors">
                {ad.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Learning Center */}
      <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <PlayCircle className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h3
                className={cn(
                  "text-3xl text-slate-900 leading-none",
                  bebasNeue.className,
                )}
              >
                Learning Center
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Grow your skills with Doza
              </p>
            </div>
          </div>
          <button className="text-sm text-emerald-600 font-bold hover:text-emerald-700 flex items-center gap-2 uppercase tracking-wide">
            View Library <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tutorials.map((t) => (
            <div
              key={t.id}
              className="group border border-slate-100 bg-slate-50/50 rounded-2xl p-6 hover:bg-white hover:border-emerald-100 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                  <t.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {t.title}
                  </h4>
                  <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {t.duration} Minutes
                  </p>
                </div>
              </div>
              <p className="text-slate-500 text-xs mb-4">{t.description}</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-1/3 group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdSection;
