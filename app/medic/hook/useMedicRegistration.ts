import { useState } from "react";
import { MedicRegistrationData } from "../type";
import { submitMedicRegistration } from "../RegistrationService";

export const useMedicRegistration = () => {
  const [formData, setFormData] = useState<MedicRegistrationData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      profilePhoto: null,
    },
    professionalInfo: {
      role: "",
      customRole: "",
      specialties: [],
      customSpecialty: "",
      licenseNumber: "",
      yearsOfExperience: 0,
      qualifications: [],
      bio: "",
    },
    practiceInfo: {
      consultationTypes: {
        inPerson: true,
        online: false,
        homeVisit: false,
      },
      hourlyRate: 0,
      availability: {
        days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        hours: {
          start: "09:00",
          end: "17:00",
        },
        emergencyAvailable: false,
      },
      languages: ["English"],
    },
    location: {
      address: "",
      city: "",
      state: "",
      country: "",
      lat: 0,
      lng: 0,
      serviceRadius: 50,
    },
    credentials: {
      documents: [],
      verified: false,
    },
    legal: {
      agreedToTerms: false,
      agreedToPrivacy: false,
      agreedToCommitment: false,
      signature: "",
      date: "",
    },
    status: "pending",
    verified: false,
    createdAt: "",
    lastUpdated: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<MedicRegistrationData>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const getLocationFromMap = () => {
    // Implement map integration
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateFormData({
            location: {
              ...formData.location,
              lat: latitude,
              lng: longitude,
            },
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMedicRegistration(formData);
      // Handle success - will be handled by component
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = 20; // Calculate based on current step and completion

  return {
    formData,
    updateFormData,
    handleSubmit,
    isSubmitting,
    progress,
    getLocationFromMap,
  };
};
