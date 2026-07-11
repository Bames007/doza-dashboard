// app/utils/normaliseCenterData.ts
import { Center } from "../center/type";

export interface RawCenterData {
  id: string;
  centerId: string;
  name?: string;
  centerName?: string;
  type?: string;
  centerType?: string;
  logo?: string;
  location?: any;
  status?: string;
  verified?: boolean;
  [key: string]: any;
}

export function normaliseCenterData(
  rawData: RawCenterData | null
): Center | null {
  if (!rawData) return null;

  // Create a normalized center object that matches the Center interface
  const normalized: any = {
    id: rawData.id || rawData.centerId || "",
    centerId: rawData.centerId || rawData.id || "",

    // Handle both property names
    centerName: rawData.centerName || rawData.name || "Medical Center",
    centerType: rawData.centerType || rawData.type || "medical_center",

    // Handle logo
    logo: rawData.logo || null,

    // Provide default values for required fields
    location: rawData.location || {
      address: "",
      lat: 0,
      lng: 0,
    },
    registrationNumbers: rawData.registrationNumbers || {
      cac: "",
      state: "",
      federal: "",
    },
    operatingHours: rawData.operatingHours || {
      opening: "09:00",
      closing: "17:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timezone: "UTC",
    },
    contact: rawData.contact || {
      phone: "",
      email: "",
      website: "",
    },
    ownerInfo: rawData.ownerInfo || {
      isOwner: false,
      fullName: "",
      email: "",
      phone: "",
      position: "",
    },
    specificDetails: rawData.specificDetails || {},
    legal: rawData.legal || {
      agreed: false,
      signature: "",
      date: "",
    },
    facilities: rawData.facilities || [],
    services: rawData.services || [],
    status: rawData.status || "active",
    verified: rawData.verified || false,
  };

  // Copy any other properties from rawData that don't conflict
  Object.keys(rawData).forEach((key) => {
    if (!(key in normalized) && key !== "name" && key !== "type") {
      normalized[key] = rawData[key];
    }
  });

  return normalized as Center;
}

// Helper to normalize user session
export function normaliseUserSession(sessionData: any) {
  if (!sessionData) return null;

  return {
    ...sessionData,
    center: normaliseCenterData(sessionData.center),
  };
}
