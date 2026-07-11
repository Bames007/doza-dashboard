// app/center/dashboards/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/app/lib/api";

export function useNotifications(centerId?: string, userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch(`/api/centers/${centerId}/notifications`, {
        userId,
        cacheKey: `notifications_${centerId}`,
        cacheDuration: 5 * 60 * 1000,
      });
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(
        Array.isArray(data) ? data.filter((n: any) => !n.read).length : 0,
      );
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [centerId, userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const markAsRead = async (id: string) => {
    if (!centerId || !userId) return;
    try {
      await apiFetch(`/api/centers/${centerId}/notifications/${id}`, {
        userId,
        method: "PATCH",
      });
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  return { notifications, unreadCount, loading, refetch, markAsRead };
}
