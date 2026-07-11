import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Pill,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";

interface PatientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any; // Could be the full patient object or just phone string
  centerId: string;
  userId: string;
  medicName: string;
}

interface HistoryData {
  patientId: string | null;
  patientPhone: string;
  isDozaUser: boolean;
  consentStatus: string;
  patientProfile: any;
  prescriptions: any[];
  lastVisit: string | null;
  statistics: any;
}

export const PatientHistoryModal = ({
  isOpen,
  onClose,
  patient,
  centerId,
  userId,
  medicName,
}: PatientHistoryModalProps) => {
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract phone number from patient data (handles both object and string)
  const getPatientPhone = () => {
    if (!patient) return null;

    if (typeof patient === "string") {
      return patient;
    } else if (typeof patient === "object" && patient.patientPhone) {
      return patient.patientPhone;
    } else if (typeof patient === "object" && patient.phone) {
      return patient.phone;
    }

    return null;
  };

  const patientPhone = getPatientPhone();

  useEffect(() => {
    if (patientPhone && isOpen) {
      console.log("🔄 Loading patient history for phone:", patientPhone);
      loadPatientHistory(patientPhone);
    }
  }, [patientPhone, isOpen]);

  const loadPatientHistory = async (phone: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log("📞 Fetching history for phone:", phone);

      const response = await fetch(
        `/api/centers/${centerId}/prescriptions/patient/${encodeURIComponent(
          phone
        )}`,
        {
          headers: {
            "x-user-id": userId,
            "x-medic-name": medicName,
          },
        }
      );

      const result = await response.json();
      console.log("📊 History API response:", result);

      if (response.ok && result.success) {
        setHistoryData(result.data);
      } else {
        setError(result.error || "Failed to load patient history");
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("❌ Error loading patient history:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConsentBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            Consent Granted
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">
            <Clock className="w-3 h-3" />
            Awaiting Consent
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3" />
            Consent Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            No Consent Required
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Patient History
            </h2>
            <p className="text-sm text-gray-600">
              {patientPhone || "No phone provided"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <p className="text-gray-600">Loading patient history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                Error Loading History
              </p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => patientPhone && loadPatientHistory(patientPhone)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Patient Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {historyData.patientProfile?.avatar ? (
                      <img
                        src={historyData.patientProfile.avatar}
                        alt={historyData.patientProfile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {historyData.patientProfile?.name || "Unknown Patient"}
                      </h3>
                      {historyData.isDozaUser &&
                        getConsentBadge(historyData.consentStatus)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="text-sm">
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">
                          {historyData.patientPhone}
                        </p>
                      </div>
                      {historyData.patientProfile?.gender && (
                        <div className="text-sm">
                          <p className="text-gray-600">Gender</p>
                          <p className="font-medium">
                            {historyData.patientProfile.gender}
                          </p>
                        </div>
                      )}
                      {historyData.patientProfile?.age && (
                        <div className="text-sm">
                          <p className="text-gray-600">Age</p>
                          <p className="font-medium">
                            {historyData.patientProfile.age}
                          </p>
                        </div>
                      )}
                      <div className="text-sm">
                        <p className="text-gray-600">Status</p>
                        <p className="font-medium">
                          {historyData.isDozaUser
                            ? "Doza User"
                            : "Non-Doza User"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {historyData.statistics?.totalPrescriptions || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Prescriptions
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {historyData.statistics?.activePrescriptions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {historyData.statistics?.completedPrescriptions || 0}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {historyData.statistics?.medicationCount || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Medications</div>
                </div>
              </div>

              {/* Last Visit */}
              {historyData.lastVisit && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Last Visit</span>
                  </div>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(historyData.lastVisit)}
                  </p>
                </div>
              )}

              {/* Prescriptions */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Prescriptions ({historyData.prescriptions.length})
                </h3>

                {historyData.prescriptions.length > 0 ? (
                  <div className="space-y-4">
                    {historyData.prescriptions.map((prescription) => (
                      <div
                        key={prescription.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Pill className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">
                              Prescription #{prescription.id.slice(0, 8)}...
                            </span>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              prescription.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {prescription.status || "UNKNOWN"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Date: {formatDate(prescription.createdAt)}</p>
                          {prescription.patientName && (
                            <p>Patient: {prescription.patientName}</p>
                          )}
                          {prescription.medications?.length > 0 && (
                            <p>
                              Medications: {prescription.medications.length}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No prescriptions found</p>
                  </div>
                )}
              </div>

              {/* Medical Information (if consent granted) */}
              {historyData.consentStatus === "accepted" &&
                historyData.patientProfile && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Medical Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {historyData.patientProfile.bloodGroup && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Blood Group</p>
                          <p className="font-semibold">
                            {historyData.patientProfile.bloodGroup}
                          </p>
                        </div>
                      )}
                      {historyData.patientProfile.genotype && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <p className="text-sm text-gray-600">Genotype</p>
                          <p className="font-semibold">
                            {historyData.patientProfile.genotype}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">
                No patient data available
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Search for a patient to view their history
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
