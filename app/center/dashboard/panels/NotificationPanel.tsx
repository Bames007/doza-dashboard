"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCircle,
  Clock,
  Calendar,
  MessageCircle,
  Users,
  Package,
  AlertCircle,
  CheckCheck,
  Trash2,
  ChevronRight,
  User,
  Building,
  Stethoscope,
  Pill,
  FlaskConical,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";

// ─── Types ────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "appointment"
    | "message"
    | "inventory"
    | "patient"
    | "system"
    | "reminder"
    | "prescription"
    | "test";
  read: boolean;
  createdAt: string;
  link?: string;
  senderName?: string;
  senderRole?: string;
  patientName?: string;
  relatedId?: string;
}

// ─── Type-based icon + tone (emerald/slate/amber/rose only) ──────────

const getTypeIcon = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return Calendar;
    case "message":
      return MessageCircle;
    case "inventory":
      return Package;
    case "patient":
      return Users;
    case "reminder":
      return Clock;
    case "prescription":
      return Pill;
    case "test":
      return FlaskConical;
    default:
      return AlertCircle;
  }
};

const getTypeTone = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
    case "test":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "message":
    case "patient":
    case "prescription":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "inventory":
    case "reminder":
      return "bg-amber-50 text-amber-600 border-amber-100";
    case "system":
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatFullDate = (isoString: string) =>
  new Date(isoString).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Main Component ──────────────────────────────────────────────────

