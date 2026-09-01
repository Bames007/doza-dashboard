// config/center-based-navigation.ts
import {
  Microscope,
  Building,
  Activity,
  SmileIcon,
  Pill,
  Stethoscope,
  type LucideIcon,
  Ambulance,
  HeartHandshake,
  LucideGlasses,
} from "lucide-react";
import logger from "@/app/utils/logger";
import type { UserRole, CenterType } from "../type";

// ==================== DASHBOARD CONFIGS ====================
interface DashboardConfig {
  features: string[];
  stats: string[];
}

interface CenterTypeConfig {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  features: string[];
  icon: LucideIcon;
}

export const roleDashboards: Record<UserRole, DashboardConfig> = {
  super_admin: {
    features: [
      "Multi-center Management",
      "System Administration",
      "Global Analytics",
      "User Management",
    ],
    stats: [
      "Total Centers",
      "System Users",
      "Platform Revenue",
      "Active Services",
    ],
  },
  admin: {
    features: [
      "Hospital Operations",
      "Staff Coordination",
      "Financial Oversight",
      "Service Management",
    ],
    stats: [
      "Bed Occupancy",
      "Staff Count",
      "Monthly Revenue",
      "Patient Admissions",
    ],
  },
  center_owner: {
    features: [
      "Business Overview",
      "Financial Management",
      "Staff Supervision",
      "Performance Monitoring",
    ],
    stats: [
      "Total Revenue",
      "Active Staff",
      "Patient Satisfaction",
      "Service Utilization",
    ],
  },
  center_head: {
    features: [
      "Operational Management",
      "Team Leadership",
      "Service Delivery",
      "Quality Assurance",
    ],
    stats: [
      "Daily Operations",
      "Team Performance",
      "Service Metrics",
      "Quality Scores",
    ],
  },
  doctor: {
    features: [
      "Patient Consultations",
      "Medical Records",
      "Prescription Management",
      "Appointment Schedule",
    ],
    stats: [
      "Today's Appointments",
      "Patients Treated",
      "Prescriptions",
      "Available Slots",
    ],
  },
  nurse: {
    features: [
      "Patient Care",
      "Vital Monitoring",
      "Medication Administration",
      "Patient Education",
    ],
    stats: [
      "Patients Assigned",
      "Tasks Completed",
      "Medications",
      "Vitals Recorded",
    ],
  },
  hospital_nurse: {
    features: [
      "Ward Management",
      "Patient Monitoring",
      "Medication Administration",
      "Emergency Response",
    ],
    stats: [
      "Patients Assigned",
      "Vitals Checked",
      "Medications Given",
      "Emergency Cases",
    ],
  },
  pharmacy_nurse: {
    features: [
      "Prescription Processing",
      "Customer Service",
      "Health Screening",
      "Inventory Management",
    ],
    stats: [
      "Prescriptions Filled",
      "Customers Served",
      "Screenings Done",
      "Stock Items",
    ],
  },
  pharmacist: {
    features: [
      "Drug Dispensing",
      "Inventory Management",
      "Prescription Validation",
      "Supplier Coordination",
    ],
    stats: [
      "Prescriptions Filled",
      "Low Stock Items",
      "Daily Sales",
      "Expiring Medications",
    ],
  },
  lab_technician: {
    features: [
      "Sample Analysis",
      "Test Reporting",
      "Equipment Maintenance",
      "Quality Control",
    ],
    stats: [
      "Tests Today",
      "Pending Results",
      "Equipment Status",
      "Turnaround Time",
    ],
  },
  receptionist: {
    features: [
      "Appointment Scheduling",
      "Patient Registration",
      "Billing Support",
      "Records Management",
    ],
    stats: [
      "Appointments Today",
      "New Patients",
      "Billing Processed",
      "Phone Calls",
    ],
  },
  accountant: {
    features: [
      "Financial Reporting",
      "Billing Management",
      "Revenue Tracking",
      "Accounts Reconciliation",
    ],
    stats: [
      "Pending Invoices",
      "Total Revenue",
      "Insurance Claims",
      "Outstanding Balances",
    ],
  },
  hr: {
    features: [
      "Employee Management",
      "Recruitment",
      "Training & Development",
      "Performance Evaluation",
    ],
    stats: [
      "Active Employees",
      "New Hires",
      "Training Completed",
      "Performance Reviews",
    ],
  },
};

