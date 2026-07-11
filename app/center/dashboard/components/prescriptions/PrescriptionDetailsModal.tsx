"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Pill,
  Printer,
  Bell,
  Clock,
  CheckCircle,
  FileText,
  Clipboard,
  History,
  UserCheck,
  AlertCircle,
  Calendar,
  Heart,
  Thermometer,
  Activity,
  Scale,
  Eye,
  Download,
  Share2,
} from "lucide-react";
import { Prescription } from "../../types/prescription";

interface PrescriptionDetailsModalProps {
  prescription: Prescription;
  centerId: string;
  userId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export const PrescriptionDetailsModal = ({
  prescription,
  centerId,
  userId,
  onClose,
  onUpdate,
}: PrescriptionDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [prescription.id]);

  const loadAuditLogs = async () => {
    try {
      const response = await fetch(
        `/api/centers/${centerId}/prescriptions/${prescription.id}/audit`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAuditLogs(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  };

  const handleDispenseMedication = async (medicationId: string) => {
    try {
      const response = await fetch(
        `/api/centers/${centerId}/prescriptions/${prescription.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            action: "DISPENSE_MEDICATION",
            medicationId,
          }),
        }
      );

      if (response.ok) {
        await onUpdate();
      }
    } catch (error) {
      console.error("Error dispensing medication:", error);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleSendReminder = async () => {
    try {
      const response = await fetch(
        `/api/centers/${centerId}/prescriptions/${prescription.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            action: "SEND_REMINDER",
          }),
        }
      );

      if (response.ok) {
        alert("Reminder sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border border-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border border-red-200";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "NURSE":
        return "bg-green-100 text-green-800";
      case "PHARMACIST":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const ModalWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-xl sm:rounded-2xl shadow-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );

  return (
    <ModalWrapper>
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Prescription Details
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                ID: {prescription.id.slice(0, 8)} •{" "}
                {formatDate(prescription.createdAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
              prescription.status
            )}`}
          >
            {prescription.status}
          </span>
          {prescription.isDozaUser && (
            <span className="px-3 py-1.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-sm font-medium">
              Doza User
            </span>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
            <Calendar className="w-4 h-4" />
            <span>Created: {formatDate(prescription.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <button
              onClick={handlePrintSlip}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </button>

            {prescription.isDozaUser && prescription.remindersEnabled && (
              <button
                onClick={handleSendReminder}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <Bell className="w-4 h-4" />
                Send Reminder
              </button>
            )}

            {!prescription.isDozaUser && (
              <button
                onClick={() => console.log("Send Doza invitation")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                <UserCheck className="w-4 h-4" />
                Invite to Doza
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "details"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient Details
              </div>
            </button>
            <button
              onClick={() => setActiveTab("medications")}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "medications"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Medications ({prescription.medications.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("vitals")}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "vitals"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Vitals
              </div>
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === "audit"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Logs
              </div>
            </button>
          </div>

          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Patient Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900">
                      {prescription.patientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium text-gray-900">
                      {prescription.patientPhone}
                    </p>
                  </div>
                  {prescription.patientAge && (
                    <div>
                      <p className="text-sm text-gray-600">Age</p>
                      <p className="font-medium text-gray-900">
                        {prescription.patientAge} years
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Doza User</p>
                    <p className="font-medium">
                      {prescription.isDozaUser ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-600">No</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-green-600" />
                  Medical Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Chief Complaints
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{prescription.complaints}</p>
                    </div>
                  </div>

                  {prescription.diagnosis && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Diagnosis</p>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-gray-900">
                          {prescription.diagnosis}
                        </p>
                      </div>
                    </div>
                  )}

                  {prescription.notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Additional Notes
                      </p>
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <p className="text-gray-900">{prescription.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  Timing Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(prescription.startDate)}
                    </p>
                  </div>
                  {prescription.endDate && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">End Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(prescription.endDate)}
                      </p>
                    </div>
                  )}
                  {prescription.nextRefillDate && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-700">Next Refill</p>
                      <p className="font-medium text-green-900">
                        {formatDate(prescription.nextRefillDate)}
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Created On</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(prescription.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prescriber Information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Prescriber Information
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <User className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {prescription.prescribedByName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            prescription.prescribedByRole
                          )}`}
                        >
                          {prescription.prescribedByRole}
                        </span>
                        <span className="text-sm text-gray-600">
                          Center ID: {centerId.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Prescription ID</p>
                    <p className="font-medium text-gray-900">
                      {prescription.id.slice(0, 12)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === "medications" && (
            <div className="space-y-4">
              {prescription.medications.map((medication, index) => (
                <div
                  key={medication.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-5 h-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">
                          {medication.name}
                        </h4>
                      </div>
                      {medication.genericName && (
                        <p className="text-sm text-gray-600 mb-3">
                          Generic: {medication.genericName}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {medication.dosage}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
                          {medication.frequency}
                        </span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                          {medication.duration}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
                          Qty: {medication.quantity} {medication.unit}
                        </span>
                      </div>
                    </div>
                    {medication.dispensed ? (
                      <span className="px-3 py-2 bg-green-100 text-green-800 border border-green-300 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Dispensed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDispenseMedication(medication.id)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all text-sm font-medium"
                      >
                        Mark as Dispensed
                      </button>
                    )}
                  </div>

                  {medication.instructions && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Instructions
                      </p>
                      <p className="text-amber-900">
                        {medication.instructions}
                      </p>
                    </div>
                  )}

                  {/* Dispensing Information */}
                  {medication.dispensed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Dispensed Information
                          </p>
                          <p className="text-sm text-green-700">
                            Quantity:{" "}
                            {medication.dispensedQuantity ||
                              medication.quantity}{" "}
                            {medication.unit}
                          </p>
                        </div>
                        {medication.dispensedAt && (
                          <p className="text-sm text-green-700">
                            Dispensed on: {formatDate(medication.dispensedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Safety Information */}
                  {((medication.sideEffects &&
                    medication.sideEffects.length > 0) ||
                    (medication.contraindications &&
                      medication.contraindications.length > 0)) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Safety Information
                      </h5>
                      <div className="space-y-3">
                        {medication.sideEffects &&
                          medication.sideEffects.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <p className="text-xs font-medium text-red-800 mb-1">
                                Possible Side Effects
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {medication.sideEffects.map((effect, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-white text-red-700 text-xs rounded-full"
                                  >
                                    {effect}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        {medication.contraindications &&
                          medication.contraindications.length > 0 && (
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <p className="text-xs font-medium text-orange-800 mb-1">
                                Contraindications
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {medication.contraindications.map(
                                  (contra, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-white text-orange-700 text-xs rounded-full"
                                    >
                                      {contra}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Vitals Tab */}
          {activeTab === "vitals" &&
            Object.keys(prescription.vitals).some(
              (key) =>
                prescription.vitals[key as keyof typeof prescription.vitals]
            ) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {prescription.vitals.bloodPressure && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          Blood Pressure
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {prescription.vitals.bloodPressure}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600">mmHg</p>
                  </div>
                )}

                {prescription.vitals.temperature && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Thermometer className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-700 font-medium">
                          Temperature
                        </p>
                        <p className="text-2xl font-bold text-orange-900">
                          {prescription.vitals.temperature}°C
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-orange-600">Celsius</p>
                  </div>
                )}

                {prescription.vitals.heartRate && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Heart className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-red-700 font-medium">
                          Heart Rate
                        </p>
                        <p className="text-2xl font-bold text-red-900">
                          {prescription.vitals.heartRate} bpm
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-red-600">Beats per minute</p>
                  </div>
                )}

                {prescription.vitals.bmi && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Scale className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-700 font-medium">
                          BMI
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {prescription.vitals.bmi}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600">Body Mass Index</p>
                  </div>
                )}

                {prescription.vitals.oxygenSaturation && (
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Activity className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-emerald-700 font-medium">
                          SpO₂
                        </p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {prescription.vitals.oxygenSaturation}%
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-emerald-600">
                      Oxygen Saturation
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* Audit Logs Tab */}
          {activeTab === "audit" && (
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">
                    No audit logs found
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Activity logs will appear here
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              log.action === "CREATED"
                                ? "bg-green-100 text-green-800"
                                : log.action === "UPDATED"
                                ? "bg-blue-100 text-blue-800"
                                : log.action === "DISPENSED"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {log.action.replace("_", " ")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-900">{log.details}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          <User className="w-3 h-3 inline mr-1" />
                          By: {log.userName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePrintSlip}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors font-medium">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
