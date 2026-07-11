import { useState, useEffect } from "react";
import {
  Search,
  User,
  Phone,
  Calendar,
  Pill,
  PlusCircle,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface PatientSearchProps {
  onSelectPatient: (patient: any) => void;
  onNewPatient: () => void;
  centerId: string;
  userId: string;
}

interface PatientData {
  patientId: string | null;
  patientPhone: string;
  isDozaUser: boolean;
  consentStatus: "pending" | "accepted" | "declined" | "none";
  patientProfile: {
    name: string;
    avatar: string;
    phone: string;
    gender: string;
    age: string;
    consentStatus: string;
    email?: string;
    bloodGroup?: string;
    genotype?: string;
    allergies?: string;
    medicalConditions?: {
      asthma: boolean;
      diabetic: boolean;
      heartDisease: boolean;
      hypertension: boolean;
      smoker: boolean;
      ulcer: boolean;
    };
    emergencyContacts?: {
      primary: { name: string; phone: string };
      secondary: { name: string; phone: string } | null;
    };
  } | null;
  prescriptions: any[];
  lastVisit: string | null;
  statistics: {
    totalPrescriptions: number;
    medicationCount: number;
    activePrescriptions: number;
    completedPrescriptions: number;
  } | null;
}

export const PatientSearch = ({
  onSelectPatient,
  onNewPatient,
  centerId,
  userId,
}: PatientSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPatient = async () => {
    if (!searchTerm.trim()) {
      setSearchResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Clean the phone number
      const cleanPhone = searchTerm.replace(/\D/g, "");

      console.log("🔍 Search initiated with:", {
        original: searchTerm,
        cleaned: cleanPhone,
        length: cleanPhone.length,
      });

      // Validate
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        setError("Please enter a valid 10-11 digit Nigerian phone number");
        setSearchResult(null);
        setLoading(false);
        return;
      }

      console.log("📞 Making API call with phone:", cleanPhone);

      // Make API call
      const response = await fetch(
        `/api/centers/${centerId}/prescriptions/patient/${encodeURIComponent(
          cleanPhone
        )}`,
        {
          headers: {
            "x-user-id": userId,
            "x-medic-name": "Healthcare Provider",
          },
        }
      );

      const result = await response.json();
      console.log("📦 API Response:", {
        success: result.success,
        hasProfile: !!result.data?.patientProfile,
        patientName: result.data?.patientProfile?.name,
        isDozaUser: result.data?.isDozaUser,
        rawResponse: result,
      });

      if (response.ok && result.success) {
        setSearchResult(result.data);
      } else {
        setError(result.error || "Failed to search patient");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("❌ Error searching patient:", error);
      setError("Network error. Please try again.");
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const cleanPhone = searchTerm.replace(/\D/g, "");
      if (cleanPhone.length >= 10) {
        searchPatient();
      } else if (cleanPhone.length > 0) {
        setSearchResult(null);
        setError(null);
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    console.log("Search Result Updated:", searchResult);
    if (searchResult) {
      console.log("Patient Profile:", searchResult.patientProfile);
      console.log("Is Doza User:", searchResult.isDozaUser);
      console.log("Consent Status:", searchResult.consentStatus);
    }
  }, [searchResult]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResult(null);
    setError(null);
  };

  const handleSelectPatient = () => {
    if (searchResult) {
      if (
        searchResult.consentStatus === "accepted" ||
        !searchResult.isDozaUser
      ) {
        onSelectPatient(searchResult);
      } else {
        alert(
          `${searchResult.patientProfile?.name} needs to accept your prescription request first. They have been notified.`
        );
      }
    }
  };

  const getConsentStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Consent Granted
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-200">
            <Clock className="w-3 h-3" />
            Awaiting Consent
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
            <AlertCircle className="w-3 h-3" />
            Consent Declined
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg">
            <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          Find Patient
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Search by phone number to view existing prescriptions or create new
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
        <input
          type="tel"
          placeholder="Enter patient phone number (e.g., 08127728084)..."
          value={searchTerm}
          onChange={(e) => {
            // Only allow digits
            const value = e.target.value.replace(/\D/g, "");
            setSearchTerm(value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-10 pr-10 py-3 md:py-3.5 text-gray-700 bg-white border border-gray-300 
           rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none
           transition-all duration-200 placeholder:text-gray-400"
          maxLength={11}
        />
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 
                     text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Container */}
      <div className="transition-all duration-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 md:py-12">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-3" />
            <p className="text-gray-600">Searching patient...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 md:py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Error</p>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <button
              onClick={searchPatient}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg 
                       hover:bg-gray-200 transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        ) : searchResult ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Patient Found</p>
              <button
                onClick={onNewPatient}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full 
                         hover:bg-green-100 transition-colors border border-green-200
                         flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                New Patient
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient Card */}
              <div
                onClick={handleSelectPatient}
                className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 
                           group hover:shadow-sm ${
                             searchResult.consentStatus === "accepted" ||
                             !searchResult.isDozaUser
                               ? "border-green-200 hover:border-green-300 hover:bg-green-50"
                               : "border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50"
                           }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Patient Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center 
                                    justify-center flex-shrink-0 ${
                                      searchResult.consentStatus ===
                                        "accepted" || !searchResult.isDozaUser
                                        ? "bg-green-100 group-hover:bg-green-200"
                                        : "bg-yellow-100 group-hover:bg-yellow-200"
                                    } transition-colors overflow-hidden`}
                    >
                      {searchResult.patientProfile?.avatar ? (
                        <img
                          src={searchResult.patientProfile.avatar}
                          alt={searchResult.patientProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {searchResult.patientProfile?.name ||
                            "Unknown Patient"}
                        </h4>
                        {searchResult.isDozaUser &&
                          getConsentStatusBadge(searchResult.consentStatus)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {searchResult.patientPhone}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {searchResult.patientProfile?.gender && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 
                                         bg-blue-50 text-blue-700 text-xs rounded-full"
                          >
                            {searchResult.patientProfile.gender}
                          </span>
                        )}
                        {searchResult.patientProfile?.age && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 
                                         bg-purple-50 text-purple-700 text-xs rounded-full"
                          >
                            {searchResult.patientProfile.age}
                          </span>
                        )}
                        {searchResult.isDozaUser ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 
                                         bg-indigo-50 text-indigo-700 text-xs rounded-full"
                          >
                            Doza User
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 
                                         bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            Non-Doza User
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prescription Info (only if consent granted or non-Doza user) */}
                  {(searchResult.consentStatus === "accepted" ||
                    !searchResult.isDozaUser) && (
                    <div className="flex items-center gap-4 md:gap-6 pl-14 md:pl-0 md:text-right">
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600 md:justify-end">
                          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{formatDate(searchResult.lastVisit)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Last visit
                        </div>
                      </div>
                      {searchResult.statistics && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600 md:justify-end">
                            <Pill className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {searchResult.statistics.totalPrescriptions}{" "}
                              prescriptions
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {searchResult.statistics.medicationCount}{" "}
                            medications
                          </div>
                        </div>
                      )}
                      <div className="hidden md:block">
                        <button
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium 
                                        rounded-lg hover:bg-green-700 transition-colors
                                        opacity-0 group-hover:opacity-100"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Consent Message */}
                {searchResult.isDozaUser &&
                  searchResult.consentStatus !== "accepted" && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium">
                            {searchResult.consentStatus === "pending"
                              ? "Awaiting patient consent"
                              : "Patient declined consent"}
                          </p>
                          <p className="mt-1">
                            {searchResult.consentStatus === "pending"
                              ? "The patient has been notified and needs to accept your request before you can view their full medical history."
                              : "The patient has declined to share their medical information with you."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSelectPatient}
                  disabled={
                    searchResult.isDozaUser &&
                    searchResult.consentStatus !== "accepted"
                  }
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    searchResult.consentStatus === "accepted" ||
                    !searchResult.isDozaUser
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {searchResult.consentStatus === "accepted" ||
                  !searchResult.isDozaUser
                    ? "View Patient History"
                    : searchResult.consentStatus === "pending"
                    ? "Awaiting Consent..."
                    : "Consent Declined"}
                </button>
                <button
                  onClick={onNewPatient}
                  className="flex-1 px-4 py-3 bg-white border border-green-600 text-green-600 
                           rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  Create New Prescription
                </button>
              </div>
            </div>
          </>
        ) : searchTerm ? (
          <div
            className="text-center py-8 md:py-12 border-2 border-dashed border-gray-200 
                        rounded-xl bg-gradient-to-b from-gray-50/50 to-white"
          >
            <div
              className="w-16 h-16 bg-gray-100 rounded-full flex items-center 
                          justify-center mx-auto mb-4"
            >
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-2">No patient found</p>
            <p className="text-gray-600 text-sm mb-4 max-w-sm mx-auto">
              No patient found with phone number{" "}
              <span className="font-semibold text-green-700">{searchTerm}</span>
            </p>
            <button
              onClick={onNewPatient}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r 
                       from-green-600 to-emerald-700 text-white rounded-lg 
                       hover:from-green-700 hover:to-emerald-800 transition-all duration-200
                       shadow-sm hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Prescription for {searchTerm}
            </button>
          </div>
        ) : (
          <div
            className="text-center py-8 md:py-12 border-2 border-dashed border-gray-200 
                        rounded-xl bg-gradient-to-b from-gray-50/50 to-white"
          >
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">
              Search for patients
            </p>
            <p className="text-gray-600 text-sm mb-4 max-w-sm mx-auto">
              Enter a patient's phone number to search for existing
              prescriptions
            </p>
            <div
              className="inline-flex flex-col sm:flex-row items-center gap-2 p-3 
                          bg-green-50 rounded-lg border border-green-200"
            >
              <span className="text-xs text-gray-600">Try searching for:</span>
              <button
                onClick={() => setSearchTerm("08127728084")}
                className="text-xs px-3 py-1.5 bg-white text-green-700 rounded-md 
                         hover:bg-green-100 transition-colors border border-green-300"
              >
                08127728084
              </button>
              <button
                onClick={() => setSearchTerm("08033827335")}
                className="text-xs px-3 py-1.5 bg-white text-green-700 rounded-md 
                         hover:bg-green-100 transition-colors border border-green-300"
              >
                08033827335
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {searchResult &&
        (searchResult.consentStatus === "accepted" ||
          !searchResult.isDozaUser) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>
                    {searchResult.statistics?.activePrescriptions || 0} active
                    prescriptions
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>
                    {searchResult.statistics?.totalPrescriptions || 0} total
                    prescriptions
                  </span>
                </div>
              </div>
              <button
                onClick={onNewPatient}
                className="text-green-600 hover:text-green-700 text-sm font-medium 
                       flex items-center gap-1"
              >
                <PlusCircle className="w-4 h-4" />
                New Prescription
              </button>
            </div>
          </div>
        )}
    </div>
  );
};
