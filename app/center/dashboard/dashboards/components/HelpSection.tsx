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
    <div className={cn("space-y-3 md:space-y-4", poppins.className)}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-3.5 md:p-5 border-b border-slate-100">
          <div className="flex items-start gap-2.5 md:gap-3">
            <div className="p-2 md:p-2.5 bg-emerald-600 rounded-xl text-white shrink-0">
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "text-base md:text-xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                How Can We Help?
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
                Find what you need in the sidebar or explore below
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <button
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all whitespace-nowrap text-[11px] md:text-xs font-medium text-slate-700 hover:text-emerald-700"
                >
                  <Icon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {link.label}
                </button>
              );
            })}
            <button className="flex items-center gap-0.5 px-2 py-1.5 text-[11px] md:text-xs font-semibold text-emerald-700 hover:text-emerald-800 whitespace-nowrap">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Help Cards */}
        <div className="p-3.5 md:p-5">
          <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-3">
            {helpItems.map((item, idx) => {
              const Icon = item.icon;
              const isHovered = hoveredCard === item.id;

              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={item.action}
                  className={cn(
                    "group relative p-3 md:p-4 rounded-xl border text-left transition-all duration-200 w-full",
                    isHovered
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={cn(
                        "p-1.5 md:p-2 rounded-lg transition-colors shrink-0",
                        isHovered
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-700",
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "font-semibold text-xs md:text-sm truncate",
                          isHovered ? "text-emerald-700" : "text-slate-900",
                        )}
                      >
                        {item.title}
                      </div>
                      <div className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] md:text-[11px] text-slate-600 mt-2 leading-relaxed line-clamp-2">
                    {item.detail}
                  </p>

                  <div className="mt-2 flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                    Learn more <ChevronRight className="w-3 h-3" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 md:px-5 py-2.5 md:py-3 border-t border-slate-100 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500">
              <span>Need help?</span>
              <span className="font-semibold text-emerald-700 hover:underline cursor-pointer">
                Contact Support
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
              <span>24/7 availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;
