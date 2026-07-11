// app/center/dashboard/panels/NotificationsPanel.tsx
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
    | "reminder";
  read: boolean;
  createdAt: string; // ISO date string
  link?: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  error?: string;
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
    default:
      return AlertCircle;
  }
};

const getIconColor = (type: Notification["type"]) => {
  switch (type) {
    case "appointment":
      return "text-purple-500 bg-purple-50";
    case "message":
      return "text-blue-500 bg-blue-50";
    case "inventory":
      return "text-amber-500 bg-amber-50";
    case "patient":
      return "text-emerald-500 bg-emerald-50";
    case "reminder":
      return "text-orange-500 bg-orange-50";
    default:
      return "text-slate-500 bg-slate-50";
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

// ─── Main Component ──────────────────────────────────────────────────

export default function NotificationsPanel() {
  const { center, user } = useDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      const data: NotificationsResponse = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
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

  // Mark a single notification as read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/notifications/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
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

  // Clear all notifications
  const clearAll = async () => {
    try {
      const res = await fetch(`/api/centers/${center?.id}/notifications`, {
        method: "DELETE",
        headers: { "x-user-id": user?.id || "" },
      });
      if (res.ok) {
        setNotifications([]);
        setUnreadCount(0);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  // ─── Loading State ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-56 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-5 w-72 bg-slate-100 rounded animate-pulse mt-1" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-200 rounded" />
                </div>
                <div className="w-5 h-5 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
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
    );
  }

  // ─── Empty State ────────────────────────────────────────────────────

  if (notifications.length === 0) {
    return (
      <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
                bebasNeue.className,
              )}
            >
              Notifications
            </h1>
            <p className="text-sm text-slate-500">
              Stay updated with your center's activity
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-10 h-10 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-xl font-bold text-slate-800",
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
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Notifications
          </h1>
          <p className="text-sm text-slate-500">
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

      {/* Notification List */}
      <div className="space-y-3">
        {notifications.map((notification, index) => {
          const Icon = getNotificationIcon(notification.type);
          const iconColor = getIconColor(notification.type);
          const isRead = notification.read;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "bg-white rounded-2xl p-4 border shadow-sm transition-all",
                isRead
                  ? "border-slate-200/80"
                  : "border-emerald-200/80 bg-emerald-50/30 hover:bg-emerald-50/50",
                "hover:shadow-md",
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    iconColor,
                    "ring-1 ring-slate-200/50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={cn(
                        "font-semibold text-slate-800",
                        isRead ? "text-sm" : "text-sm font-bold",
                        poppins.className,
                      )}
                    >
                      {notification.title}
                    </h4>
                    {!isRead && (
                      <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm text-slate-600 mt-0.5",
                      poppins.className,
                    )}
                  >
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={cn(
                        "text-xs text-slate-400",
                        poppins.className,
                      )}
                    >
                      {formatTime(notification.createdAt)}
                    </span>
                    {!isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-[10px] font-medium text-emerald-600 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {notification.link && (
                  <button
                    onClick={() => window.open(notification.link, "_blank")}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
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
