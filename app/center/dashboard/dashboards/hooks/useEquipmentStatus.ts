// app/center/dashboard/dashboards/hooks/useEquipmentStatus.ts
import { useState, useEffect } from "react";
import { useDashboard } from "../../DashboardContext";
import { Equipment } from "../../panels/EquipmentPanel";
import { apiFetch } from "@/app/lib/api";

const isValidId = (id?: string): id is string => {
  return !!id && id !== "undefined";
};

interface EquipmentStatusData {
  operational: number;
  total: number;
  maintenance: number;
  list: Equipment[];
}

export const useEquipmentStatus = (centerId?: string) => {
  const { user } = useDashboard();
  const [data, setData] = useState<EquipmentStatusData>({
    operational: 0,
    total: 0,
    maintenance: 0,
    list: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isValidId(centerId) || !isValidId(user?.id)) {
      setLoading(false);
      return;
    }

    const fetchEquipment = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await apiFetch(`/api/centers/${centerId}/equipment`, {
          userId: user.id,
        });
        const equip: Equipment[] = Array.isArray(result) ? result : [];
        const total = equip.length;
        const operational = equip.filter(
          (e) => e.status === "operational",
        ).length;
        const maintenance = equip.filter(
          (e) => e.status === "maintenance",
        ).length;
        setData({ operational, total, maintenance, list: equip });
      } catch (err: any) {
        setError(err.message || "Failed to load equipment");
        setData({ operational: 0, total: 0, maintenance: 0, list: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [centerId, user?.id]);

  return { equipment: data, loading, error };
};
