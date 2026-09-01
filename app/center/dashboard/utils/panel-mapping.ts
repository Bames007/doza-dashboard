// app/center/dashboard/utils/panel-mapping.ts

//this is for menu mapping for mobile
export const hrefToPanelMap: { [key: string]: string } = {
  "/dashboard": "dashboard",
  "/dashboard/facility": "facility-services",

  "/dashboard/doza-requests": "doza-requests",
  "/dashboard/analytics": "analytics",
  "/dashboard/patients": "patients",
  "/dashboard/appointments": "appointments",
  "/dashboard/doctors": "doctors",
  "/dashboard/medical-records": "medical-records",
  "/dashboard/emergency": "emergency",
  "/dashboard/inventory": "inventory",
  "/dashboard/prescriptions": "prescriptions",
  "/dashboard/lab-tests": "lab-tests",
  "/dashboard/staff": "staff",
  "/dashboard/billing": "billing",
  "/dashboard/messages": "messages",
  "/dashboard/settings": "settings",
  "/center/dashboard": "dashboard",
  "/dashboard/quality-control": "quality-control",
  "/dashboard/results": "results",
  "/dashboard/samples": "samples",
};

export const panelToPageNameMap: { [key: string]: string } = {
  dashboard: "Dashboard",
  "facility-services": "Facility & Services",
  "doza-requests": "Doza Requests",
  analytics: "Analytics & Reports",
  patients: "Patient Management",
  appointments: "Appointments",
  doctors: "Doctors & Specialists",
  "medical-records": "Medical Records",
  emergency: "Emergency Department",
  inventory: "Medication Inventory",
  prescriptions: "Prescriptions",
  "lab-tests": "Lab Tests",
  staff: "Staff Management",
  billing: "Billing & Payments",
  messages: "Messages",
  settings: "Center Settings",
  "quality-control": "Quality Control",
  results: "Test Results",
  samples: "Test Samples",
};

export const getPanelIdFromPath = (path: string): string => {
  // Remove the /center prefix if it exists
  const normalizedPath = path.replace(/^\/center/, "");

  // Find the matching route
  for (const [route, panelId] of Object.entries(hrefToPanelMap)) {
    if (normalizedPath.startsWith(route) || path.startsWith(route)) {
      return panelId;
    }
  }

  return "dashboard"; // Default
};

export const getPageNameFromPanelId = (panelId: string): string => {
  return panelToPageNameMap[panelId] || "Dashboard";
};

export const getCurrentPanelInfo = (): {
  panelId: string;
  pageName: string;
} => {
  if (typeof window === "undefined") {
    return { panelId: "dashboard", pageName: "Dashboard" };
  }

  const path = window.location.pathname;
  const panelId = getPanelIdFromPath(path);
  const pageName = getPageNameFromPanelId(panelId);

  return { panelId, pageName };
};
