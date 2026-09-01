// app/center/dashboard/components/PanelRenderer.tsx
"use client";

import { useDashboard } from "./DashboardContext";
import { motion } from "framer-motion";

// Import your panel components
import DashboardPanel from "./panels/DashboardPanel";
import AnalyticsPanel from "./panels/AnalyticsPanel";
import PatientsPanel from "./panels/PatientsPanel";
import AppointmentsPanel from "./panels/AppointmentsPanel";
import DoctorsPanel from "./panels/DoctorsPanel";
import InventoryPanel from "./panels/InventoryPanel";
import PrescriptionsPanel from "./panels/PrescriptionsPanel";
import LabTestsPanel from "./panels/LabTestsPanel";
import StaffPanel from "./panels/StaffPanel";
import BillingPanel from "./panels/BillingPanel";
import MessagesPanel from "./panels/MessagesPanel";
import FacilityServicesPanel from "./panels/FacilityManagement";
import SettingsPanel from "./panels/SettingsPanel";
import MedicalRecordsPanel from "./panels/MedicalRecords";
import EmergencyPanel from "./panels/EmergencyPanel";
import PharmacySalesPanel from "./panels/PharmacySalesPanel";
import Equipment from "./panels/EquipmentPanel";
import type { Center } from "../type";
import DrugVerificationPanel from "./panels/DrugVerificationPanel";
import QualityControlPanel from "./panels/QualityControlPanel";
import ResultsPanel from "./panels/ResultsPanel";
import SamplesPanel from "./panels/SamplesPanel";
import NotificationsPanel from "./panels/NotificationPanel";
import HelpPanel from "./panels/HelpPanel";
import AuditLogsPanel from "./panels/AuditLogsPanell";
import DozaNetworkPanel from "./panels/DozaNetworkPanel";
import HospitalPrescriptionPanel from "./panels/HospitalPrescriptionPanel";
import HospitalPharmacyInventoryPanel from "./panels/hospital_panels/HospitalPharmacyInventoryPanel";
import HospitalDrugPurchasePanel from "./panels/hospital_panels/HospitalDrugPurchasePanel";
import HospitalMedicationDispensingPanel from "./panels/hospital_panels/HospitalMedicationDispensingPanel";
import HospitalApprovalPanel from "./panels/hospital_panels/HospitalApprovalPanel";
import HospitalRequisitionPanel from "./panels/hospital_panels/HospitalRequisitionPanel";
import DozaRequestsPanel from "./panels/DozaRequestPanel";

export default function PanelRenderer() {
  const { activePanel, center, user, setCenter } = useDashboard();

  const handleCenterUpdate = (updatedCenter: Center) => {
    setCenter(updatedCenter);

    const storedData = localStorage.getItem("userSession");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        const updatedSession = {
          ...parsedData,
          center: updatedCenter,
        };
        localStorage.setItem("userSession", JSON.stringify(updatedSession));
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
    }
  };

  if (!center || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading panel...</p>
        </div>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return <DashboardPanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "doza-requests":
        return <DozaRequestsPanel />;
      case "auditlogs":
        return <AuditLogsPanel />;
      case "dozaNetwork":
        return <DozaNetworkPanel />;
      case "facility-services":
        return (
          <FacilityServicesPanel
            center={center}
            user={user}
            onUpdate={handleCenterUpdate}
          />
        );
      case "equipment":
        return <Equipment />;
      case "patients":
        return <PatientsPanel />;
      case "hospital-pharmacy-inventory":
        return <HospitalPharmacyInventoryPanel />;
      case "approvals":
        return <HospitalApprovalPanel />;
      case "requisitions":
        return <HospitalRequisitionPanel />;
      case "hospital-pharmacy-drug-store":
        return <HospitalDrugPurchasePanel />;
      case "hospital-pharmacy-medication-dispensing":
        return <HospitalMedicationDispensingPanel />;
      case "hospital-prescription":
        return <HospitalPrescriptionPanel />;
      case "appointments":
        return <AppointmentsPanel />;
      case "doctors":
        return <DoctorsPanel />;
      case "medical-records":
        return <MedicalRecordsPanel />;
      case "emergency":
        return <EmergencyPanel />;
      case "drug-verification":
        return <DrugVerificationPanel />;
      case "inventory":
        return <InventoryPanel center={center} user={user} />;
      case "prescriptions":
        return <PrescriptionsPanel center={center} user={user} />;
      case "lab-tests":
        return <LabTestsPanel />;
      case "notification":
        return <NotificationsPanel />;
      case "help":
        return <HelpPanel />;
      case "staff":
        return (
          <StaffPanel
            center={center}
            onUpdate={handleCenterUpdate}
            user={user}
          />
        );
      case "sales":
        return <PharmacySalesPanel center={center} user={user} />;
      case "billing":
        return <BillingPanel />;
      case "messages":
        return <MessagesPanel />;
      case "settings":
        return <SettingsPanel />;
      case "quality-control":
        return <QualityControlPanel />;
      case "results":
        return <ResultsPanel />;
      case "samples":
        return <SamplesPanel />;
      default:
        return <DashboardPanel />;
    }
  };

  return (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      {renderPanel()}
    </motion.div>
  );
}
