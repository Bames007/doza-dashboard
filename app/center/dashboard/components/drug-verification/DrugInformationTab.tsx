// app/components/drug-verification/DrugInformationTab.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Mic,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Shield,
  Database,
  CheckSquare,
  Package,
  FileText,
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
  Trash2,
  X,
  ArrowLeft,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface DrugInformationTabProps {
  user: any;
  center: any;
  onVerificationComplete: () => void;
}

const DrugInformationTab: React.FC<DrugInformationTabProps> = ({
  user,
  center,
  onVerificationComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useSpeech, setUseSpeech] = useState(false);
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [speechField, setSpeechField] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const [drugData, setDrugData] = useState({
    genericName: "",
    brandNames: [""],
    strength: "",
    dosageForm: "",
    manufacturer: "",
    nafdacNumber: "",
    barcode: "",
    drugClass: [""],
    atcCode: "",
    mechanismOfAction: "",
    indications: [""],
    contraindications: [""],
    sideEffects: [""],
    warnings: [""],
    interactions: [""],
    dosage: "",
    administration: "",
    route: "",
    frequency: "",
    pharmacology: {
      pharmacokinetics: "",
      pharmacodynamics: "",
      halfLife: "",
      proteinBinding: "",
      metabolism: "",
      excretion: "",
    },
    pregnancyCategory: "",
    breastfeedingSafety: "",
    pediatricUse: "",
    geriatricUse: "",
    hepaticImpairment: "",
    renalImpairment: "",
    storage: "",
    monitoringParameters: [""],
    alternatives: [""],
    references: [""],
    regulatoryStatus: {
      fdaApproved: false,
      fdaApprovalDate: "",
      schedule: "",
    },
    images: [],
  });

  const steps = [
    {
      id: "basic",
      name: "Basic Info",
      icon: Package,
      required: true,
      bgColor: "bg-blue-100",
      textColor: "text-blue-600",
      borderColor: "border-blue-200",
      indicatorColor: "bg-blue-500",
    },
    {
      id: "classification",
      name: "Classification",
      icon: Database,
      required: true,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      borderColor: "border-purple-200",
      indicatorColor: "bg-purple-500",
    },
    {
      id: "medical",
      name: "Medical Info",
      icon: Shield,
      required: true,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
      borderColor: "border-green-200",
      indicatorColor: "bg-green-500",
    },
    {
      id: "dosage",
      name: "Dosage",
      icon: CheckSquare,
      required: true,
      bgColor: "bg-orange-100",
      textColor: "text-orange-600",
      borderColor: "border-orange-200",
      indicatorColor: "bg-orange-500",
    },
    {
      id: "pharmacology",
      name: "Pharmacology",
      icon: FileText,
      required: false,
      bgColor: "bg-red-100",
      textColor: "text-red-600",
      borderColor: "border-red-200",
      indicatorColor: "bg-red-500",
    },
    {
      id: "special",
      name: "Special Pop.",
      icon: Users,
      required: false,
      bgColor: "bg-indigo-100",
      textColor: "text-indigo-600",
      borderColor: "border-indigo-200",
      indicatorColor: "bg-indigo-500",
    },
    {
      id: "additional",
      name: "Additional",
      icon: Plus,
      required: false,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-200",
      indicatorColor: "bg-yellow-500",
    },
  ];

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 640) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Track form progress
  useEffect(() => {
    const progress: Record<string, boolean> = {};

    // Basic info progress
    progress.basic = !!(
      drugData.genericName &&
      drugData.strength &&
      drugData.dosageForm &&
      drugData.manufacturer
    );

    // Classification progress
    progress.classification = !!(drugData.drugClass[0] && drugData.atcCode);

    // Medical info progress
    progress.medical = !!(
      drugData.mechanismOfAction &&
      drugData.indications[0] &&
      drugData.sideEffects[0]
    );

    // Dosage progress
    progress.dosage = !!(drugData.dosage && drugData.administration);

    // Pharmacology progress (optional)
    progress.pharmacology = !!(
      drugData.pharmacology.pharmacokinetics ||
      drugData.pharmacology.pharmacodynamics
    );

    // Special populations progress (optional)
    progress.special = !!(
      drugData.pediatricUse ||
      drugData.geriatricUse ||
      drugData.pregnancyCategory
    );

    // Additional info progress (optional)
    progress.additional = !!(drugData.storage || drugData.references[0]);

    setFormProgress(progress);
  }, [drugData]);

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    // Scroll to top of form on mobile
    if (deviceType === "mobile" && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate required steps
      const requiredSteps = steps.filter((step) => step.required);
      const requiredStepIds = requiredSteps.map((step) => step.id);

      for (const stepId of requiredStepIds) {
        if (!formProgress[stepId]) {
          throw new Error(
            `Please complete all required fields in ${
              steps.find((s) => s.id === stepId)?.name
            }`
          );
        }
      }

      // First, check if user is a verified medic and get their medic ID
      const medicCheckResponse = await fetch(
        `/api/medics/check?email=${encodeURIComponent(user.email)}`
      );
      const medicCheckData = await medicCheckResponse.json();

      if (!medicCheckData.isRegistered || !medicCheckData.isMedic) {
        throw new Error(
          "You must be a verified Doza Medic to submit drug information"
        );
      }

      if (
        !drugData.genericName ||
        !drugData.strength ||
        !drugData.dosageForm ||
        !drugData.manufacturer
      ) {
        throw new Error("Please fill in all required basic information fields");
      }

      // Use the verified medic ID and name
      const response = await fetch("/api/drugs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-medic-id": medicCheckData.medicId,
          "x-medic-name": `${user.fullName}`,
          "x-center-id": center.id,
          "x-center-name": center.name,
        },
        body: JSON.stringify({ drugData }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit drug verification");
      }

      setSuccess(true);
      onVerificationComplete();

      // Reset form after successful submission
      setTimeout(() => {
        setSuccess(false);
        resetForm();
        setCurrentStep(0);
      }, 3000);
    } catch (error: any) {
      setError(error.message);
      console.error("Submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDrugData({
      genericName: "",
      brandNames: [""],
      strength: "",
      dosageForm: "",
      manufacturer: "",
      nafdacNumber: "",
      barcode: "",
      drugClass: [""],
      atcCode: "",
      mechanismOfAction: "",
      indications: [""],
      contraindications: [""],
      sideEffects: [""],
      warnings: [""],
      interactions: [""],
      dosage: "",
      administration: "",
      route: "",
      frequency: "",
      pharmacology: {
        pharmacokinetics: "",
        pharmacodynamics: "",
        halfLife: "",
        proteinBinding: "",
        metabolism: "",
        excretion: "",
      },
      pregnancyCategory: "",
      breastfeedingSafety: "",
      pediatricUse: "",
      geriatricUse: "",
      hepaticImpairment: "",
      renalImpairment: "",
      storage: "",
      monitoringParameters: [""],
      alternatives: [""],
      references: [""],
      regulatoryStatus: {
        fdaApproved: false,
        fdaApprovalDate: "",
        schedule: "",
      },
      images: [],
    });
    setFormProgress({});
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInformationSection
            data={drugData}
            onChange={setDrugData}
            useSpeech={useSpeech}
            speechField={speechField}
            onSpeechFieldChange={setSpeechField}
            deviceType={deviceType}
          />
        );
      case 1:
        return (
          <ClassificationSection
            data={drugData}
            onChange={setDrugData}
            useSpeech={useSpeech}
            speechField={speechField}
            onSpeechFieldChange={setSpeechField}
            deviceType={deviceType}
          />
        );
      case 2:
        return (
          <MedicalInformationSection
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 3:
        return (
          <DosageAdministrationSection
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 4:
        return (
          <PharmacologySection
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 5:
        return (
          <SpecialPopulationsSection
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 6:
        return (
          <AdditionalInformationSection
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      default:
        return null;
    }
  };

  // Mobile responsive layout
  if (deviceType === "mobile") {
    return (
      <div className="min-h-screen bg-gray-50 p-4" ref={formRef}>
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 -mx-4 px-4 pb-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-gray-100 text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">
              Drug Verification
            </h1>
            <button
              onClick={() => setUseSpeech(!useSpeech)}
              className={`p-2 rounded-lg ${
                useSpeech
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Progress Steps */}
          <div className="overflow-x-auto pb-2">
            <div className="flex space-x-2 min-w-max">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${
                    currentStep === index
                      ? `${step.bgColor} ${step.borderColor}`
                      : formProgress[step.id]
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full ${
                      currentStep === index
                        ? step.indicatorColor
                        : formProgress[step.id]
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  >
                    {formProgress[step.id] ? (
                      <Check className="w-3 h-3 text-white" />
                    ) : (
                      <step.icon
                        className={`w-3 h-3 ${
                          currentStep === index ? "text-white" : "text-gray-500"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${
                      currentStep === index
                        ? step.textColor
                        : formProgress[step.id]
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Step Info */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep].name}
              </h2>
              <p className="text-sm text-gray-600">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
            {steps[currentStep].required && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Required
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${steps[currentStep].indicatorColor} h-2 rounded-full`}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <SuccessMessageMobile onClose={() => setSuccess(false)} />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <ErrorMessageMobile
                message={error}
                onClose={() => setError(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speech Input Panel */}
        {speechField && useSpeech && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Voice Input Active
                </span>
              </div>
              <button
                onClick={() => setSpeechField(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-blue-700">
              Speak clearly to enter text for this field
            </p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
          <div className="p-4">{getStepContent()}</div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              if (confirm("Clear all fields?")) resetForm();
            }}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
          <button
            onClick={() => {
              // Save draft logic
              alert("Draft saved!");
            }}
            className="flex-1 py-2.5 border border-blue-300 text-blue-700 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>

        {/* Mobile Navigation Footer - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
                currentStep === 0
                  ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 mx-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Verification
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex-1 mx-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700"
              >
                <span className="font-medium">Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress Text */}
          <div className="text-center text-xs text-gray-500 mt-2">
            {Object.values(formProgress).filter(Boolean).length} of{" "}
            {steps.length} steps completed
          </div>
        </div>

        {/* Spacer for fixed footer */}
        <div className="h-24" />
      </div>
    );
  }

  // Desktop/Tablet Layout
  return (
    <div className="p-4 md:p-6" ref={formRef}>
      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <SuccessMessage onClose={() => setSuccess(false)} />
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <ErrorMessage message={error} onClose={() => setError(null)} />
        </motion.div>
      )}

      {/* Speech Input Panel */}
      {speechField && useSpeech && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">Voice Input Active</h4>
            </div>
            <button
              onClick={() => setSpeechField(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            Speak clearly to enter text for{" "}
            {speechField.replace(/([A-Z])/g, " $1").toLowerCase()}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-4 sticky top-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Steps
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseSpeech(!useSpeech)}
                  className={`p-2 rounded-lg ${
                    useSpeech
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">
                  {Object.values(formProgress).filter(Boolean).length}/
                  {steps.length}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      (Object.values(formProgress).filter(Boolean).length /
                        steps.length) *
                      100
                    }%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {Math.round(
                  (Object.values(formProgress).filter(Boolean).length /
                    steps.length) *
                    100
                )}
                % Complete
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`
                    w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left transition-all group
                    ${
                      currentStep === index
                        ? `${step.bgColor} ${step.borderColor} shadow-sm`
                        : "hover:bg-white hover:border hover:border-gray-200"
                    }
                    ${
                      formProgress[step.id]
                        ? "border-l-4 border-l-green-500"
                        : ""
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        currentStep === index
                          ? `${step.indicatorColor} text-white`
                          : formProgress[step.id]
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {formProgress[step.id] ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {step.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {step.required ? "Required" : "Optional"}
                      </div>
                    </div>
                  </div>
                  {currentStep === index ? (
                    <div className="animate-pulse">
                      <div
                        className={`w-2 h-2 rounded-full ${step.indicatorColor}`}
                      />
                    </div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600">Completed</div>
                  <div className="text-lg font-bold text-green-700">
                    {Object.values(formProgress).filter(Boolean).length}
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600">Remaining</div>
                  <div className="text-lg font-bold text-blue-700">
                    {steps.length -
                      Object.values(formProgress).filter(Boolean).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Form Header */}
            <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg ${steps[currentStep].bgColor}`}
                    >
                      {(() => {
                        const StepIcon = steps[currentStep].icon;
                        return (
                          <StepIcon
                            className={`w-5 h-5 ${steps[currentStep].textColor}`}
                          />
                        );
                      })()}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {steps[currentStep].name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className={`p-2 rounded-lg ${
                      currentStep === 0
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentStep === steps.length - 1}
                    className={`p-2 rounded-lg ${
                      currentStep === steps.length - 1
                        ? "opacity-50 cursor-not-allowed bg-gray-100"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-4 md:p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
              {getStepContent()}
            </div>

            {/* Form Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span>
                      Verified by{" "}
                      <strong className="text-gray-900">{user.fullName}</strong>{" "}
                      from{" "}
                      <strong className="text-gray-900">{center.name}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to clear all fields?")
                      ) {
                        resetForm();
                        setCurrentStep(0);
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>

                  {currentStep === steps.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Submit Verification
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      Save & Continue
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components with responsive design

const BasicInformationSection: React.FC<any> = ({
  data,
  onChange,
  useSpeech,
  speechField,
  onSpeechFieldChange,
  deviceType,
}) => {
  const gridClasses =
    deviceType === "mobile"
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className="space-y-4">
      <div className={gridClasses}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Generic Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.genericName}
              onChange={(e) =>
                onChange({ ...data, genericName: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="e.g., Amoxicillin"
            />
            {useSpeech && (
              <button
                onClick={() =>
                  onSpeechFieldChange(
                    speechField === "genericName" ? null : "genericName"
                  )
                }
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                  speechField === "genericName"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strength <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.strength}
              onChange={(e) => onChange({ ...data, strength: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="e.g., 500mg"
            />
            {useSpeech && (
              <button
                onClick={() =>
                  onSpeechFieldChange(
                    speechField === "strength" ? null : "strength"
                  )
                }
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                  speechField === "strength"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dosage Form <span className="text-red-500">*</span>
          </label>
          <select
            value={data.dosageForm}
            onChange={(e) => onChange({ ...data, dosageForm: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white"
          >
            <option value="" className="text-gray-500">
              Select form
            </option>
            <option value="Tablet" className="text-gray-900">
              Tablet
            </option>
            <option value="Capsule" className="text-gray-900">
              Capsule
            </option>
            <option value="Syrup" className="text-gray-900">
              Syrup
            </option>
            <option value="Injection" className="text-gray-900">
              Injection
            </option>
            <option value="Ointment" className="text-gray-900">
              Ointment
            </option>
            <option value="Cream" className="text-gray-900">
              Cream
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manufacturer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.manufacturer}
              onChange={(e) =>
                onChange({ ...data, manufacturer: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="e.g., Pfizer Inc."
            />
            {useSpeech && (
              <button
                onClick={() =>
                  onSpeechFieldChange(
                    speechField === "manufacturer" ? null : "manufacturer"
                  )
                }
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                  speechField === "manufacturer"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Additional fields for mobile with accordion */}
      {deviceType === "mobile" ? (
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Names
            </label>
            {data.brandNames.map((brand: string, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => {
                    const newBrands = [...data.brandNames];
                    newBrands[index] = e.target.value;
                    onChange({ ...data, brandNames: newBrands });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-500"
                  placeholder="Brand name"
                />
                {data.brandNames.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newBrands = data.brandNames.filter(
                        (_: string, i: number) => i !== index
                      );
                      onChange({ ...data, brandNames: newBrands });
                    }}
                    className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChange({ ...data, brandNames: [...data.brandNames, ""] })
              }
              className="w-full mt-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Brand Name
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NAFDAC Number
            </label>
            <input
              type="text"
              value={data.nafdacNumber}
              onChange={(e) =>
                onChange({ ...data, nafdacNumber: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="04-3548"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <input
              type="text"
              value={data.barcode}
              onChange={(e) => onChange({ ...data, barcode: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="123456789012"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const ClassificationSection: React.FC<any> = ({
  data,
  onChange,
  useSpeech,
  speechField,
  onSpeechFieldChange,
  deviceType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Drug Class <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {data.drugClass.map((cls: string, index: number) => (
            <div key={index} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cls}
                  onChange={(e) => {
                    const newClasses = [...data.drugClass];
                    newClasses[index] = e.target.value;
                    onChange({ ...data, drugClass: newClasses });
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
                  placeholder="e.g., Beta-lactam antibiotic"
                />
                {useSpeech && index === 0 && (
                  <button
                    onClick={() =>
                      onSpeechFieldChange(
                        speechField === "drugClass" ? null : "drugClass"
                      )
                    }
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                      speechField === "drugClass"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {data.drugClass.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newClasses = data.drugClass.filter(
                      (_: string, i: number) => i !== index
                    );
                    onChange({ ...data, drugClass: newClasses });
                  }}
                  className="px-3 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...data, drugClass: [...data.drugClass, ""] })
            }
            className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Drug Class
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ATC Code
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.atcCode}
            onChange={(e) => onChange({ ...data, atcCode: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
            placeholder="e.g., J01CA04"
          />
          {useSpeech && (
            <button
              onClick={() =>
                onSpeechFieldChange(
                  speechField === "atcCode" ? null : "atcCode"
                )
              }
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                speechField === "atcCode"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MedicalInformationSection: React.FC<any> = ({
  data,
  onChange,
  deviceType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mechanism of Action <span className="text-red-500">*</span>
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.mechanismOfAction}
            onChange={(value) =>
              onChange({ ...data, mechanismOfAction: value })
            }
            placeholder="Describe how the drug works..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Indications <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {data.indications.map((ind: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={ind}
                onChange={(e) => {
                  const newIndications = [...data.indications];
                  newIndications[index] = e.target.value;
                  onChange({ ...data, indications: newIndications });
                }}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., Treatment of bacterial infections"
              />
              {data.indications.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newIndications = data.indications.filter(
                      (_: string, i: number) => i !== index
                    );
                    onChange({ ...data, indications: newIndications });
                  }}
                  className="px-3 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...data, indications: [...data.indications, ""] })
            }
            className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Indication
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Side Effects <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {data.sideEffects.map((effect: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={effect}
                onChange={(e) => {
                  const newEffects = [...data.sideEffects];
                  newEffects[index] = e.target.value;
                  onChange({ ...data, sideEffects: newEffects });
                }}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., Nausea, headache"
              />
              {data.sideEffects.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newEffects = data.sideEffects.filter(
                      (_: string, i: number) => i !== index
                    );
                    onChange({ ...data, sideEffects: newEffects });
                  }}
                  className="px-3 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...data, sideEffects: [...data.sideEffects, ""] })
            }
            className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Side Effect
          </button>
        </div>
      </div>
    </div>
  );
};

const DosageAdministrationSection: React.FC<any> = ({
  data,
  onChange,
  deviceType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dosage Instructions <span className="text-red-500">*</span>
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.dosage}
            onChange={(value) => onChange({ ...data, dosage: value })}
            placeholder="Provide dosage instructions..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Administration <span className="text-red-500">*</span>
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.administration}
            onChange={(value) => onChange({ ...data, administration: value })}
            placeholder="Describe administration method..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div
        className={`grid ${
          deviceType === "mobile" ? "grid-cols-1" : "grid-cols-2"
        } gap-3`}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Route
          </label>
          <select
            value={data.route}
            onChange={(e) => onChange({ ...data, route: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-900 bg-white"
          >
            <option value="" className="text-gray-500">
              Select route
            </option>
            <option value="Oral" className="text-gray-900">
              Oral
            </option>
            <option value="IV" className="text-gray-900">
              Intravenous
            </option>
            <option value="IM" className="text-gray-900">
              Intramuscular
            </option>
            <option value="Topical" className="text-gray-900">
              Topical
            </option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Frequency
          </label>
          <select
            value={data.frequency}
            onChange={(e) => onChange({ ...data, frequency: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm text-gray-900 bg-white"
          >
            <option value="" className="text-gray-500">
              Select frequency
            </option>
            <option value="Once daily" className="text-gray-900">
              Once daily
            </option>
            <option value="Twice daily" className="text-gray-900">
              Twice daily
            </option>
            <option value="Three times daily" className="text-gray-900">
              Three times daily
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

const PharmacologySection: React.FC<any> = ({ data, onChange, deviceType }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pharmacokinetics
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.pharmacology.pharmacokinetics}
            onChange={(value) =>
              onChange({
                ...data,
                pharmacology: { ...data.pharmacology, pharmacokinetics: value },
              })
            }
            placeholder="Describe absorption, distribution, metabolism, excretion..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pharmacodynamics
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.pharmacology.pharmacodynamics}
            onChange={(value) =>
              onChange({
                ...data,
                pharmacology: { ...data.pharmacology, pharmacodynamics: value },
              })
            }
            placeholder="Describe drug-receptor interactions..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>
    </div>
  );
};

const SpecialPopulationsSection: React.FC<any> = ({
  data,
  onChange,
  deviceType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pediatric Use
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.pediatricUse}
            onChange={(value) => onChange({ ...data, pediatricUse: value })}
            placeholder="Describe pediatric dosing and safety..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Geriatric Use
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.geriatricUse}
            onChange={(value) => onChange({ ...data, geriatricUse: value })}
            placeholder="Describe considerations for elderly patients..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div
        className={`grid ${
          deviceType === "mobile" ? "grid-cols-1" : "grid-cols-2"
        } gap-3`}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pregnancy Category
          </label>
          <select
            value={data.pregnancyCategory}
            onChange={(e) =>
              onChange({ ...data, pregnancyCategory: e.target.value })
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
          >
            <option value="" className="text-gray-500">
              Select category
            </option>
            <option value="A" className="text-gray-900">
              Category A
            </option>
            <option value="B" className="text-gray-900">
              Category B
            </option>
            <option value="C" className="text-gray-900">
              Category C
            </option>
            <option value="D" className="text-gray-900">
              Category D
            </option>
            <option value="X" className="text-gray-900">
              Category X
            </option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Breastfeeding Safety
          </label>
          <select
            value={data.breastfeedingSafety}
            onChange={(e) =>
              onChange({ ...data, breastfeedingSafety: e.target.value })
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 bg-white"
          >
            <option value="" className="text-gray-500">
              Select safety level
            </option>
            <option value="Safe" className="text-gray-900">
              Safe
            </option>
            <option value="Caution" className="text-gray-900">
              Use with Caution
            </option>
            <option value="Avoid" className="text-gray-900">
              Avoid
            </option>
            <option value="Unknown" className="text-gray-900">
              Unknown
            </option>
          </select>
        </div>
      </div>
    </div>
  );
};

const AdditionalInformationSection: React.FC<any> = ({
  data,
  onChange,
  deviceType,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Storage Instructions
        </label>
        <div
          className={`${
            deviceType === "mobile" ? "max-h-40" : "max-h-60"
          } overflow-y-auto`}
        >
          <RichTextEditor
            value={data.storage}
            onChange={(value) => onChange({ ...data, storage: value })}
            placeholder="Describe storage conditions..."
            compact={deviceType === "mobile"}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          References
        </label>
        <div className="space-y-2">
          {data.references.map((ref: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={ref}
                onChange={(e) => {
                  const newRefs = [...data.references];
                  newRefs[index] = e.target.value;
                  onChange({ ...data, references: newRefs });
                }}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm text-gray-900 bg-white placeholder:text-gray-500"
                placeholder="e.g., FDA label, clinical study"
              />
              {data.references.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const newRefs = data.references.filter(
                      (_: string, i: number) => i !== index
                    );
                    onChange({ ...data, references: newRefs });
                  }}
                  className="px-3 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({ ...data, references: [...data.references, ""] })
            }
            className="w-full px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Reference
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          FDA Approval Status
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.regulatoryStatus.fdaApproved}
              onChange={(e) =>
                onChange({
                  ...data,
                  regulatoryStatus: {
                    ...data.regulatoryStatus,
                    fdaApproved: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">FDA Approved</span>
          </label>
        </div>
      </div>
    </div>
  );
};

// Mobile Success Message
const SuccessMessageMobile: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
        <CheckCircle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-green-900">Verification Submitted!</h3>
        <p className="text-sm text-green-700 mt-1">
          Your drug information has been submitted successfully.
        </p>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Mobile Error Message
const ErrorMessageMobile: React.FC<{
  message: string;
  onClose: () => void;
}> = ({ message, onClose }) => (
  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="bg-red-500 p-2 rounded-full flex-shrink-0">
        <AlertCircle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-red-900">Submission Failed</h3>
        <p className="text-sm text-red-700 mt-1">{message}</p>
      </div>
      <button onClick={onClose} className="text-red-600 hover:text-red-800">
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Desktop Success Message
const SuccessMessage: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-green-500 p-2 rounded-full">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-green-900">
            Drug Verification Submitted!
          </h3>
          <p className="text-sm text-green-700">
            Your drug information has been submitted successfully.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  </div>
);

// Desktop Error Message
const ErrorMessage: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-red-500 p-2 rounded-full">
          <XCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-red-900">Submission Failed</h3>
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
      <button onClick={onClose} className="text-red-600 hover:text-red-800">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  </div>
);

export default DrugInformationTab;
