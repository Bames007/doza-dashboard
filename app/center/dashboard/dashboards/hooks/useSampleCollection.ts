// app/center/dashboard/dashboards/hooks/useSampleCollection.ts
import { useState, useEffect } from "react";
import { useDashboard } from "../../DashboardContext";
import { apiFetch } from "@/app/lib/api";

interface SampleData {
  today: number;
  pending: number;
  yesterday: number;
}

export const useSampleCollection = (centerId?: string) => {
  const { user } = useDashboard();
  const [data, setData] = useState<SampleData>({
    today: 0,
    pending: 0,
    yesterday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !user?.id) {
      setLoading(false);
      return;
    }
    const fetchSamples = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiFetch(`/api/centers/${centerId}/samples`, {
          userId: user.id,
        });
        const samples = result || {};
        setData({
          today: samples.today || 0,
          pending: samples.pending || 0,
          yesterday: samples.yesterday || 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load sample collection");
        setData({ today: 0, pending: 0, yesterday: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchSamples();
  }, [centerId, user?.id]);

  return { samples: data, loading, error };
};
