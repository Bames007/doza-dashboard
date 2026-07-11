"use client";

import {
  BarChart,
  Clock,
  ExternalLink,
  Package,
  PlayCircle,
  Sparkles,
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
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <PlayCircle className="w-7 h-7" />
          </div>
          <div>
            <h3
              className={cn(
                "text-3xl text-slate-900 leading-none",
                bebasNeue.className,
              )}
            >
              Video Tutorials
            </h3>
            <p className={cn("text-sm text-slate-500 mt-1", poppins.className)}>
              Learn how to use Doza effectively
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            window.open("https://youtube.com/c/DozaHealthcare", "_blank")
          }
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 px-5 py-2.5 rounded-xl transition-all hover:bg-emerald-100"
        >
          View Library <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => {
          const Icon = tutorial.icon;
          return (
            <div
              key={tutorial.id}
              className="group border border-slate-100 bg-slate-50/50 rounded-2xl p-6 hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
            >
              {/* Card Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4
                    className={cn(
                      "font-bold text-slate-900 text-sm",
                      poppins.className,
                    )}
                  >
                    {tutorial.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {tutorial.duration}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p
                className={cn(
                  "text-sm text-slate-500 mb-6 leading-relaxed",
                  poppins.className,
                )}
              >
                {tutorial.description}
              </p>

              {/* Action Button */}
              <button
                onClick={() => window.open(tutorial.url, "_blank")}
                className="w-full text-center text-sm font-bold text-slate-900 py-3 border border-slate-200 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Watch Tutorial
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialSection;
