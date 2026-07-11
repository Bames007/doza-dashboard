// app/hooks/useDozaMedic.ts
import { useState } from "react";
import { toast } from "react-hot-toast";

export const useDozaMedic = () => {
  const [loading, setLoading] = useState(false);

  const inviteToDozaMedic = async (
    staffId: string,
    staffEmail: string,
    centerId: string,
    centerName: string,
    invitedBy: string
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/medics/register/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId,
          email: staffEmail,
          centerId,
          centerName,
          invitedBy,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      if (data.status === "already_exists") {
        toast.success("Invitation was already sent");
      } else {
        toast.success("Invitation sent successfully!");
      }

      return data;
    } catch (error) {
      console.error("Error inviting to Doza Medic:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkMedicStatus = async (email: string) => {
    try {
      const response = await fetch(
        `/api/medics/check?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check status");
      }

      return data;
    } catch (error) {
      console.error("Error checking medic status:", error);
      throw error;
    }
  };

  const linkExistingMedic = async (
    centerId: string,
    staffId: string,
    medicId: string
  ) => {
    try {
      const response = await fetch(
        `/api/centers/${centerId}/staff/${staffId}/link-medic`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ medicId }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link accounts");
      }

      toast.success("Doza Medic account linked successfully!");
      return data;
    } catch (error) {
      console.error("Error linking medic:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to link accounts"
      );
      throw error;
    }
  };

  return {
    loading,
    inviteToDozaMedic,
    checkMedicStatus,
    linkExistingMedic,
  };
};
