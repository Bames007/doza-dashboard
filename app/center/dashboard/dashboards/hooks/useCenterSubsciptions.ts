import { useEffect, useState } from "react";
import { apiFetch, apiPost } from "@/app/lib/api";

export function useCenterSubscriptions(centerId?: string) {
  const [data, setData] = useState<{
    current: any | null;
    pending: any | null;
    history: any[];
  }>({ current: null, pending: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!centerId) return;
    setLoading(true);
    try {
      const response = await apiFetch(
        `/api/center-subscriptions?centerId=${centerId}`,
      );
      setData({
        current: response.current || null,
        pending: response.pending || null,
        history: response.history || [],
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (payload: any) => {
    const result = await apiPost("/api/center-subscriptions", {
      centerId,
      ...payload,
    });
    await fetchSubscriptions();
    return result;
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [centerId]);

  return {
    data,
    loading,
    error,
    refetch: fetchSubscriptions,
    createSubscription,
  };
}
