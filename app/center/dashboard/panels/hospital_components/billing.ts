// app/center/dashboard/utils/billing.ts

export async function addBillItem(
  centerId: string,
  userId: string,
  userFullName: string,
  userRole: string,
  patientId: string,
  item: {
    type: "prescription" | "lab_test" | "consultation" | "bed" | "other";
    description: string;
    amount: number;
    quantity?: number;
  },
) {
  try {
    const res = await fetch(
      `/api/centers/${centerId}/patients/${patientId}/bills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-name": userFullName || "Unknown",
          "x-user-role": userRole || "staff",
        },
        body: JSON.stringify({
          items: [item],
          notes: `Auto‑generated from ${item.type}`,
        }),
      },
    );
    const data = await res.json();
    if (!data.success) console.error("Failed to add bill item", data.error);
    return data;
  } catch (error) {
    console.error("Error adding bill item", error);
    throw error;
  }
}
