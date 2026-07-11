"use client";

import { useState } from "react";
import {
  User,
  Phone,
  Calendar,
  Pill,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  Bell,
  AlertCircle,
  Clipboard,
  Heart,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Activity,
  Thermometer,
  Download,
  Share2,
} from "lucide-react";
import { Prescription } from "../../types/prescription";

interface PrescriptionCardProps {
  prescription: Prescription;
  onViewDetails: () => void;
  onPrintSlip: () => void;
  onSendReminder: () => void;
}

export const PrescriptionCard = ({
  prescription,
  onViewDetails,
  onPrintSlip,
  onSendReminder,
}: PrescriptionCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Activity className="w-3 h-3" />;
      case "COMPLETED":
        return <CheckCircle className="w-3 h-3" />;
      case "CANCELLED":
        return <XCircle className="w-3 h-3" />;
      case "EXPIRED":
        return <Clock className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "NURSE":
        return "bg-green-100 text-green-800 border border-green-200";
      case "PHARMACIST":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getDozaStatus = () => {
    if (prescription.isDozaUser) {
      return "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200";
    }
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-green-300 transition-colors duration-200">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left Section - Patient Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getDozaStatus()}`}>
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {prescription.patientName}
                </h3>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                      prescription.status
                    )}`}
                  >
                    {getStatusIcon(prescription.status)}
                    <span>{prescription.status}</span>
                  </span>
                  {prescription.isDozaUser && (
                    <span className="px-2 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 border border-indigo-200 rounded-full text-xs font-medium">
                      Doza User
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="truncate">{prescription.patientPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(prescription.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5" />
                  <span>{prescription.medications.length} meds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Expand Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 border-t border-gray-100">
          {/* Complaints */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clipboard className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Chief Complaints</h4>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {prescription.complaints}
            </p>
          </div>

          {/* Vitals Preview */}
          {(prescription.vitals.bloodPressure ||
            prescription.vitals.temperature ||
            prescription.vitals.heartRate) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-gray-900">Vital Signs</h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {prescription.vitals.bloodPressure && (
                  <div className="bg-red-50 p-2 rounded-lg border border-red-200">
                    <p className="text-xs text-red-700 font-medium">BP</p>
                    <p className="text-sm font-bold text-red-900">
                      {prescription.vitals.bloodPressure}
                    </p>
                  </div>
                )}
                {prescription.vitals.temperature && (
                  <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
                    <p className="text-xs text-orange-700 font-medium">Temp</p>
                    <p className="text-sm font-bold text-orange-900">
                      {prescription.vitals.temperature}°C
                    </p>
                  </div>
                )}
                {prescription.vitals.heartRate && (
                  <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium">HR</p>
                    <p className="text-sm font-bold text-blue-900">
                      {prescription.vitals.heartRate}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medications Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-gray-900">Medications</h4>
              </div>
              <span className="text-sm text-gray-600">
                {prescription.medications.length} total
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {prescription.medications.slice(0, 3).map((medication) => (
                <div
                  key={medication.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {medication.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-white text-blue-700 rounded-full">
                        {medication.dosage}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-white text-purple-700 rounded-full">
                        {medication.frequency}
                      </span>
                    </div>
                  </div>
                  {medication.dispensed ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Done
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              ))}
              {prescription.medications.length > 3 && (
                <p className="text-center text-sm text-gray-500 py-2">
                  +{prescription.medications.length - 3} more medications
                </p>
              )}
            </div>
          </div>

          {/* Prescriber Info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prescribed by</p>
                <p className="font-medium text-gray-900">
                  {prescription.prescribedByName}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                prescription.prescribedByRole
              )}`}
            >
              {prescription.prescribedByRole}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={onViewDetails}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              Details
            </button>

            <button
              onClick={onPrintSlip}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            {prescription.isDozaUser && prescription.remindersEnabled && (
              <button
                onClick={onSendReminder}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <Bell className="w-4 h-4" />
                Remind
              </button>
            )}

            {!prescription.isDozaUser && (
              <button
                onClick={() => console.log("Send Doza invitation")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                Invite
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
