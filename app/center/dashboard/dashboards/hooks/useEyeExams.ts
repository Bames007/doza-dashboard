// app/center/dashboard/dashboards/hooks/useEyeExams.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/app/lib/api";

export interface EyeExamsData {
  today: number;
  completed: number;
  scheduled: number;
  upcoming: Array<{
    id: string;
    patient: string;
    time: string;
    doctor: string;
    type: string;
  }>;
}

export function useEyeExams(centerId?: string, userId?: string) {
  const [exams, setExams] = useState<EyeExamsData>({
    today: 0,
    completed: 0,
    scheduled: 0,
    upcoming: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!centerId || !userId) {
      setLoading(false);
      return;
    }

    const fetchExams = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/centers/${centerId}/optical/exams`, {
          userId,
        });
        setExams(
          data || { today: 0, completed: 0, scheduled: 0, upcoming: [] },
        );
      } catch (err: any) {
        setError(err.message || "Failed to load eye exams");
        setExams({ today: 0, completed: 0, scheduled: 0, upcoming: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [centerId, userId]);

  return { exams, loading, error };
}
