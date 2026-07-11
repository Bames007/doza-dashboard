"use client";

import React, { useState } from "react";
import {
  BarChart,
  HelpCircle,
  MessageSquare,
  Package,
  Pill,
  ClipboardList,
  Users,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface HelpItem {
  id: string;
  icon: any;
  title: string;
  description: string;
  detail: string;
  action: () => void;
}

const HelpSection = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const helpItems: HelpItem[] = [
    {
      id: "inventory",
      icon: Package,
      title: "Manage Inventory",
      description: "Track stock, expiry, and reorder levels",
      detail: "View expired drugs, low stock items, and complete inventory",
      action: () =>
        alert(
          "Inventory management is available in the Inventory section of the sidebar menu.",
        ),
    },
    {
      id: "reports",
      icon: BarChart,
      title: "View Reports",
      description: "Sales analytics & trends",
      detail: "Daily revenue, transaction history, and performance metrics",
      action: () =>
        alert(
          "Sales and reports are available in the Sales section of the sidebar.",
        ),
    },
    {
      id: "support",
      icon: MessageSquare,
      title: "Get Support",
      description: "Help & tutorials",
      detail: "Watch tutorials, read docs, or contact our support team",
      action: () =>
        alert("Watch tutorials above or contact support for assistance."),
    },
  ];

  const quickLinks = [
    { icon: Pill, label: "Drug Guide" },
    { icon: ClipboardList, label: "Protocols" },
    { icon: Users, label: "Team" },
  ];

  return (
    <div className={cn("space-y-4 md:space-y-5", poppins.className)}>
      {/* Main Help Card */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header with emerald accent */}
        <div className="relative p-4 md:p-6 pb-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-t-2xl md:rounded-t-3xl" />
          <div className="relative flex items-start gap-3 md:gap-4">
            <div className="p-2.5 md:p-3 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-200/50 flex-shrink-0">
              <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    "text-base md:text-xl font-bold text-slate-800",
                    bebasNeue.className,
                  )}
                >
                  How Can We Help?
                </h3>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Quick Guide
                </span>
              </div>
              <p
                className={cn(
                  "text-xs md:text-sm text-slate-500",
                  poppins.className,
                )}
              >
                Find what you need in the sidebar menu or explore the options
                below
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links Row */}
        <div className="relative px-4 md:px-6 pt-3 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <button
                  key={idx}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200/60 hover:border-emerald-200/60 transition-all whitespace-nowrap text-xs font-medium text-slate-600 hover:text-emerald-600"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
            <button className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Help Cards Grid - Solid emerald theme */}
        <div className="relative p-4 md:p-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {helpItems.map((item, idx) => {
              const Icon = item.icon;
              const isHovered = hoveredCard === item.id;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={item.action}
                  className={cn(
                    "group relative p-4 rounded-xl border transition-all duration-300 text-left",
                    "bg-white",
                    isHovered
                      ? "border-emerald-200 shadow-lg shadow-emerald-100/30"
                      : "border-slate-200/60 shadow-sm hover:shadow-md",
                  )}
                >
                  {/* Solid emerald accent line */}
                  <div
                    className={cn(
                      "absolute top-0 left-4 right-4 h-0.5 rounded-full transition-opacity duration-300",
                      isHovered ? "opacity-100" : "opacity-0",
                      "bg-emerald-500",
                    )}
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        isHovered
                          ? "bg-emerald-500 text-white shadow-md"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-semibold text-slate-800 text-sm md:text-base transition-colors",
                          isHovered ? "text-emerald-600" : "",
                          poppins.className,
                        )}
                      >
                        {item.title}
                      </div>
                      <div
                        className={cn(
                          "text-xs text-slate-500",
                          poppins.className,
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "text-xs text-slate-600 mt-2.5 leading-relaxed",
                      poppins.className,
                    )}
                  >
                    {item.detail}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Learn more <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer Help Bar - simplified, no icons */}
        <div className="relative px-4 md:px-6 py-3 md:py-4 border-t border-slate-200/60 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Need immediate assistance?</span>
              <span className="font-medium text-emerald-600 hover:underline cursor-pointer">
                Contact Support
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span>Quick response</span>
              <span>•</span>
              <span>24/7 availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
