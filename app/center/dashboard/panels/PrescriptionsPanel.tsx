"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pill,
  RefreshCw,
  Plus,
  ClipboardList,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Center, User as UserType } from "@/app/center/type";
import { Prescription } from "../types/prescription";
import { PrescriptionsHeader } from "../components/prescriptions/PrescriptionHeader";
import { PatientSearch } from "../components/prescriptions/PatientSearch";
import { StatisticsCards } from "../components/prescriptions/StatisticsCards";
import { QuickFilters } from "../components/prescriptions/QuickFilters";
import { PrescriptionCard } from "../components/prescriptions/PrescriptionCard";
import { NewPrescriptionModal } from "../components/prescriptions/NewPrescriptionModal";
import { PrescriptionDetailsModal } from "../components/prescriptions/PrescriptionDetailsModal";
import { PatientHistoryModal } from "../components/prescriptions/PatientHistoryModal";
import { addBillItem } from "./hospital_components/billing";

interface PrescriptionsPanelProps {
  center: Center;
  user: UserType;
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

export const PrescriptionsPanel = ({
  center,
  user,
}: PrescriptionsPanelProps) => {
  // State
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<
    Prescription[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    dozaUsersCount: 0,
    remindersSent: 0,
    slipsPrinted: 0,
    avgResponseTime: "5m",
  });

  // Modals
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(
    null,
  );

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("week");
  const [selectedPrescriber, setSelectedPrescriber] = useState<string>("all");

