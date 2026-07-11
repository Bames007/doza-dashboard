"use client";

import { useDashboard } from "./DashboardContext";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ChevronRight,
  MoreHorizontal,
  X,
  MessageCircle,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import { getFilteredNavigation } from "../config/navigation";
import type { NavigationItem, UserRole } from "../type";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";

interface NavigationItemWithPanel extends NavigationItem {
  panelId: string;
}

const panelToPageName: Record<string, string> = {
  dashboard: "Dashboard",
  "facility-services": "Facility & Services",
  sales: "Sales",
  auditlogs: "Audit Logs",
  dozaNetwork: "Doza Network",
  analytics: "Analytics",
  patients: "Patients",
  appointments: "Appointments",
  doctors: "Doctors",
  "medical-records": "Medical Records",
  emergency: "Emergency",
  notification: "Notifications",
  help: "Help",
  inventory: "Inventory",
  prescriptions: "Prescriptions",
  "lab-tests": "Lab Tests",
  staff: "Staff",
  billing: "Billing",
  messages: "Messages",
  settings: "Settings",
  "quality-control": "Quality Control",
  results: "Test Results",
  samples: "Test Samples",
  profile: "Profile",
};

const hrefToPanelMap: Record<string, string> = {
  "/dashboard": "dashboard",
  "/dashboard/facility": "facility-services",
  "/dashboard/analytics": "analytics",
  "/dashboard/auditlogs": "auditlogs",
  "/dashboard/approvals": "approvals",
  "/dashboard/requisitions": "requisitions",
  "/dashboard/hospital-prescription": "hospital-prescription",
  "/dashboard/hospital-pharmacy-inventory": "hospital-pharmacy-inventory",
  "/dashboard/hospital-pharmacy-drug-store": "hospital-pharmacy-drug-store",
  "/dashboard/hospital-pharmacy-medication-dispensing":
    "hospital-pharmacy-medication-dispensing",
  "/dashboard/sales": "sales",
  "/dashboard/patients": "patients",
  "/dashboard/appointments": "appointments",
  "/dashboard/doctors": "doctors",
  "/dashboard/equipment": "equipment",
  "/dashboard/medical-records": "medical-records",
  "/dashboard/emergency": "emergency",
  "/dashboard/notification": "notification",
  "/dashboard/help": "help",
  "/dashboard/dozaNetwork": "dozaNetwork",
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

// ------------------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------------------
interface DashboardSidebarProps {
  onMessagesToggle?: () => void;
}

export default function DashboardSidebar({
  onMessagesToggle,
}: DashboardSidebarProps) {
  const { center, activePanel, user, navigateToPanel } = useDashboard();

  // State
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mainNav, setMainNav] = useState<NavigationItemWithPanel[]>([]);
  const [extraNav, setExtraNav] = useState<NavigationItemWithPanel[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------------------------------
  // EFFECTS
  // ----------------------------------------------------------------------------
  useEffect(() => setMounted(true), []);

  // Responsive
  useEffect(() => {
    if (!mounted) return;
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mounted]);

  // Build navigation from config
  useEffect(() => {
    if (user && center) {
      const items = getFilteredNavigation(
        user.role as UserRole,
        center.centerType,
      );
      const withPanel = items.map((item) => ({
        ...item,
        panelId: hrefToPanelMap[item.href] || "dashboard",
      }));
      setMainNav(withPanel.slice(0, 4));
      setExtraNav(withPanel.slice(4));
    }
  }, [user, center]);

  // Mobile inactivity timer
  useEffect(() => {
    if (!mounted || !isMobile) return;
    const resetTimer = () => {
      setIsInactive(false);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsInactive(true), 8000);
    };
    const events = [
      "mousedown",
      "touchstart",
      "click",
      "scroll",
      "keydown",
      "mousemove",
      "touchmove",
    ];
    events.forEach((e) =>
      document.addEventListener(e, resetTimer, { passive: true }),
    );
    resetTimer();
    return () => {
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [mounted, isMobile]);

  // Close more menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userInitial = user?.fullName?.charAt(0) || "U";

  // ----------------------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------------------
  const handleMobileNavClick = (item: NavigationItemWithPanel) => {
    navigateToPanel(item.panelId, item.name);
    setShowMoreMenu(false);
    setIsInactive(false);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => setIsInactive(true), 8000);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.clear();
    window.location.href = "/";
  };

  const handleMessagesToggle = () => {
    if (onMessagesToggle) {
      onMessagesToggle();
    } else {
      navigateToPanel("messages", "Messages");
    }
  };

  const handleNotificationsClick = () => {
    navigateToPanel("notification", "Notifications");
  };

  const handleHelpClick = () => {
    navigateToPanel("help", "Help");
  };

  const getCenterTypeDisplay = (type?: string) => {
    if (!type) return "Medical Center";
    const map: Record<string, string> = {
      hospital: "Hospital",
      clinic: "Clinic",
      diagnostic_lab: "Diagnostic Lab",
      pharmacy: "Pharmacy",
      medical_center: "Medical Center",
      dental_clinic: "Dental Clinic",
      optical_center: "Optical Center",
      emergency: "Emergency Center",
      cardiac_center: "Cardiac Center",
    };
    return map[type] || type;
  };

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  if (!mounted) return null;

  // ---------- MOBILE ----------
  if (isMobile) {
    return (
      <div className={poppins.className}>
        {/* Active panel label (top) */}
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
          {activePanel !== "dashboard" && !isInactive && (
            <div className="px-4 py-2 bg-emerald-600/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-xl border border-white/20">
              {panelToPageName[activePanel] || activePanel}
            </div>
          )}
        </div>

        {/* Floating bottom navigation */}
        <div
          className={cn(
            "fixed bottom-[3vh] left-4 right-4 z-50 transition-all duration-500",
            isInactive ? "scale-95 opacity-70" : "scale-100 opacity-100",
          )}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-2xl shadow-2xl border border-white/20" />
            <div className="relative flex items-center justify-between px-2 py-2">
              {mainNav.map((item) => {
                const isActive = activePanel === item.panelId;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleMobileNavClick(item)}
                    className="relative flex-1 flex flex-col items-center justify-center min-w-0 px-1"
                  >
                    <div
                      className={cn(
                        "transition-all duration-300 mb-1 flex items-center justify-center",
                        isActive
                          ? "bg-white/20 backdrop-blur-sm text-white shadow-lg rounded-xl p-2.5"
                          : "text-white/80 hover:bg-white/10 p-2.5 rounded-xl",
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {!isInactive && (
                      <span className="text-[9px] font-medium text-white/90 truncate max-w-full px-1">
                        {item.name.split(" ")[0]}
                      </span>
                    )}
                  </button>
                );
              })}

              {extraNav.length > 0 && (
                <div className="relative flex-1 min-w-0 px-1" ref={moreMenuRef}>
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="relative w-full flex flex-col items-center justify-center"
                  >
                    <div
                      className={cn(
                        "transition-all duration-300 mb-1 flex items-center justify-center",
                        showMoreMenu
                          ? "bg-white/20 backdrop-blur-sm text-white shadow-lg rounded-xl p-2.5"
                          : "text-white/80 hover:bg-white/10 p-2.5 rounded-xl",
                      )}
                    >
                      {showMoreMenu ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <MoreHorizontal className="w-4 h-4" />
                      )}
                    </div>
                    {!isInactive && (
                      <span className="text-[9px] font-medium text-white/70 truncate max-w-full px-1">
                        {showMoreMenu ? "Close" : "More"}
                      </span>
                    )}
                  </button>

                  {showMoreMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 max-h-64 overflow-y-auto bg-emerald-700/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-2">
                      {extraNav.map((item) => {
                        const isActive = activePanel === item.panelId;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleMobileNavClick(item)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                              isActive
                                ? "bg-white/20 text-white shadow-md"
                                : "text-white/80 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DESKTOP ----------
  return (
    <div
      className={cn(
        "w-72 h-screen bg-white border-r border-emerald-50 flex flex-col sticky top-0 overflow-hidden",
        poppins.className,
      )}
    >
      {/* 1. HEADER: Logo + User Profile */}
      <div className="p-6 pb-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Image src="/logo.png" alt="Doza" width={22} height={22} />
          </div>
          <span
            className={cn(
              "text-2xl font-black text-emerald-600 tracking-tighter",
              bebasNeue.className,
            )}
          >
            DOZA
          </span>
        </div>

        {/* User Profile Card */}
        <button
          onClick={() => navigateToPanel("profile", "Profile")}
          className="w-full bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 hover:bg-emerald-100/50 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-200 flex items-center justify-center text-white font-bold text-lg">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-emerald-600 font-medium capitalize">
                {user?.role || "Staff"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || ""}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Center Info */}
        <div className="mt-4 px-1">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-100/60">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-emerald-100 flex-shrink-0">
              {center?.logo ? (
                <Image
                  src={center.logo}
                  alt={center.centerName || "Center"}
                  width={32}
                  height={32}
                  className="object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                {center?.centerName || "Medical Center"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {getCenterTypeDisplay(center?.centerType)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        <p className="text-[9px] font-black text-emerald-200 uppercase tracking-[0.2em] px-4 mb-3">
          Medical Suite
        </p>
        {[...mainNav, ...extraNav].map((item) => {
          const isActive = activePanel === item.panelId;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => navigateToPanel(item.panelId, item.name)}
              className={cn(
                "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                  : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600",
              )}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-white"
                    : "text-emerald-500/50 group-hover:text-emerald-600"
                }
              />
              <span className="text-xs font-bold">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="ml-auto w-1 h-4 bg-white/40 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. BOTTOM UTILITY BAR */}
      <div className="p-4 mt-auto">
        <div className="bg-emerald-600 rounded-2xl p-1.5 flex items-center justify-between shadow-xl shadow-emerald-900/10 border border-white/10">
          {/* Notifications - navigates to NotificationsPanel */}
          <button
            onClick={handleNotificationsClick}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              activePanel === "notification"
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Notifications"
          >
            <Bell size={16} />
            {/* Optional badge - can be fetched from API */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full border border-emerald-600" />
          </button>

          {/* Messages */}
          <button
            onClick={handleMessagesToggle}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              activePanel === "messages"
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Messages"
          >
            <MessageCircle size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full border border-emerald-600" />
          </button>

          {/* Settings */}
          <button
            onClick={() => navigateToPanel("settings", "Settings")}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              activePanel === "settings"
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Settings"
          >
            <Settings size={16} />
          </button>

          {/* Help - navigates to HelpPanel */}
          <button
            onClick={handleHelpClick}
            className={cn(
              "p-2.5 rounded-xl transition-all relative group",
              activePanel === "help"
                ? "bg-white text-emerald-600"
                : "text-emerald-100 hover:text-white hover:bg-white/10",
            )}
            title="Help"
          >
            <HelpCircle size={16} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl transition-all relative group text-emerald-100 hover:text-white hover:bg-white/10"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>

        <p className="text-[8px] text-center text-emerald-600 mt-4 font-bold tracking-widest uppercase opacity-40">
          Doza Health © 2024
        </p>
      </div>
    </div>
  );
}
