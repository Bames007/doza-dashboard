"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  CheckCircle,
  DollarSign,
  Award,
  FileText,
  Home,
  ChevronRight,
  Star,
  HeartPulse,
} from "lucide-react";

// Components
import RoleSelection from "./components/RoleSelection";
import PersonalInfo from "./components/PersonalInfo";
import ProfessionalInfo from "./components/ProfessionalInfo";
import PracticeInfo from "./components/PracticeInfo";
import CredentialsUpload from "./components/CredentialsUpload";
import LegalAgreement from "./components/LegalAgreement";
import SuccessStep from "./components/SuccessStep";

// Types and Data
import { RegistrationStep } from "./type";
import { useMedicRegistration } from "./hook/useMedicRegistration";

const MedicRegistration: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("role");

  const {
    formData,
    updateFormData,
    handleSubmit,
    isSubmitting,
    getLocationFromMap,
  } = useMedicRegistration();

  const steps: {
    id: RegistrationStep;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      id: "role",
      label: "Role",
      icon: <User size={18} />,
      description: "Select your role",
    },
    {
      id: "personal",
      label: "Personal",
      icon: <User size={18} />,
      description: "Your information",
    },
    {
      id: "professional",
      label: "Professional",
      icon: <Award size={18} />,
      description: "Credentials",
    },
    {
      id: "practice",
      label: "Practice",
      icon: <Home size={18} />,
      description: "Practice setup",
    },
    {
      id: "credentials",
      label: "Documents",
      icon: <FileText size={18} />,
      description: "Upload docs",
    },
    {
      id: "legal",
      label: "Agreement",
      icon: <Shield size={18} />,
      description: "Terms & conditions",
    },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case "role":
        return (
          <RoleSelection
            formData={formData}
            updateFormData={updateFormData}
            onNext={() => setCurrentStep("personal")}
          />
        );
      case "personal":
        return (
          <PersonalInfo
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep("role")}
            onNext={() => setCurrentStep("professional")}
          />
        );
      case "professional":
        return (
          <ProfessionalInfo
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep("personal")}
            onNext={() => setCurrentStep("practice")}
          />
        );
      case "practice":
        return (
          <PracticeInfo
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep("professional")}
            onNext={() => setCurrentStep("credentials")}
            getLocationFromMap={getLocationFromMap}
          />
        );
      case "credentials":
        return (
          <CredentialsUpload
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep("practice")}
            onNext={() => setCurrentStep("legal")}
          />
        );
      case "legal":
        return (
          <LegalAgreement
            formData={formData}
            updateFormData={updateFormData}
            onBack={() => setCurrentStep("credentials")}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      case "success":
        return <SuccessStep formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-[#28B04B]/5 via-white to-[#28B04B]/5 py-6 px-4 sm:px-6 lg:px-8"
    >
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#28B04B]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#28B04B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-12"
        >
          {/* Logo/Brand */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#28B04B] to-[#28B04B]/80 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <HeartPulse className="text-white" size={28} />
            </motion.div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Doza <span className="text-[#28B04B]">Network</span>
              </h1>
              <p className="text-sm text-gray-600">Healthcare Professionals</p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Africa's Premier Healthcare Network
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
            Connect with patients across Africa and build your practice through
            our trusted healthcare platform
          </p>
        </motion.div>

        {/* Progress Bar Container */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 md:mb-12"
        >
          {/* Progress Bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#28B04B] to-[#28B04B]/80 rounded-full"
            >
              {/* Animated Shimmer */}
              <motion.div
                animate={{
                  x: ["0%", "100%"],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "linear",
                }}
                className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>

          {/* Steps Indicator */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

            <div className="flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = currentStepIndex > index;
                const isCurrent = currentStep === step.id;
                const stepNumber = index + 1;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center relative"
                  >
                    {/* Step Circle */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                        isCompleted
                          ? "bg-[#28B04B] border-[#28B04B]"
                          : isCurrent
                          ? "bg-white border-[#28B04B] shadow-md"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="text-white" size={18} />
                      ) : (
                        <div
                          className={`flex items-center justify-center ${
                            isCurrent ? "text-[#28B04B]" : "text-gray-500"
                          }`}
                        >
                          {isCurrent ? (
                            step.icon
                          ) : (
                            <span className="text-sm font-semibold">
                              {stepNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>

                    {/* Step Label */}
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium transition-colors ${
                          isCompleted || isCurrent
                            ? "text-[#28B04B]"
                            : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                        {step.description}
                      </p>
                    </div>

                    {/* Active Step Indicator */}
                    {isCurrent && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-[#28B04B] rounded-full border-2 border-white"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Progress Text */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-600">
              Step{" "}
              <span className="font-semibold text-[#28B04B]">
                {currentStepIndex + 1}
              </span>{" "}
              of {steps.length}
            </div>
            <div className="flex items-center gap-2">
              {currentStep !== "success" && (
                <>
                  <div className="w-2 h-2 bg-[#28B04B] rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">
                    Registration in progress
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200/50"
            >
              {/* Content Header */}
              {currentStep !== "success" && (
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#28B04B]/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {steps.find((s) => s.id === currentStep)?.label} Details
                      </h3>
                      <p className="text-sm text-gray-600">
                        Complete this section to continue
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-[#28B04B]/10 rounded-full">
                        <span className="text-sm font-medium text-[#28B04B]">
                          {currentStepIndex + 1}/{steps.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step Component */}
              <div className="p-4 sm:p-6 md:p-8">{renderStep()}</div>

              {/* Success Step Decoration */}
              {currentStep === "success" && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#28B04B] to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#28B04B] to-transparent" />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Quick Stats Bar */}
          {currentStep !== "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                {
                  label: "Active Doctors",
                  value: "2,500+",
                  icon: <User size={16} />,
                },
                {
                  label: "Patient Visits",
                  value: "50K+",
                  icon: <HeartPulse size={16} />,
                },
                {
                  label: "Cities Covered",
                  value: "150+",
                  icon: <Home size={16} />,
                },
                {
                  label: "Satisfaction",
                  value: "98%",
                  icon: <Star size={16} />,
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#28B04B]/10 flex items-center justify-center">
                      <div className="text-[#28B04B]">{stat.icon}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Bottom Navigation Helper */}
          {currentStep !== "success" && currentStep !== "legal" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex justify-center"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Press</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                  Enter
                </kbd>
                <span>to continue to next step</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 pt-8 border-t border-gray-200/50"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Shield size={16} className="text-[#28B04B]" />
                <span className="text-sm text-gray-600">
                  Secure & Encrypted Registration
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Your information is protected with end-to-end encryption
              </p>
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-[#28B04B] transition-colors"
              >
                Help Center
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-[#28B04B] transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-gray-600 hover:text-[#28B04B] transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MedicRegistration;
