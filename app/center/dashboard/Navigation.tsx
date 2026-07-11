// app/center/dashboard/Navigation.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { useDashboard } from "./DashboardContext";
import { getFilteredNavigation } from "../config/navigation";
import type { UserRole, CenterType } from "../type";

interface NavigationProps {
  isMobile?: boolean;
}

interface PanelMap {
  [key: string]: string;
}

const Navigation: React.FC<NavigationProps> = ({ isMobile = false }) => {
  const {
    sidebarCollapsed,
    setCurrentPage,
    setActivePanel,
    user,
    center,
    activePanel,
  } = useDashboard();

  const navigationItems =
    user && center
      ? getFilteredNavigation(
          user.role as UserRole,
          center.centerType as CenterType,
        )
      : [];

  //change here too to add a panel it works and itsimportant
  const hrefToPanelMap: PanelMap = {
    "/dashboard": "dashboard",
    "/dashboard/facility": "facility-services",
    "/dashboard/analytics": "analytics",
    "/dashboard/auditlogs": "auditlogs",
    "/dashboard/hospital-prescription": "hospital-prescription",
    "/dashboard/hospital-pharmacy-inventory": "hospital-pharmacy-inventory",
    "/dashboard/hospital-pharmacy-drug-store": "hospital-pharmacy-drug-store",
    "/dashboard/hospital-pharmacy-medication-dispensing":
      "hospital-pharmacy-medication-dispensing",
    "/dashboard/aprrovals": "approvals",
    "/dashboard/requisitions": "requisitions",
    "/dashboard/dozaNetwork": "dozaNetwork",
    "/dashboard/sales": "sales",
    "/dashboard/patients": "patients",
    "/dashboard/appointments": "appointments",
    "/dashboard/doctors": "doctors",
    "/dashboard/equipment": "equipment",
    "/dashboard/medical-records": "medical-records",
    "/dashboard/emergency": "emergency",
    "/dashboard/notification": "notification",
    "/dashboard/help": "help",
    "/dashboard/drug-verification": "drug-verification",
    "/dashboard/inventory": "inventory",
    "/dashboard/prescriptions": "prescriptions",
    "/dashboard/lab-tests": "lab-tests",
    "/dashboard/staff": "staff",
    "/dashboard/billing": "billing",
    "/dashboard/messages": "messages",
    "/dashboard/settings": "settings",
    "/dashboard/quality-control": "quality-control",
    "/dashboard/results": "results",
    "/dashboard/samples": "samples",
  };

  const handleNavigation = (name: string, panelId: string) => {
    setCurrentPage(name);
    setActivePanel(panelId);
  };

  if (!user || !center) {
    return (
      <div className="p-4">
        <div className="text-green-200 text-sm text-center">
          Loading navigation...
        </div>
      </div>
    );
  }

  if (navigationItems.length === 0) {
    return (
      <div className="p-4">
        <div className="text-green-200 text-sm text-center">
          No menu items available
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <nav className="flex items-center justify-around w-full px-1 py-2">
        {navigationItems.slice(0, 5).map((item, index) => {
          const panelId = hrefToPanelMap[item.href] || "dashboard";
          const isActive = activePanel === panelId;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleNavigation(item.name, panelId)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 mx-1 min-w-0 group ${
                isActive
                  ? "bg-white/25 shadow-lg scale-110"
                  : "bg-transparent hover:bg-white/15"
              }`}
            >
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 w-1.5 h-1.5 bg-white rounded-full shadow-sm"
                />
              )}

              <div
                className={`relative p-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-white/20 scale-110"
                    : "bg-transparent group-hover:bg-white/10"
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition-all duration-300 ${
                    isActive
                      ? "text-white drop-shadow-lg scale-110"
                      : "text-green-100 group-hover:text-white group-hover:scale-105"
                  }`}
                />

                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg z-50">
                  {item.name}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              </div>

              {isActive && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border-2 border-white/30"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="p-2 space-y-1">
      {navigationItems.map((item, index) => {
        const panelId = hrefToPanelMap[item.href] || "dashboard";
        const isActive = activePanel === panelId;
        const Icon = item.icon;

        return (
          <div key={item.name} className="relative">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleNavigation(item.name, panelId)}
              className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-white text-green-700 shadow-md"
                  : "text-green-100 hover:bg-green-700 hover:text-white hover:shadow-sm"
              }`}
            >
              <Icon
                className={`flex-shrink-0 h-4 w-4 ${
                  isActive ? "text-green-600" : "text-green-200"
                }`}
              />

              <motion.span
                initial={false}
                animate={{
                  opacity: sidebarCollapsed ? 0 : 1,
                  marginLeft: sidebarCollapsed ? 0 : 8,
                  width: sidebarCollapsed ? 0 : "auto",
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap font-medium text-sm"
              >
                {item.name}
              </motion.span>

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
                  {item.name}
                </div>
              )}
            </motion.button>
          </div>
        );
      })}
    </nav>
  );
};

export default Navigation;
