// app/center/dashboard/DashboardPanel.tsx
"use client";

import { useDashboard } from "../DashboardContext";
import { motion } from "framer-motion";
import DashboardHeader from "../dashboards/components/DashboardHeader";
import LoadingScreen from "../dashboards/components/LoadingScreen";
import AdSection from "../dashboards/components/AdSection";
import TutorialSection from "../dashboards/components/TutorialSection";
import HelpSection from "../dashboards/components/HelpSection";

// Import all dashboards
import PharmacyDashboard from "../dashboards/PharmacyDashboard";
import HospitalDashboard from "../dashboards/HospitalDashboard";
import LabDashboard from "../dashboards/DiagnosticLabDashboard";
import DentalDashboard from "../dashboards/DentalDashboard";
import OpticalDashboard from "../dashboards/OpticalDashboard";
import EmergencyDashboard from "../dashboards/EmergencyDashboard";
import CardiacDashboard from "../dashboards/CardiacDashboard";
import ClinicDashboard from "../dashboards/ClinicDashboard";
import DefaultDashboard from "../dashboards/DefaultDashboard";

export default function DashboardPanel() {
  const { center } = useDashboard();

  if (!center) {
    return <LoadingScreen />;
  }
  const renderDashboard = () => {
    switch (center.centerType) {
      case "pharmacy":
        return <PharmacyDashboard />;
      case "hospital":
        return <HospitalDashboard />;
      case "diagnostic_lab":
        return <LabDashboard />;
      case "dental_clinic":
        return <DentalDashboard />;
      case "optical_center":
        return <OpticalDashboard />;
      case "emergency":
        return <EmergencyDashboard />;
      case "cardiac_center":
        return <CardiacDashboard />;
      case "clinic":
      case "medical_center":
        return <ClinicDashboard />;
      default:
        return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header – shared across all center types */}
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main dashboard content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderDashboard()}
        </motion.div>

        {/* Shared footer sections */}
        <div className="mt-12 space-y-8">
          <AdSection />
          <TutorialSection />
          <HelpSection />
        </div>

        {/* Footer note */}
        <div className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>
            For detailed management, please use the respective sections in the
            sidebar menu.
          </p>
          <p className="mt-1">
            Dashboard updated:{" "}
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
