import { LucideProps } from "lucide-react";
import { ComponentType } from "react";

export interface MedicRegistrationData {
  // Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    profilePhoto: string | null;
  };

  // Professional Information
  professionalInfo: {
    role: string;
    customRole: string;
    specialties: string[];
    customSpecialty: string;
    licenseNumber: string;
    yearsOfExperience: number;
    qualifications: string[];
    bio: string;
  };

  // Practice & Availability
  practiceInfo: {
    consultationTypes: {
      inPerson: boolean;
      online: boolean;
      homeVisit: boolean;
    };
    hourlyRate: number;
    availability: {
      days: string[];
      hours: {
        start: string;
        end: string;
      };
      emergencyAvailable: boolean;
    };
    languages: string[];
  };

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    lat: number;
    lng: number;
    serviceRadius: number; // in km
  };

  // Credentials & Documents
  credentials: {
    documents: {
      type: string;
      fileUrl: string;
      fileName: string;
      uploadDate: string;
    }[];
    verified: boolean;
  };

  // Legal
  legal: {
    agreedToTerms: boolean;
    agreedToPrivacy: boolean;
    agreedToCommitment: boolean;
    signature: string;
    date: string;
  };

  // System
  status: "pending" | "approved" | "rejected" | "suspended";
  verified: boolean;
  createdAt: string;
  lastUpdated: string;
  rating?: number;
  totalConsultations?: number;
}

export type RegistrationStep =
  | "role"
  | "personal"
  | "professional"
  | "practice"
  | "credentials"
  | "legal"
  | "success";

export interface MedicRole {
  id: string;
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
  specialties: string[];
}

export interface DocumentType {
  id: string;
  label: string;
  required: boolean;
  acceptedFormats: string[];
  maxSize: number; // in MB
}

// app/types/medic.ts
export interface MedicPoints {
  totalPoints: number;
  verifiedDrugs: number;
  pendingReview: number;
  level: string;
  achievements: MedicAchievement[];
  averagePoints?: number;
  completionRate?: number;
  lastUpdated: string;
}

export interface MedicAchievement {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  points: number;
  icon?: string;
  color?: string;
}

export interface VerificationHistory {
  id: string;
  drugId: string;
  drugName: string;
  action: string;
  points: number;
  confidenceScore: number;
  status: string;
  timestamp: string;
}

export interface MedicInfo {
  id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
  };
  professionalInfo: {
    role: string;
    licenseNumber: string;
    yearsOfExperience: number;
    specialties: string[];
    qualifications: string[];
  };
  verified: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt: string;
  lastUpdated: string;
}
