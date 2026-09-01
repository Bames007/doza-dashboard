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
  MoreVertical,
  CheckCheck,
  Trash2,
  ChevronRight,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  Stethoscope,
  Pill,
  FlaskConical,
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

// ─── Helper Components ──────────────────────────────────────────────

const getNotificationIcon = (type: Notification["type"]) => {
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

const getIconColor = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return "text-purple-500 bg-purple-50 border-purple-200";
    case "message":
      return "text-blue-500 bg-blue-50 border-blue-200";
    case "inventory":
      return "text-amber-500 bg-amber-50 border-amber-200";
    case "patient":
      return "text-emerald-500 bg-emerald-50 border-emerald-200";
    case "reminder":
      return "text-orange-500 bg-orange-50 border-orange-200";
    case "prescription":
      return "text-rose-500 bg-rose-50 border-rose-200";
    case "test":
      return "text-indigo-500 bg-indigo-50 border-indigo-200";
    default:
      return "text-slate-500 bg-slate-50 border-slate-200";
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

const formatFullDate = (isoString: string) => {
  return new Date(isoString).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─── Main Component ──────────────────────────────────────────────────

export default function NotificationsPanel() {
  const { center, user } = useDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedNotification = notifications.find((n) => n.id === selectedId);

  // Fetch notifications
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
  }, [center?.id, user?.id]);

  // Mark as read
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

  // Mark all as read
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

  // Clear all
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
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
          poppins.className,
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
          <div className="h-20 bg-white rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 h-20 animate-pulse"
                />
              ))}
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 h-96 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
          poppins.className,
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h3
              className={cn(
                "text-xl font-bold text-slate-800",
                bebasNeue.className,
              )}
            >
              Failed to load notifications
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-4 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────

  if (notifications.length === 0) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
          poppins.className,
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3
              className={cn(
                "text-2xl font-bold text-slate-800",
                bebasNeue.className,
              )}
            >
              All caught up!
            </h3>
            <p className={cn("text-sm text-slate-500 mt-1", poppins.className)}>
              You have no notifications at the moment. Check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                  Notifications Center
                </span>
              </div>
              <h1
                className={cn(
                  "text-3xl md:text-4xl text-slate-900 tracking-tight font-black",
                  bebasNeue.className,
                )}
              >
                Notifications
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-medium transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Split Panel ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: List (4 cols on large) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 max-h-[600px] overflow-y-auto">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getIconColor(notification.type);
                const isSelected = selectedId === notification.id;
                const isRead = notification.read;

                return (
                  <button
                    key={notification.id}
                    onClick={() => {
                      setSelectedId(notification.id);
                      if (!isRead) markAsRead(notification.id);
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all mb-1.5 last:mb-0",
                      isSelected
                        ? "bg-emerald-50 border border-emerald-200 shadow-sm"
                        : "hover:bg-slate-50 border border-transparent",
                      !isRead && "bg-blue-50/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          iconColor,
                          "ring-1 ring-slate-200/50",
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              "text-xs font-semibold text-slate-800 truncate",
                              !isRead && "font-bold",
                            )}
                          >
                            {notification.title}
                          </h4>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 truncate mt-0.5">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detail (8 cols on large) */}
          <div className="lg:col-span-8">
            {selectedNotification ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-full min-h-[400px]">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        getIconColor(selectedNotification.type),
                      )}
                    >
                      {React.createElement(
                        getNotificationIcon(selectedNotification.type),
                        {
                          className: "w-5 h-5",
                        },
                      )}
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "text-lg font-bold text-slate-800",
                          bebasNeue.className,
                        )}
                      >
                        {selectedNotification.title}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {formatFullDate(selectedNotification.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!selectedNotification.read && (
                      <button
                        onClick={() => markAsRead(selectedNotification.id)}
                        className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition-colors"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {/* Sender Info */}
                  {(selectedNotification.senderName ||
                    selectedNotification.patientName) && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Sender Information
                      </h4>
                      <div className="space-y-2">
                        {selectedNotification.senderName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              {selectedNotification.senderName}
                            </span>
                            {selectedNotification.senderRole && (
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {selectedNotification.senderRole}
                              </span>
                            )}
                          </div>
                        )}
                        {selectedNotification.patientName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Stethoscope className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">
                              Patient: {selectedNotification.patientName}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">
                            {center?.centerName || "Medical Center"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Related ID (if any) */}
                  {selectedNotification.relatedId && (
                    <div className="text-xs text-slate-400">
                      Reference ID:{" "}
                      <span className="font-mono">
                        {selectedNotification.relatedId.slice(0, 8)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 h-full min-h-[400px] flex items-center justify-center text-center">
                <div>
                  <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Select a notification to view details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80"
            >
              <h3
                className={cn(
                  "text-xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                Clear All Notifications?
              </h3>
              <p
                className={cn("text-sm text-slate-600 mt-2", poppins.className)}
              >
                This action will permanently delete all notifications. This
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAll}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-sm font-medium"
                >
                  Yes, clear all
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