export const centerTypeConfigs: Record<CenterType, CenterTypeConfig> = {
  hospital: {
    primaryColor: "bg-blue-600",
    secondaryColor: "bg-blue-100",
    textColor: "text-blue-600",
    features: [
      "Emergency Care",
      "Inpatient Services",
      "Multiple Specialties",
      "Surgical Operations",
    ],
    icon: Building,
  },
  clinic: {
    primaryColor: "bg-green-600",
    secondaryColor: "bg-green-100",
    textColor: "text-green-600",
    features: [
      "Outpatient Care",
      "Consultations",
      "Basic Procedures",
      "Preventive Care",
    ],
    icon: Stethoscope,
  },
  medical_center: {
    primaryColor: "bg-teal-600",
    secondaryColor: "bg-teal-100",
    textColor: "text-teal-600",
    features: [
      "Comprehensive Care",
      "Multiple Services",
      "Specialist Referrals",
      "Health Programs",
    ],
    icon: Activity,
  },
  pharmacy: {
    primaryColor: "bg-purple-600",
    secondaryColor: "bg-purple-100",
    textColor: "text-purple-600",
    features: [
      "Medication Dispensing",
      "Health Products",
      "Prescription Services",
      "Health Consultations",
    ],
    icon: Pill,
  },
  diagnostic_lab: {
    primaryColor: "bg-orange-600",
    secondaryColor: "bg-orange-100",
    textColor: "text-orange-600",
    features: [
      "Lab Tests",
      "Imaging Services",
      "Health Screening",
      "Diagnostic Reports",
    ],
    icon: Microscope,
  },
  dental_clinic: {
    primaryColor: "bg-cyan-600",
    secondaryColor: "bg-cyan-100",
    textColor: "text-cyan-600",
    features: [
      "Dental Checkups",
      "Oral Surgery",
      "Teeth Cleaning",
      "Orthodontics",
    ],
    icon: SmileIcon,
  },
  optical_center: {
    primaryColor: "bg-indigo-600",
    secondaryColor: "bg-indigo-100",
    textColor: "text-indigo-600",
    features: [
      "Vision Tests",
      "Eye Examinations",
      "Optical Products",
      "Contact Lens Fitting",
    ],
    icon: LucideGlasses,
  },
  emergency: {
    primaryColor: "bg-red-600",
    secondaryColor: "bg-red-100",
    textColor: "text-red-600",
    features: [
      "Rapid SOS Response",
      "Emergency Care",
      "Critical Patient Management",
      "24/7 Availability",
    ],
    icon: Ambulance,
  },
  cardiac_center: {
    primaryColor: "bg-blue-600",
    secondaryColor: "bg-blue-100",
    textColor: "text-blue-600",
    features: [
      "Cardiac Monitoring",
      "Echocardiography",
      "Stress Testing",
      "Electrocardiogram",
    ],
    icon: HeartHandshake,
  },
};

// ---------- Helper Functions with Logging ----------
export const getDisplayRole = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    super_admin: "Super Administrator",
    admin: "Administrator",
    doctor: "Doctor",
    nurse: "Nurse",
    hospital_nurse: "Hospital Nurse",
    pharmacy_nurse: "Pharmacy Nurse",
    receptionist: "Receptionist",
    lab_technician: "Lab Technician",
    pharmacist: "Pharmacist",
    center_owner: "Center Owner",
    center_head: "Center Head",
    accountant: "Accountant",
    hr: "Human Resources",
  };

  const display = roleNames[role] || role;
  if (!roleNames[role]) {
    logger.warn({ role }, "Unknown user role encountered in getDisplayRole");
  }
  logger.debug({ role, display }, "Retrieved display role");
  return display;
};

export const getDisplayCenterType = (centerType: CenterType): string => {
  const centerTypeNames: Record<CenterType, string> = {
    hospital: "Hospital",
    clinic: "Clinic",
    medical_center: "Medical Center",
    pharmacy: "Pharmacy",
    diagnostic_lab: "Diagnostic Laboratory",
    dental_clinic: "Dental Clinic",
    optical_center: "Optical Center",
    emergency: "Emergency Center",
    cardiac_center: "Cardiac Center",
  };

  const display = centerTypeNames[centerType] || centerType;
  if (!centerTypeNames[centerType]) {
    logger.warn(
      { centerType },
      "Unknown center type encountered in getDisplayCenterType",
    );
  }
  logger.debug({ centerType, display }, "Retrieved display center type");
  return display;
};

// Get user's dashboard configuration with logging and validation
export const getUserDashboardConfig = (
  userRole: UserRole,
  centerType: CenterType,
): DashboardConfig &
  CenterTypeConfig & { displayRole: string; displayCenterType: string } => {
  const roleConfig = roleDashboards[userRole];
  const centerConfig = centerTypeConfigs[centerType];

  if (!roleConfig) {
    logger.warn(
      { userRole, centerType },
      "Unknown user role, falling back to nurse config",
    );
  }
  if (!centerConfig) {
    logger.warn(
      { userRole, centerType },
      "Unknown center type, falling back to medical_center config",
    );
  }

  const safeRoleConfig = roleConfig || roleDashboards.nurse;
  const safeCenterConfig = centerConfig || centerTypeConfigs.medical_center;

  const result = {
    ...safeRoleConfig,
    ...safeCenterConfig,
    displayRole: getDisplayRole(userRole),
    displayCenterType: getDisplayCenterType(centerType),
  };

  logger.debug(
    {
      userRole,
      centerType,
      displayRole: result.displayRole,
      displayCenterType: result.displayCenterType,
    },
    "User dashboard configuration retrieved",
  );

  return result;
};

// Type-safe fallback for unknown roles/center types
export const getSafeDashboardConfig = (
  userRole: UserRole,
  centerType: CenterType,
): DashboardConfig &
  CenterTypeConfig & { displayRole: string; displayCenterType: string } => {
  // Already logs inside getUserDashboardConfig, so just call it
  return getUserDashboardConfig(userRole, centerType);
};

// ---------- Optional: Validate role/center type ----------
export const isValidRole = (role: string): role is UserRole => {
  const valid = role in roleDashboards;
  if (!valid) {
    logger.warn({ role }, "Invalid user role checked");
  }
  return valid;
};

export const isValidCenterType = (type: string): type is CenterType => {
  const valid = type in centerTypeConfigs;
  if (!valid) {
    logger.warn({ type }, "Invalid center type checked");
  }
  return valid;
};
