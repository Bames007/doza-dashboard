export const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

export const getDateLabel = (dateStr: string) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(dateStr);
  const dateKey = d.toISOString().split("T")[0];
  const todayKey = today.toISOString().split("T")[0];
  const yesterdayKey = yesterday.toISOString().split("T")[0];
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return formatDate(dateStr);
};

export const formatAge = (dob: string) => {
  if (!dob) return "N/A";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} years`;
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "inactive":
      return "text-slate-600 bg-slate-100 border-slate-200";
    case "discharge_pending":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-slate-600 bg-slate-100 border-slate-200";
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "discharge_pending":
      return "Discharge Pending";
    case "discharged":
      return "Discharged";
    default:
      return status;
  }
};
