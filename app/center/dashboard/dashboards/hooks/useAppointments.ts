// app/center/dashboard/hooks/shared/useAppointments.ts
import { useState, useEffect } from "react";
import { useDashboard } from "../../DashboardContext";
import { Appointment } from "../../types/appointment";
import { apiFetch } from "@/app/lib/api";

interface UseAppointmentsOptions {
  date?: string;
  status?: string;
  patientId?: string;
  serviceType?: string; // e.g., "dental", "optical", etc.
}

const isValidId = (id?: string): id is string => {
  return !!id && id !== "undefined";
};

export const useAppointments = (options: UseAppointmentsOptions = {}) => {
  const { center, user } = useDashboard();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(center?.id) || !isValidId(user?.id)) {
      setLoading(false);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (options.date) params.append("date", options.date);
        if (options.status) params.append("status", options.status);
        if (options.patientId) params.append("patientId", options.patientId);
        if (options.serviceType)
          params.append("serviceType", options.serviceType);

        const result = await apiFetch(
          `/api/centers/${center.id}/appointments?${params}`,
          { userId: user.id },
        );
        setAppointments(Array.isArray(result) ? result : []);
      } catch (err: any) {
        setError(err.message || "Failed to load appointments");
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [
    center?.id,
    user?.id,
    options.date,
    options.status,
    options.patientId,
    options.serviceType,
  ]);

  return { appointments, loading, error };
};
