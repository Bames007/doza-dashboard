// types/dashboard.ts
import type { LucideIcon } from "lucide-react";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  position: string;
  avatar?: string;
}

export type UserRole =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "lab_technician"
  | "pharmacist"
  | "center_owner"
  | "pharmacy_nurse"
  | "hospital_nurse"
  | "center_head";

export type CenterType =
  | "hospital"
  | "clinic"
  | "diagnostic_lab"
  | "pharmacy"
  | "medical_center"
  | "dental_clinic"
  | "emergency"
  | "cardiac_center"
  | "optical_center";

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  centerTypes?: CenterType[];
  children?: NavigationItem[];
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface RegistrationNumbers {
  cac: string;
  state: string;
  federal: string;
}

export interface OperatingHours {
  opening: string;
  closing: string;
  days: string[];
  timezone: string;
}

export interface Contact {
  phone: string;
  email: string;
  website: string;
}

export interface OwnerInfo {
  isOwner: boolean;
  fullName: string;
  email: string;
  phone: string;
  position: string;
}

export interface Legal {
  agreed: boolean;
  signature: string;
  date: string;
}

export interface CenterRegistrationData {
  centerType: CenterType;
  customType?: string;
  centerName: string;
  logo: string | null;
  location: Location;
  registrationNumbers: RegistrationNumbers;
  operatingHours: OperatingHours;
  contact: Contact;
  ownerInfo: OwnerInfo;
  specificDetails: Record<string, string | number | boolean>;
  legal: Legal;
  createdAt?: string;
  status?: string;
  verified?: boolean;
  facilityDetails?: {
    bedCapacity: number;
    icuBeds: number;
  };
}

export interface Center extends CenterRegistrationData {
  id: string;
  facilities: Facility[];
  services: Service[];
}

export interface DashboardState {
  sidebarCollapsed: boolean;
  currentPage: string;
  user: User | null;
  center: Center | null;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  capacity: number;
  available: number;
  costPerDay: number;
  description?: string;
  features: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  description?: string;
  notes?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type FacilityType =
  | "general_ward"
  | "private_ward"
  | "icu"
  | "emergency_room"
  | "maternity_ward"
  | "pediatric_ward"
  | "isolation_room"
  | "recovery_room"
  | "consultation_room"
  | "laboratory"
  | "pharmacy"
  | "dental_room"
  | "optical_room";

export type ServiceCategory =
  | "general_consultation"
  | "specialist_consultation"
  | "emergency_care"
  | "surgical_services"
  | "maternity_services"
  | "pediatric_care"
  | "diagnostic_imaging"
  | "laboratory_tests"
  | "therapeutic_services"
  | "pharmacy_services"
  | "dental_care"
  | "optical_services";

export interface StaffMember {
  id: string;
  name: string;
  roles: string[];
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  specialization?: string;
  qualifications?: string;
  joinDate: string;
  department: string;
  status: "active" | "inactive" | "on_leave";
  profilePicture?: string;
  documents?: Record<string, any>;
  metadata: {
    staffId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
// app/types/doza-medic.ts
export interface DozaInvitation {
  staffId: string;
  email: string;
  centerId: string;
  centerName: string;
  invitedBy: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "rejected" | "cancelled";
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  medicId?: string;
  invitationId?: string;
}

export interface MedicData {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    specialty?: string;
    qualifications?: string[];
  };
  centerAffiliation?: {
    centerId: string;
    staffId: string;
    linkedAt: string;
    verified: boolean;
    centerName: string;
  };
  status: "active" | "inactive" | "pending";
  points: number;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  createdAt: string;
  updatedAt: string;
  registrationDate: string;
}

export interface InvitationsMap {
  [invitationId: string]: DozaInvitation;
}

export interface MedicsMap {
  [medicId: string]: MedicData;
}

export interface StaffDozaMedic {
  isRegistered: boolean;
  medicId?: string;
  registrationDate?: string;
  registrationStatus?: "pending" | "invited" | "approved" | "rejected";
  points?: number;
  level?: string;
  lastSynced?: string;
  invitationSentAt?: string;
  invitationId?: string;
}
