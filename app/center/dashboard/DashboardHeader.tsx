"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDashboard } from "./DashboardContext";
import {
  Bell,
  User,
  X,
  LogOut,
  Settings,
  HelpCircle,
  Calendar,
  FileText,
  Users,
  MessageCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

interface DashboardHeaderProps {
  onMessagesToggle?: () => void;
  onSearchToggle?: () => void;
}

interface Notification {
  id: number;
  message: string;
  time: string;
  unread: boolean;
  type: string;
  icon: LucideIcon;
}

// ─── Live clock hook ─────────────────────────────────────────────
const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
};

// ─── Greeting helper (mobile only, short form) ───────────────────
const getShortGreeting = (hour: number): string => {
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
};

// ─── Role formatter: center_owner → Center Owner ─────────────────
const formatRole = (role?: string): string => {
  if (!role) return "Staff";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function DashboardHeader({
  onMessagesToggle,
}: DashboardHeaderProps) {
  const { user, logout, currentPage, setMobileMenuOpen } = useDashboard();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const now = useClock();

  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const notifications: Notification[] = [
    {
      id: 1,
      message: "New appointment with John Smith",
      time: "5 min ago",
      unread: true,
      type: "appointment",
      icon: Calendar,
    },
    {
      id: 2,
      message: "Lab results ready for review",
      time: "1 hour ago",
      unread: true,
      type: "lab",
      icon: FileText,
    },
    {
      id: 3,
      message: "Patient check-in for Room 204",
      time: "2 hours ago",
      unread: false,
      type: "patient",
      icon: Users,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const greeting = getShortGreeting(now.getHours());
  const firstName = user?.fullName?.split(" ")[0] || "User";
  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";
  const avatarUrl = user?.avatar || null;
  const displayRole = formatRole(user?.role);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close desktop dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync overlay state to dashboard context
  useEffect(() => {
    setMobileMenuOpen(isMenuOpen || isNotificationsOpen);
  }, [isMenuOpen, isNotificationsOpen, setMobileMenuOpen]);

  const toggleNotifications = () => setIsNotificationsOpen((prev) => !prev);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  // ─────────────────────────────────────────────────────────────
  // MOBILE VIEW
  // ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Avatar + Greeting + Name + Role + Time */}
            <button
              onClick={toggleMenu}
              className="flex items-center gap-3 text-left min-w-0 group"
              aria-label="Open profile"
            >
              {/* Rounded square avatar */}
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-200/60 overflow-hidden flex items-center justify-center shrink-0 group-active:scale-95 transition-transform">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-emerald-700 font-bold text-base">
                    {userInitial}
                  </span>
                )}
              </div>

              {/* Text block — Morning Name on top, role · time below */}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                  {greeting} {firstName}
                </p>
                <p className="text-[11px] text-slate-500 font-medium leading-snug truncate mt-0.5">
                  {displayRole} ·{" "}
                  <span className="tabular-nums">{timeLabel}</span>
                </p>
              </div>
            </button>

            {/* Right: Messages + Notifications */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onMessagesToggle}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all relative"
                aria-label="Messages"
              >
                <MessageCircle className="w-[18px] h-[18px] stroke-[2.2]" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full ring-2 ring-emerald-600" />
              </button>

              <button
                onClick={toggleNotifications}
                className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl flex items-center justify-center transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px] stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-emerald-600" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Profile Bottom Sheet */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 z-50 border-t border-slate-100 shadow-2xl"
              >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={firstName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-emerald-700 font-bold text-xl">
                        {userInitial}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-lg truncate">
                      {user?.fullName || firstName}
                    </p>
                    <p className="text-xs text-slate-500">{displayRole}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                    <HelpCircle className="w-4 h-4 text-slate-400" /> Help
                    Center
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors pt-3"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Notifications Bottom Sheet */}
        <AnimatePresence>
          {isNotificationsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsNotificationsOpen(false)}
                className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-6 z-50 border-t border-slate-100 shadow-2xl max-h-[80vh] flex flex-col"
              >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-lg">
                    Notifications
                  </h3>
                  <span className="text-xs text-emerald-600 font-semibold">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-100 -mx-2">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "px-2 py-3 flex gap-3 items-start",
                          n.unread && "bg-emerald-50/40 rounded-lg",
                        )}
                      >
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shrink-0">
                          <n.icon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {n.time}
                          </p>
                        </div>
                        {n.unread && (
                          <span className="w-2 h-2 mt-1.5 bg-emerald-500 rounded-full shrink-0" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DESKTOP / TABLET VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60",
        poppins.className,
      )}
    >
      <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
        {/* Left: Page title */}
        <div className="min-w-0">
          <h1 className={cn("text-xl text-slate-900", bebasNeue.className)}>
            {currentPage}
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2" ref={dropdownRef}>
          {/* Live clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
              {timeLabel}
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="text-[11px] font-medium text-slate-500">
              {dateLabel}
            </span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Notifications
                      </h3>
                      <p className="text-xs text-slate-500">
                        {unreadCount} unread
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button className="text-[10px] font-bold text-emerald-600 hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          "p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                          n.unread && "bg-emerald-50/50",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                            <n.icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900">
                              {n.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {n.time}
                            </p>
                          </div>
                          {n.unread && (
                            <span className="w-2 h-2 mt-1 bg-emerald-500 rounded-full shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <button
            onClick={onMessagesToggle}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Messages"
          >
            <MessageCircle className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userInitial}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {firstName}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {displayRole}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      {userInitial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                      <HelpCircle className="w-4 h-4" /> Help
                    </button>
                    <hr className="my-2 border-slate-100" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
