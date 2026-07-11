import { useState, useCallback } from "react";
import { Customer } from "../types/pharmacy";
import { ApiWrapper } from "@/app/utils/apiWrapper";

export const useCustomers = (
  centerId: string,
  userId: string,
  apiWrapper: ApiWrapper | null
) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [selectedDozaUser, setSelectedDozaUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Load customers from API
  const loadCustomers = useCallback(async () => {
    if (!apiWrapper) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/centers/${centerId}/customers`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading customers:", error);

      // Fallback: try API wrapper
      try {
        const result = await apiWrapper.get(
          `/api/centers/${centerId}/customers`
        );
        if (result.success) {
          setCustomers(result.data || []);
        }
      } catch (wrapperError) {
        console.error("Error with API wrapper:", wrapperError);
      }
    } finally {
      setLoading(false);
    }
  }, [centerId, userId, apiWrapper]);

  // In useCustomers hook
  const searchDozaUser = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return [];
      }

      console.log("🔍 Searching Doza users:", searchTerm);

      try {
        // Try API first
        let dozaUsers: any[] = [];

        // Check if we should use API wrapper or fetch directly
        if (apiWrapper) {
          const result = await apiWrapper.get(
            `/api/doza-users?search=${encodeURIComponent(
              searchTerm
            )}&centerId=${centerId}`
          );

          if (result.success) {
            dozaUsers = result.data || [];
          }
        } else {
          // Fetch directly
          const response = await fetch(
            `/api/doza-users?search=${encodeURIComponent(
              searchTerm
            )}&centerId=${centerId}`
          );

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              dozaUsers = result.data || [];
            }
          }
        }

        console.log("✅ Found Doza users:", dozaUsers.length);

        // If no results from API, try local storage
        if (dozaUsers.length === 0) {
          const localUsers = JSON.parse(
            localStorage.getItem(`doza_users_${centerId}`) || "[]"
          );

          const filtered = localUsers.filter(
            (user: any) =>
              user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.phone?.includes(searchTerm) ||
              user.dozaCode?.toLowerCase().includes(searchTerm.toLowerCase())
          );

          dozaUsers = filtered;
        }

        return dozaUsers;
      } catch (error) {
        console.error("Error searching Doza users:", error);

        // Fallback to local storage
        const localUsers = JSON.parse(
          localStorage.getItem(`doza_users_${centerId}`) || "[]"
        );

        const filtered = localUsers.filter(
          (user: any) =>
            user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.includes(searchTerm) ||
            user.dozaCode?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered;
      }
    },
    [centerId, apiWrapper]
  );

  return {
    customers,
    selectedCustomer,
    selectedDozaUser,
    loading,
    loadCustomers,
    setSelectedCustomer,
    setSelectedDozaUser,
    searchDozaUser,
  };
};
