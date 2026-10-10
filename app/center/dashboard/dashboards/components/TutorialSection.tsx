"use client";

import {
  BarChart,
  Clock,
  ExternalLink,
  Package,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

const TutorialSection = () => {
  const tutorials = [
    {
      id: 1,
      title: "Inventory Management Basics",
      description:
        "Learn how to effectively manage your pharmacy inventory with ease.",
      duration: "12:45",
      icon: Package,
      url: "https://youtube.com/watch?v=inventory-basics",
    },
    {
      id: 2,
      title: "Expiry Tracking Best Practices",
      description: "Prevent expired stock with our automated tracking tools.",
      duration: "18:30",
      icon: Clock,
      url: "https://youtube.com/watch?v=expiry-tracking",
    },
    {
      id: 3,
      title: "Sales & Reporting Dashboard",
      description: "Master your pharmacy analytics and reporting metrics.",
      duration: "15:20",
      icon: BarChart,
      url: "https://youtube.com/watch?v=sales-dashboard",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-3.5 md:p-6 border border-slate-200 shadow-sm mb-4 md:mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-5 gap-3">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          <div className="p-2 md:p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
            <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
            <h3
              className={cn(
                "text-lg md:text-2xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              Video Tutorials
            </h3>
            <p
              className={cn(
                "text-[11px] md:text-xs text-slate-500 mt-1 truncate",
                poppins.className,
              )}
            >
              Learn how to use Doza
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            window.open("https://youtube.com/c/DozaHealthcare", "_blank")
          }
          className="flex items-center gap-1 text-[10px] md:text-xs text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider shrink-0"
        >
          Library
          <ExternalLink className="w-3 h-3 md:w-3.5 md:h-3.5" />
        </button>
      </div>

      {/* Grid — stacked rows on mobile, 3-col on desktop */}
      <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
        {tutorials.map((tutorial) => {
          const Icon = tutorial.icon;
          return (
            <div
              key={tutorial.id}
              className="group border border-slate-100 bg-slate-50/50 rounded-xl p-3 md:p-4 hover:bg-white hover:border-emerald-200 transition-all"
            >
              {/* Header row */}
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors shrink-0">
                  <Icon className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-xs md:text-sm truncate">
                    {tutorial.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs font-bold text-emerald-600 mt-0.5">
                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {tutorial.duration}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] md:text-xs text-slate-500 mb-2.5 md:mb-3 leading-relaxed line-clamp-2">
                {tutorial.description}
              </p>

              {/* Action */}
              <button
                onClick={() => window.open(tutorial.url, "_blank")}
                className="w-full text-center text-[11px] md:text-xs font-bold text-slate-900 py-2 md:py-2.5 border border-slate-200 rounded-lg hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-1.5"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Watch
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialSection;