export default function NotificationsPanel() {
  const { center, user } = useDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const selectedNotification = notifications.find((n) => n.id === selectedId);

  const fetchNotifications = async () => {
    if (!center?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/centers/${center.id}/notifications`, {
        headers: { "x-user-id": user?.id || "" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(
          data.data?.filter((n: Notification) => !n.read).length || 0,
        );
        if (data.data?.length > 0 && !selectedId) {
          setSelectedId(data.data[0].id);
        }
      } else {
        throw new Error(data.error || "Failed to load notifications");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.id, user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/notifications/${id}`,
        {
          method: "PATCH",
          headers: { "x-user-id": user?.id || "" },
          body: JSON.stringify({ read: true }),
        },
      );
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/notifications/mark-all`,
        {
          method: "PATCH",
          headers: { "x-user-id": user?.id || "" },
        },
      );
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const clearAll = async () => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/notifications`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setSelectedId(null);
        setShowDeleteConfirm(false);
        setMobileView("list");
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const n = notifications.find((x) => x.id === id);
    if (n && !n.read) markAsRead(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileView("detail");
    }
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  // ─── Loading ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
        <div className="mb-3 md:mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
            <div className="h-4 w-10 bg-slate-200 rounded-full" />
          </div>
          <div className="h-7 w-48 bg-slate-200 rounded mb-1" />
          <div className="h-3 w-56 bg-slate-100 rounded" />
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-3.5 h-20"
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="pb-24 pt-6 px-3 md:px-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-rose-200 p-6 md:p-10 text-center">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-900 mb-1.5",
              bebasNeue.className,
            )}
          >
            Failed to load notifications
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            {error}
          </p>
          <button
            onClick={fetchNotifications}
            className="px-4 md:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Empty ──────────────────────────────────────────────────────────

  if (notifications.length === 0) {
    return (
      <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto">
        <header className="mb-3 md:mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Notifications
            </span>
          </div>
          <h1
            className={cn(
              "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
              bebasNeue.className,
            )}
          >
            Notifications
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500">
            Stay up to date with your center
          </p>
        </header>

        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
            <CheckCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-900 mb-1",
              bebasNeue.className,
            )}
          >
            All caught up!
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            You have no notifications at the moment. Check back later.
          </p>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto">
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Notifications
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {notifications.length}
            </span>
            {unreadCount > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Notifications
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          {unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
            : "All caught up!"}
        </p>

        {/* Action buttons */}
        <div className="mt-3 flex gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear all
          </button>
        </div>
      </header>

      {/* ─── Master-Detail Layout ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5">
        {/* List — full width on mobile list view */}
        <div
          className={cn(
            "lg:col-span-5 xl:col-span-4 lg:block",
            mobileView === "list" ? "block" : "hidden",
          )}
        >
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="max-h-[calc(100vh-16rem)] lg:max-h-[600px] overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = getTypeIcon(notification.type);
                const tone = getTypeTone(notification.type);
                const isSelected = selectedId === notification.id;
                const isRead = notification.read;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleSelect(notification.id)}
                    className={cn(
                      "w-full text-left p-3 md:p-3.5 border-b border-slate-100 last:border-0 transition-colors",
                      isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50/60",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn("p-2 rounded-lg border shrink-0", tone)}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h4
                            className={cn(
                              "text-xs md:text-sm text-slate-900 truncate",
                              !isRead
                                ? "font-bold"
                                : "font-semibold text-slate-700",
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                          {notification.message}
                        </p>
                        <span className="text-[9px] md:text-[10px] text-slate-400 mt-1 block tabular-nums">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail — full width on mobile detail view */}
        <div
          className={cn(
            "lg:col-span-7 xl:col-span-8 lg:block",
            mobileView === "detail" ? "block" : "hidden",
          )}
        >
          {selectedNotification ? (
            <>
              {/* Mobile back button */}
              <button
                onClick={handleBackToList}
                className="lg:hidden flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mb-2 -ml-0.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to list
              </button>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 md:p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border shrink-0",
                      getTypeTone(selectedNotification.type),
                    )}
                  >
                    {React.createElement(
                      getTypeIcon(selectedNotification.type),
                      { className: "w-4 h-4" },
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "text-sm md:text-base font-bold text-slate-900 leading-tight mb-1",
                        bebasNeue.className,
                      )}
                    >
                      {selectedNotification.title}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-slate-400 tabular-nums">
                      {formatFullDate(selectedNotification.createdAt)}
                    </p>
                  </div>
                  {!selectedNotification.read && (
                    <button
                      onClick={() => markAsRead(selectedNotification.id)}
                      className="shrink-0 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>

                {/* Message */}
                <div className="bg-slate-50 rounded-xl p-3 md:p-3.5 border border-slate-100 mb-4">
                  <p className="text-[11px] md:text-xs text-slate-700 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Sender info */}
                {(selectedNotification.senderName ||
                  selectedNotification.patientName) && (
                  <div className="bg-slate-50/60 rounded-xl p-3 md:p-3.5 border border-slate-100 mb-3">
                    <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Sender Information
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNotification.senderName && (
                        <div className="flex items-center gap-2 text-[11px] md:text-xs">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 truncate">
                            {selectedNotification.senderName}
                          </span>
                          {selectedNotification.senderRole && (
                            <span className="text-[9px] uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                              {selectedNotification.senderRole}
                            </span>
                          )}
                        </div>
                      )}
                      {selectedNotification.patientName && (
                        <div className="flex items-center gap-2 text-[11px] md:text-xs">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 truncate">
                            Patient: {selectedNotification.patientName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] md:text-xs">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 truncate">
                          {center?.centerName || "Medical Center"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Related ID */}
                {selectedNotification.relatedId && (
                  <div className="text-[10px] text-slate-400">
                    Reference:{" "}
                    <span className="font-mono text-slate-600">
                      {selectedNotification.relatedId.slice(0, 8)}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden lg:flex bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px] items-center justify-center text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2.5">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-[11px] md:text-xs text-slate-500">
                  Select a notification to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Clear All Confirmation ──────────────────────────── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setShowDeleteConfirm(false)
            }
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 240 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sm:hidden pt-2 pb-1 flex justify-center">
                <div className="w-10 h-1 bg-slate-200 rounded-full" />
              </div>

              <div className="p-4 sm:p-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3
                  className={cn(
                    "text-base sm:text-lg font-bold text-slate-900 mb-1",
                    bebasNeue.className,
                  )}
                >
                  Clear All Notifications?
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  This action will permanently delete all notifications. This
                  cannot be undone.
                </p>
              </div>

              <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAll}
                  className="w-full sm:flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
