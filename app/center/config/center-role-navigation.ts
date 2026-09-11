// config/center-role-navigation.ts

import {
  Home,
  Users,
  Calendar,
  FileText,
  BarChart3,
  ClipboardList,
  Package,
  Microscope,
  Building,
  Shield,
  Activity,
  SmileIcon,
  Glasses,
  Pill,
  TestTube,
  ShoppingCart,
  UserCheck,
  CreditCard,
  Stethoscope,
  AlertCircle,
  Eye,
  ShieldCheck,
  ClipboardCheck,
  Brain,
  Gauge,
  Layers,
  ScrollText,
  Syringe,
  BadgeCheck,
  Bell,
} from "lucide-react";
import type { NavigationItem, UserRole, CenterType } from "../type";
import logger from "@/app/utils/logger";
import DozaNetworkIcon from "@/app/utils/DozaIcon";

// ============================================================================
//  MASTER CONFIGURATION – all items keyed by role
//  Each item explicitly lists which center types it applies to.
// ============================================================================

type NavigationRecord = Record<UserRole, NavigationItem[]>;

/**
 * Single source of truth for all navigation items.
 * Each item includes `roles` (for type compatibility) and `centerTypes`.
 */
export const roleNavigation: NavigationRecord = {
  super_admin: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Facility & Departments",
      href: "/dashboard/facility",
      icon: Building,
      roles: ["super_admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["super_admin"],
      centerTypes: ["pharmacy", "diagnostic_lab"],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Approvals",
      href: "/dashboard/approvals",
      icon: BadgeCheck,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["super_admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],

  admin: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["admin"],
      centerTypes: ["hospital"],
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Doza Requests",
      href: "/dashboard/doza-requests",
      icon: Bell,
      roles: ["admin"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Facility & Departments",
      href: "/dashboard/facility",
      icon: Building,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Approvals",
      href: "/dashboard/approvals",
      icon: BadgeCheck,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["admin"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
  ],

  doctor: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["doctor"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["doctor"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      roles: ["doctor"],
      centerTypes: ["hospital", "clinic"],
    },
    {
      name: "Consultations",
      href: "/dashboard/consultations",
      icon: UserCheck,
      roles: ["doctor"],
      centerTypes: ["clinic", "medical_center", "dental_clinic"],
    },
    {
      name: "Medical Records",
      href: "/dashboard/medical-records",
      icon: ClipboardList,
      roles: ["doctor"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Prescriptions",
      href: "/dashboard/prescriptions",
      icon: FileText,
      roles: ["doctor"],
      centerTypes: ["hospital", "clinic", "medical_center"],
    },
    {
      name: "Lab Tests",
      href: "/dashboard/lab-tests",
      icon: TestTube,
      roles: ["doctor"],
      centerTypes: ["hospital"],
    },
    {
      name: "Clinical Decision Support",
      href: "/dashboard/cds",
      icon: Brain,
      roles: ["doctor"],
      centerTypes: ["clinic", "medical_center"],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["doctor"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["doctor"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    // Cardiac
    {
      name: "Cardiac Monitoring",
      href: "/dashboard/monitoring",
      icon: Activity,
      roles: ["doctor"],
      centerTypes: ["cardiac_center"],
    },
    {
      name: "ECG/Echocardiography",
      href: "/dashboard/ecg",
      icon: BarChart3,
      roles: ["doctor"],
      centerTypes: ["cardiac_center"],
    },
    // Optical
    {
      name: "Eye Exams",
      href: "/dashboard/exams",
      icon: Eye,
      roles: ["doctor"],
      centerTypes: ["optical_center"],
    },
    // Dental
    {
      name: "Dental Procedures",
      href: "/dashboard/procedures",
      icon: SmileIcon,
      roles: ["doctor"],
      centerTypes: ["dental_clinic"],
    },
    // Emergency
    {
      name: "Triage",
      href: "/dashboard/triage",
      icon: AlertCircle,
      roles: ["doctor"],
      centerTypes: ["emergency"],
    },
    {
      name: "Emergency Cases",
      href: "/dashboard/emergency-cases",
      icon: Activity,
      roles: ["doctor"],
      centerTypes: ["emergency"],
    },
  ],

  nurse: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["nurse"],
      centerTypes: [
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["nurse"],
      centerTypes: [
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      roles: ["nurse"],
      centerTypes: [
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
      ],
    },
    {
      name: "Vital Signs",
      href: "/dashboard/vitals",
      icon: Activity,
      roles: ["nurse"],
      centerTypes: ["clinic"],
    },
    {
      name: "Treatment Room",
      href: "/dashboard/treatment",
      icon: Stethoscope,
      roles: ["nurse"],
      centerTypes: ["clinic"],
    },
    {
      name: "Multi-Specialty",
      href: "/dashboard/specialties",
      icon: Stethoscope,
      roles: ["nurse"],
      centerTypes: ["medical_center"],
    },
    {
      name: "Health Programs",
      href: "/dashboard/programs",
      icon: Activity,
      roles: ["nurse"],
      centerTypes: ["medical_center"],
    },
    {
      name: "Dental Procedures",
      href: "/dashboard/procedures",
      icon: SmileIcon,
      roles: ["nurse"],
      centerTypes: ["dental_clinic"],
    },
    {
      name: "Sterilization",
      href: "/dashboard/sterilization",
      icon: Shield,
      roles: ["nurse"],
      centerTypes: ["dental_clinic"],
    },
    {
      name: "Eye Exams",
      href: "/dashboard/exams",
      icon: Eye,
      roles: ["nurse"],
      centerTypes: ["optical_center"],
    },
    {
      name: "Frame Selection",
      href: "/dashboard/frames",
      icon: Glasses,
      roles: ["nurse"],
      centerTypes: ["optical_center"],
    },
    {
      name: "Lens Orders",
      href: "/dashboard/lens-orders",
      icon: Package,
      roles: ["nurse"],
      centerTypes: ["optical_center"],
    },
    {
      name: "Triage",
      href: "/dashboard/triage",
      icon: AlertCircle,
      roles: ["nurse"],
      centerTypes: ["emergency"],
    },
    {
      name: "Emergency Cases",
      href: "/dashboard/emergency-cases",
      icon: Activity,
      roles: ["nurse"],
      centerTypes: ["emergency"],
    },
    {
      name: "Critical Care",
      href: "/dashboard/critical-care",
      icon: Shield,
      roles: ["nurse"],
      centerTypes: ["emergency"],
    },
    {
      name: "Cardiac Monitoring",
      href: "/dashboard/monitoring",
      icon: Activity,
      roles: ["nurse"],
      centerTypes: ["cardiac_center"],
    },
    {
      name: "ECG/Echocardiography",
      href: "/dashboard/ecg",
      icon: BarChart3,
      roles: ["nurse"],
      centerTypes: ["cardiac_center"],
    },
    {
      name: "Stress Testing",
      href: "/dashboard/stress-test",
      icon: Stethoscope,
      roles: ["nurse"],
      centerTypes: ["cardiac_center"],
    },
    {
      name: "Task Management",
      href: "/dashboard/tasks",
      icon: ClipboardCheck,
      roles: ["nurse"],
      centerTypes: [
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["nurse"],
      centerTypes: [
        "clinic",
        "medical_center",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],

  hospital_nurse: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["hospital_nurse"],
      centerTypes: ["hospital"],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["hospital_nurse"],
      centerTypes: ["hospital"],
    },
    {
      name: "Emergency",
      href: "/dashboard/emergency",
      icon: AlertCircle,
      roles: ["hospital_nurse"],
      centerTypes: ["hospital"],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["hospital_nurse"],
      centerTypes: ["hospital"],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["hospital_nurse"],
      centerTypes: ["hospital"],
    },
  ],

  pharmacy_nurse: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Prescriptions",
      href: "/dashboard/prescriptions",
      icon: FileText,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Sales",
      href: "/dashboard/sales",
      icon: ShoppingCart,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Task Management",
      href: "/dashboard/tasks",
      icon: ClipboardCheck,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["pharmacy_nurse"],
      centerTypes: ["pharmacy"],
    },
  ],

  pharmacist: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy", "hospital"],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy", "hospital"],
    },
    {
      name: "Prescriptions",
      href: "/dashboard/prescriptions",
      icon: FileText,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Hospital Prescriptions",
      href: "/dashboard/hospital-prescription",
      icon: FileText,
      roles: ["pharmacist"],
      centerTypes: ["hospital"],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Pharmacy Store",
      href: "/dashboard/hospital-pharmacy-inventory",
      icon: Package,
      roles: ["pharmacist"],
      centerTypes: ["hospital"],
    },
    {
      name: "Sales",
      href: "/dashboard/sales",
      icon: ShoppingCart,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Drug Suppliers",
      href: "/dashboard/hospital-pharmacy-drug-store",
      icon: ShoppingCart,
      roles: ["pharmacist"],
      centerTypes: ["hospital"],
    },
    {
      name: "Drug Verification",
      href: "/dashboard/drug-verification",
      icon: Pill,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Controlled Substances",
      href: "/dashboard/controlled-substances",
      icon: Syringe,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Clinical Decision Support",
      href: "/dashboard/cds",
      icon: Brain,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Medication Dispensing",
      href: "/dashboard/hospital-pharmacy-medication-dispensing",
      icon: Pill,
      roles: ["pharmacist"],
      centerTypes: ["hospital"],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy", "hospital"],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["pharmacist"],
      centerTypes: ["pharmacy", "hospital"],
    },
  ],

  lab_technician: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
    {
      name: "Lab Tests",
      href: "/dashboard/lab-tests",
      icon: Microscope,
      roles: ["lab_technician"],
      centerTypes: ["hospital"],
    },
    {
      name: "Test Samples",
      href: "/dashboard/samples",
      icon: TestTube,
      roles: ["lab_technician"],
      centerTypes: ["diagnostic_lab"],
    },
    {
      name: "Samples",
      href: "/dashboard/samples",
      icon: TestTube,
      roles: ["lab_technician"],
      centerTypes: ["hospital"],
    },
    {
      name: "Lab Results",
      href: "/dashboard/results",
      icon: FileText,
      roles: ["lab_technician"],
      centerTypes: ["diagnostic_lab"],
    },
    {
      name: "Equipment",
      href: "/dashboard/equipment",
      icon: Microscope,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
    {
      name: "Quality Control",
      href: "/dashboard/quality-control",
      icon: ShieldCheck,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
    {
      name: "Requisitions",
      href: "/dashboard/requisitions",
      icon: ClipboardCheck,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["lab_technician"],
      centerTypes: ["hospital", "diagnostic_lab"],
    },
  ],

  receptionist: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["receptionist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["receptionist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      roles: ["receptionist"],
      centerTypes: ["pharmacy"],
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      roles: ["receptionist"],
      centerTypes: ["pharmacy"],
    },
  ],

  center_owner: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },

    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
      roles: ["center_owner"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Doza Requests",
      href: "/dashboard/doza-requests",
      icon: Bell,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["center_owner"],
      centerTypes: ["pharmacy", "diagnostic_lab"],
    },
    {
      name: "Facility & Departments",
      href: "/dashboard/facility",
      icon: Building,
      roles: ["center_owner"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "diagnostic_lab",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Approvals",
      href: "/dashboard/approvals",
      icon: BadgeCheck,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["center_owner"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],

  center_head: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: CreditCard,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "cardiac_center",
        "diagnostic_lab",
        "optical_center",
        "medical_center",
        "dental_clinic",
        "pharmacy",
      ],
    },
    {
      name: "Doza Requests",
      href: "/dashboard/doza-requests",
      icon: Bell,
      roles: ["center_head"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Facility & Departments",
      href: "/dashboard/facility",
      icon: Building,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "dental_clinic",
        "diagnostic_lab",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["center_head"],
      centerTypes: ["diagnostic_lab"],
    },
    {
      name: "Approvals",
      href: "/dashboard/approvals",
      icon: BadgeCheck,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Doza Network",
      href: "/dashboard/dozaNetwork",
      icon: DozaNetworkIcon as any,
      roles: ["center_head"],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],

  accountant: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["accountant"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: ["accountant"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["accountant"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Inventory",
      href: "/dashboard/inventory",
      icon: Package,
      roles: ["accountant"],
      centerTypes: ["pharmacy", "diagnostic_lab", "hospital"],
    },
    {
      name: "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      roles: ["accountant"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["accountant"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],

  hr: [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["hr"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Staff Management",
      href: "/dashboard/staff",
      icon: Users,
      roles: ["hr"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Analytics & Reports",
      href: "/dashboard/analytics",
      icon: BarChart3,
      roles: ["hr"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Approvals",
      href: "/dashboard/approvals",
      icon: BadgeCheck,
      roles: ["hr"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Audit Logs",
      href: "/dashboard/auditlogs",
      icon: ScrollText,
      roles: ["hr"],
      centerTypes: [
        "pharmacy",
        "hospital",
        "clinic",
        "medical_center",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ],
};

function buildCenterNavigation(centerType: CenterType): NavigationRecord {
  const result: NavigationRecord = {} as NavigationRecord;
  for (const role of Object.keys(roleNavigation) as UserRole[]) {
    const items = roleNavigation[role].filter((item) =>
      item.centerTypes?.includes(centerType),
    );
    result[role] = items;
  }
  return result;
}

export const pharmacyNavigation = buildCenterNavigation("pharmacy");
export const hospitalNavigation = buildCenterNavigation("hospital");
export const clinicNavigation = buildCenterNavigation("clinic");
export const medicalCenterNavigation = buildCenterNavigation("medical_center");
export const diagnosticLabNavigation = buildCenterNavigation("diagnostic_lab");
export const dentalClinicNavigation = buildCenterNavigation("dental_clinic");
export const opticalCenterNavigation = buildCenterNavigation("optical_center");
export const emergencyNavigation = buildCenterNavigation("emergency");
export const cardiacCenterNavigation = buildCenterNavigation("cardiac_center");

export const getCenterRoleNavigation = (
  centerType: CenterType,
  userRole: UserRole,
): NavigationItem[] => {
  const validCenterTypes: CenterType[] = [
    "pharmacy",
    "hospital",
    "clinic",
    "medical_center",
    "diagnostic_lab",
    "dental_clinic",
    "optical_center",
    "emergency",
    "cardiac_center",
  ];

  if (!validCenterTypes.includes(centerType)) {
    logger.warn(
      { centerType, userRole },
      "Unknown center type – using fallback",
    );
    return getFallbackNavigation(centerType, userRole);
  }

  const normalizedRole = normalizeRoleForCenter(userRole, centerType);
  const items = roleNavigation[normalizedRole] || [];

  const filtered = items.filter((item) =>
    item.centerTypes?.includes(centerType),
  );

  if (filtered.length === 0) {
    // Try generic nurse as fallback
    if (normalizedRole !== "nurse" && roleNavigation["nurse"]) {
      const nurseItems = roleNavigation["nurse"].filter((item) =>
        item.centerTypes?.includes(centerType),
      );
      if (nurseItems.length > 0) {
        logger.debug(
          { centerType, userRole },
          "Using generic nurse navigation",
        );
        return nurseItems;
      }
    }
    logger.warn(
      { centerType, userRole },
      "No navigation found – using fallback",
    );
    return getFallbackNavigation(centerType, userRole);
  }

  return filtered;
};

export const getFallbackNavigation = (
  centerType: CenterType,
  userRole: UserRole,
): NavigationItem[] => {
  const fallbackItems: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: [
        "super_admin",
        "admin",
        "doctor",
        "nurse",
        "hospital_nurse",
        "pharmacy_nurse",
        "pharmacist",
        "lab_technician",
        "receptionist",
        "center_owner",
        "center_head",
        "accountant",
        "hr",
      ],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "pharmacy",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Patients",
      href: "/dashboard/patients",
      icon: Users,
      roles: [
        "super_admin",
        "admin",
        "doctor",
        "nurse",
        "hospital_nurse",
        "pharmacy_nurse",
        "pharmacist",
        "lab_technician",
        "receptionist",
        "center_owner",
        "center_head",
        "accountant",
        "hr",
      ],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "pharmacy",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      roles: [
        "super_admin",
        "admin",
        "doctor",
        "nurse",
        "hospital_nurse",
        "pharmacy_nurse",
        "pharmacist",
        "lab_technician",
        "receptionist",
        "center_owner",
        "center_head",
        "accountant",
        "hr",
      ],
      centerTypes: [
        "hospital",
        "clinic",
        "medical_center",
        "pharmacy",
        "diagnostic_lab",
        "dental_clinic",
        "optical_center",
        "emergency",
        "cardiac_center",
      ],
    },
  ];

  return fallbackItems.filter(
    (item) =>
      item.roles.includes(userRole) &&
      (item.centerTypes?.includes(centerType) ?? false),
  );
};

export const normalizeRoleForCenter = (
  role: UserRole | string,
  centerType: CenterType,
): UserRole => {
  const roleStr = role.toLowerCase();
  const centerTypeStr = centerType.toLowerCase();

  if (roleStr.includes("nurse")) {
    switch (centerTypeStr) {
      case "pharmacy":
        return "pharmacy_nurse";
      case "hospital":
        return "hospital_nurse";
      default:
        return "nurse";
    }
  }

  const roleMap: Record<string, UserRole> = {
    super_admin: "super_admin",
    admin: "admin",
    administrator: "admin",
    doctor: "doctor",
    nurse: "nurse",
    pharmacist: "pharmacist",
    lab_technician: "lab_technician",
    "lab technician": "lab_technician",
    receptionist: "receptionist",
    center_owner: "center_owner",
    center_head: "center_head",
    owner: "center_owner",
    head: "center_head",
    accountant: "accountant",
    hr: "hr",
  };

  const normalized = roleMap[roleStr] || "receptionist";
  if (!roleMap[roleStr]) {
    logger.warn(
      { role, centerType, normalized },
      "Unknown role normalized to receptionist",
    );
  }
  return normalized;
};

export const isValidCenterType = (type: string): type is CenterType => {
  const valid: CenterType[] = [
    "pharmacy",
    "hospital",
    "clinic",
    "medical_center",
    "diagnostic_lab",
    "dental_clinic",
    "optical_center",
    "emergency",
    "cardiac_center",
  ];
  const ok = valid.includes(type as CenterType);
  if (!ok) logger.warn({ type }, "Invalid center type");
  return ok;
};

export const isValidUserRole = (role: string): role is UserRole => {
  const valid: UserRole[] = [
    "super_admin",
    "admin",
    "doctor",
    "nurse",
    "hospital_nurse",
    "pharmacy_nurse",
    "pharmacist",
    "lab_technician",
    "receptionist",
    "center_owner",
    "center_head",
    "accountant",
    "hr",
  ];
  const ok = valid.includes(role as UserRole);
  if (!ok) logger.warn({ role }, "Invalid user role");
  return ok;
};