  // Mobile states
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Load prescriptions
  useEffect(() => {
    loadPrescriptions();
  }, [center.id, user.id]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/centers/${center.id}/prescriptions`, {
        headers: { "x-user-id": user.id },
      });

      if (!response.ok) throw new Error("Failed to load prescriptions");
      const result = await response.json();

      if (result.success) {
        setPrescriptions(result.data);
        setFilteredPrescriptions(result.data);
        updateStatistics(result.data);
      }
    } catch (error) {
      console.error("Error loading prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatistics = (data: Prescription[]) => {
    const total = data.length;
    const active = data.filter((p) => p.status === "ACTIVE").length;
    const dozaUsers = data.filter((p) => p.isDozaUser).length;
    const slipsPrinted = data.filter((p) => p.slipPrinted).length;
    const avgTime = total > 0 ? "5m" : "0m";

    setStatistics({
      totalPrescriptions: total,
      activePrescriptions: active,
      dozaUsersCount: dozaUsers,
      remindersSent: Math.floor(total * 0.7),
      slipsPrinted,
      avgResponseTime: avgTime,
    });
  };

  // Filter prescriptions
  useEffect(() => {
    let filtered = [...prescriptions];

    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    const now = new Date();
    switch (selectedDateRange) {
      case "today":
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        filtered = filtered.filter((p) => new Date(p.createdAt) >= today);
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((p) => new Date(p.createdAt) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        filtered = filtered.filter((p) => new Date(p.createdAt) >= monthAgo);
        break;
    }

    if (selectedPrescriber !== "all") {
      filtered = filtered.filter(
        (p) => p.prescribedByRole === selectedPrescriber,
      );
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, selectedStatus, selectedDateRange, selectedPrescriber]);

  // Handle patient selection
  const handleSelectPatient = (patient: PatientData) => {
    console.log("Patient selected in PrescriptionsPanel:", patient);
    if (patient) {
      setSelectedPatient(patient);
      setShowPatientHistory(true);
    }
  };

  // Handle prescription actions
  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setShowPrescriptionDetails(true);
  };

  const handlePrintSlip = async (prescription: Prescription) => {
    try {
      const response = await fetch(
        `/api/centers/${center.id}/prescriptions/${prescription.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            action: "PRINT_SLIP",
          }),
        },
      );

      if (response.ok) {
        await loadPrescriptions();
        window.print();
      }
    } catch (error) {
      console.error("Error printing slip:", error);
    }
  };

  const handleSendReminder = async (prescription: Prescription) => {
    try {
      const response = await fetch(
        `/api/centers/${center.id}/prescriptions/${prescription.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            action: "SEND_REMINDER",
          }),
        },
      );

      if (response.ok) {
        alert("Reminder sent successfully!");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  // ✅ CREATE PRESCRIPTION + BILL ITEM
  const handleCreatePrescription = async (data: any) => {
    try {
      const prescriptionData = {
        ...data,
        prescribedBy: user.id,
        prescribedByName: user.fullName,
        prescribedByRole: user.role || "NURSE",
        remindersEnabled: data.isDozaUser && data.remindersEnabled,
      };

      const response = await fetch(`/api/centers/${center.id}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(prescriptionData),
      });

      if (!response.ok) throw new Error("Failed to create prescription");
      const result = await response.json();

      if (result.success) {
        // ✅ Add bill item for the prescription (if it has a price)
        if (data.price && data.price > 0) {
          // We need the patient ID; the prescriptionData should contain patientId
          const patientId = data.patientId || data.patient?.id;
          if (patientId) {
            await addBillItem(
              center.id,
              user.id,
              user.fullName || "Unknown",
              user.role || "staff",
              patientId,
              {
                type: "prescription",
                description: `Prescription: ${data.medication} ${data.dosage}`,
                amount: data.price,
                quantity: data.quantity || 1,
              },
            );
          }
        }

        await loadPrescriptions();
        setShowNewPrescription(false);
        alert(result.message || "Prescription created and billed.");
      }
    } catch (error: any) {
      console.error("Error creating prescription:", error);
      alert(error.message || "Failed to create prescription");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 safe-padding">
      <div className="max-w-7xl mx-auto space-y-4 p-3 sm:p-4 md:p-6">
        <PrescriptionsHeader
          onNewPrescription={() => setShowNewPrescription(true)}
          onSearch={() => {
            const searchInput = document.querySelector(
              'input[placeholder*="Search by patient"]',
            );
            if (searchInput) (searchInput as HTMLElement).focus();
            setIsSearchFocused(true);
          }}
          filterCount={filteredPrescriptions.length}
          onFilterClick={() => setIsMobileFilterOpen(true)}
        />

        {/* Mobile Filter Overlay */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25 }}
                className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-green-600" />
                      Filters
                    </h3>
                    <button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ChevronDown className="w-5 h-5 text-gray-600 rotate-90" />
                    </button>
                  </div>
                  <QuickFilters
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    selectedDateRange={selectedDateRange}
                    onDateRangeChange={setSelectedDateRange}
                    selectedPrescriber={selectedPrescriber}
                    onPrescriberChange={setSelectedPrescriber}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <StatisticsCards {...statistics} />

        <PatientSearch
          onSelectPatient={handleSelectPatient}
          onNewPatient={() => setShowNewPrescription(true)}
          centerId={center.id}
          userId={user.id}
        />

        {/* Desktop Filters */}
        <div className="hidden md:block">
          <QuickFilters
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={setSelectedDateRange}
            selectedPrescriber={selectedPrescriber}
            onPrescriberChange={setSelectedPrescriber}
          />
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white text-gray-700 
                     rounded-lg border border-gray-300 hover:border-green-300 hover:bg-green-50"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
              {(selectedStatus !== "all" ||
                selectedDateRange !== "week" ||
                selectedPrescriber !== "all") && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4 md:space-y-6">
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8"
            >
              <div className="flex flex-col items-center justify-center py-8 md:py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Pill className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <p className="mt-4 text-gray-700 font-medium">
                  Loading prescriptions...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Fetching your patient data
                </p>
              </div>
            </motion.div>
          ) : filteredPrescriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-12 text-center"
            >
              <div
                className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-50 to-emerald-50 
                            rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 
                            border-2 border-dashed border-green-200"
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-600 to-emerald-700 
                              rounded-lg flex items-center justify-center"
                >
                  <ClipboardList className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-900 text-lg md:text-xl font-semibold mb-2">
                No prescriptions found
              </p>
              <p className="text-gray-600 max-w-md mx-auto mb-6 md:mb-8">
                Try adjusting your filters or create a new prescription
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowNewPrescription(true)}
                  className="px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white 
                           rounded-lg hover:from-green-700 hover:to-emerald-800 
                           transition-all duration-200 shadow-sm hover:shadow-md 
                           font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Prescription
                </button>
                <button
                  onClick={() => {
                    setSelectedStatus("all");
                    setSelectedDateRange("week");
                    setSelectedPrescriber("all");
                  }}
                  className="px-5 py-3 bg-white text-green-700 rounded-lg border border-green-300 
                           hover:bg-green-50 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Prescriptions
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium 
                                   rounded-full border border-green-200"
                    >
                      {filteredPrescriptions.length} total
                    </span>
                    {filteredPrescriptions.length > 0 && (
                      <span className="text-sm text-gray-500">
                        Updated just now
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadPrescriptions}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 
                             rounded-lg border border-green-300 hover:bg-green-50 
                             transition-colors font-medium text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowNewPrescription(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 
                             to-emerald-700 text-white rounded-lg hover:from-green-700 
                             hover:to-emerald-800 transition-all duration-200 
                             shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                </div>
              </div>

              {/* Prescriptions Grid/List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {filteredPrescriptions.map((prescription) => (
                  <motion.div
                    key={prescription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 
                             hover:border-green-300 hover:shadow-md transition-all 
                             duration-200 overflow-hidden group"
                  >
                    <PrescriptionCard
                      prescription={prescription}
                      onViewDetails={() => handleViewDetails(prescription)}
                      onPrintSlip={() => handlePrintSlip(prescription)}
                      onSendReminder={() => handleSendReminder(prescription)}
                    />
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-6 pt-6 border-t border-gray-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>
                        Active:{" "}
                        {
                          filteredPrescriptions.filter(
                            (p) => p.status === "ACTIVE",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>
                        Completed:{" "}
                        {
                          filteredPrescriptions.filter(
                            (p) => p.status === "COMPLETED",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span>
                        Cancelled:{" "}
                        {
                          filteredPrescriptions.filter(
                            (p) => p.status === "CANCELLED",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span>
                        Expired:{" "}
                        {
                          filteredPrescriptions.filter(
                            (p) => p.status === "EXPIRED",
                          ).length
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Showing {Math.min(filteredPrescriptions.length, 10)} of{" "}
                      {filteredPrescriptions.length}
                    </span>
                    <select
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 
                 focus:border-green-500 focus:ring-1 focus:ring-green-200 
                 focus:outline-none bg-white"
                      defaultValue="newest"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="patient">Patient Name</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewPrescription && (
          <NewPrescriptionModal
            key="new-prescription"
            center={center}
            user={user}
            patientPhone={selectedPatient?.patientPhone || ""}
            onClose={() => setShowNewPrescription(false)}
            onSave={handleCreatePrescription}
            onLoadPrescriptions={loadPrescriptions}
          />
        )}

        {showPrescriptionDetails && selectedPrescription && (
          <PrescriptionDetailsModal
            key="prescription-details"
            prescription={selectedPrescription}
            centerId={center.id}
            userId={user.id}
            onClose={() => {
              setShowPrescriptionDetails(false);
              setSelectedPrescription(null);
            }}
            onUpdate={loadPrescriptions}
          />
        )}

        {showPatientHistory && selectedPatient && (
          <PatientHistoryModal
            key="patient-history"
            isOpen={showPatientHistory}
            onClose={() => {
              setShowPatientHistory(false);
              setSelectedPatient(null);
            }}
            patient={selectedPatient}
            centerId={center.id}
            userId={user.id}
            medicName={user.fullName}
          />
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <button
          onClick={() => setShowNewPrescription(true)}
          className="p-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white 
                   rounded-full shadow-lg hover:from-green-700 hover:to-emerald-800 
                   transition-all duration-200 hover:shadow-xl"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default PrescriptionsPanel;
