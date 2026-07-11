// app/center/dashboard/components/NotificationBell.tsx

"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, Loader2 } from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { useNotifications } from "../../dashboards/hooks/useNotifications";
import { cn } from "@/app/utils/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const { center, user } = useDashboard();
  const { notifications, unreadCount, loading, refetch, markAsRead } =
    useNotifications(center?.id);
  const [open, setOpen] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!open) refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch, open]);

  // Refetch when bell is opened
  const handleToggle = () => {
    setOpen(!open);
    if (!open) refetch();
  };

  if (loading && !notifications.length) {
    return (
      <div className="relative">
        <div className="p-2 rounded-full hover:bg-slate-100 transition">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-slate-100 transition focus:ring-2 focus:ring-blue-500/40"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-[70vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-slate-100 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-3 hover:bg-slate-50 transition flex items-start gap-2",
                      !n.read && "bg-blue-50/50",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="mt-1 p-1 text-blue-600 hover:text-blue-800 transition"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {notifications.length > 10 && (
                  <div className="p-2 text-center text-xs text-slate-500">
                    Showing 10 of {notifications.length}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
