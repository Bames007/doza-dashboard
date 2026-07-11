// app/center/dashboard/dashboards/hooks/useLabTests.ts
import { useState, useEffect } from "react";
import { useDashboard } from "../../DashboardContext";
import { LabTest } from "../../types/lab";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string): id is string => !!id && id !== "undefined";

interface LabTestsData {
  pending: number;
  completedToday: number;
  completedYesterday: number;
  urgent: number;
  list: LabTest[];
}

export const useLabTests = (centerId?: string) => {
  const { user } = useDashboard();
  const [data, setData] = useState<LabTestsData>({
    pending: 0,
    completedToday: 0,
    completedYesterday: 0,
    urgent: 0,
    list: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !isValidId(user?.id)) {
      setLoading(false);
      return;
    }

    const fetchTests = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiFetch(`/api/centers/${centerId}/lab-tests`, {
          userId: user.id,
          cacheKey: `labTests_${centerId}`,
          cacheDuration: 2 * 60 * 1000,
        });
        const tests: LabTest[] = Array.isArray(result) ? result : [];
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];

        const pending = tests.filter((t) => t.status === "pending").length;
        const completedToday = tests.filter(
          (t) => t.status === "completed" && t.collectionDate === today,
        ).length;
        const completedYesterday = tests.filter(
          (t) => t.status === "completed" && t.collectionDate === yesterday,
        ).length;
        const urgent = tests.filter(
          (t) =>
            t.status === "pending" &&
            ((t as any).priority === "urgent" ||
              (t as any).priority === "stat"),
        ).length;

        setData({
          pending,
          completedToday,
          completedYesterday,
          urgent,
          list: tests.filter(
            (t) => t.status === "pending" || t.status === "processing",
          ),
        });
      } catch (err: any) {
        setError(err.message || "Failed to load lab tests");
        setData({
          pending: 0,
          completedToday: 0,
          completedYesterday: 0,
          urgent: 0,
          list: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [centerId, user?.id]);

  return { tests: data, loading, error };
};
