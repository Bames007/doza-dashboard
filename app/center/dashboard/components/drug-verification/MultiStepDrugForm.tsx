// app/components/drug-verification/MultiStepDrugForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Database,
  Shield,
  CheckSquare,
  FileText,
  Users,
  Plus,
  Award,
  Loader2,
  Smartphone,
  Tablet,
  Monitor,
  Mic,
  Thermometer,
  Building,
  Pill,
  Brain,
  Heart,
  AlertTriangle,
  Droplets,
  Clock,
  Baby,
  User,
  Calendar,
  Link,
  Minus,
  BarChart,
  Clipboard,
  Hash,
  Scan,
} from "lucide-react";
import RichTextEditor from "./RichTextEditor";

interface MultiStepDrugFormProps {
  user: any;
  center: any;
  onVerificationComplete: () => void;
  medicData?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
}

const MultiStepDrugForm: React.FC<MultiStepDrugFormProps> = ({
  user,
  center,
  onVerificationComplete,
  medicData,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );
  const [useSpeech, setUseSpeech] = useState(false);
  const [speechField, setSpeechField] = useState<string | null>(null);

  // Complete drug data state
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
      title: "Basic Information",
      icon: Package,
      description: "Drug name, strength, and manufacturer details",
      required: true,
    },
    {
      id: "classification",
      title: "Classification",
      icon: Database,
      description: "Drug class and categorization",
      required: true,
    },
    {
      id: "medical",
      title: "Medical Information",
      icon: Shield,
      description: "Mechanism, indications, and side effects",
      required: true,
    },
    {
      id: "dosage",
      title: "Dosage & Administration",
      icon: CheckSquare,
      description: "Dosage instructions and administration",
      required: true,
    },
    {
      id: "review",
      title: "Review & Submit",
      icon: CheckCircle,
      description: "Review all information before submission",
      required: false,
    },
  ];

  // Detect device type for responsive design
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      if (
        !drugData.genericName ||
        !drugData.strength ||
        !drugData.dosageForm ||
        !drugData.manufacturer
      ) {
        setError("Please fill in all required basic information fields");
        return;
      }
    } else if (currentStep === 1) {
      if (drugData.drugClass[0] === "" || !drugData.atcCode) {
        setError("Please fill in drug classification information");
        return;
      }
    } else if (currentStep === 2) {
      if (
        !drugData.mechanismOfAction ||
        drugData.indications[0] === "" ||
        drugData.sideEffects[0] === ""
      ) {
        setError("Please fill in required medical information");
        return;
      }
    } else if (currentStep === 3) {
      if (!drugData.dosage || !drugData.administration) {
        setError("Please provide dosage and administration information");
        return;
      }
    }

    setError(null);
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
      // Check if user is a verified medic
      const medicCheckResponse = await fetch(
        `/api/medics/check?email=${encodeURIComponent(user.email)}`
      );
      const medicCheckData = await medicCheckResponse.json();

      if (!medicCheckData.isRegistered || !medicCheckData.isMedic) {
        throw new Error(
          "You must be a verified Doza Medic to submit drug information"
        );
      }

      // Final validation
      if (
        !drugData.genericName ||
        !drugData.strength ||
        !drugData.dosageForm ||
        !drugData.manufacturer ||
        drugData.drugClass[0] === "" ||
        !drugData.mechanismOfAction ||
        drugData.indications[0] === "" ||
        !drugData.dosage
      ) {
        throw new Error("Please fill in all required fields before submission");
      }

      // Submit to API
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

      // Reset after successful submission
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
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
            useSpeech={useSpeech}
            speechField={speechField}
            onSpeechFieldChange={setSpeechField}
          />
        );
      case 1:
        return (
          <ClassificationStep
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
            useSpeech={useSpeech}
            speechField={speechField}
            onSpeechFieldChange={setSpeechField}
          />
        );
      case 2:
        return (
          <MedicalInfoStep
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 3:
        return (
          <DosageStep
            data={drugData}
            onChange={setDrugData}
            deviceType={deviceType}
          />
        );
      case 4:
        return (
          <ReviewStep
            data={drugData}
            medicData={medicData}
            center={center}
            user={user}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6">
      {/* Device Indicator - Helpful for debugging responsiveness */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {deviceType === "mobile" && <Smartphone className="w-4 h-4" />}
          {deviceType === "tablet" && <Tablet className="w-4 h-4" />}
          {deviceType === "desktop" && <Monitor className="w-4 h-4" />}
          <span className="capitalize">{deviceType} view</span>
        </div>

        {/* Voice Input Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseSpeech(!useSpeech)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              useSpeech
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-700 border border-gray-300"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{useSpeech ? "Voice On" : "Voice Off"}</span>
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div
        className={`mb-8 ${deviceType === "mobile" ? "overflow-x-auto" : ""}`}
      >
        <div
          className={`flex ${
            deviceType === "mobile"
              ? "space-x-4 pb-4 min-w-max"
              : "justify-between"
          }`}
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                deviceType === "mobile" ? "flex-shrink-0" : "flex-1"
              }`}
            >
              <button
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  currentStep >= index
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200"
                } ${deviceType === "mobile" ? "min-w-[160px]" : ""}`}
              >
                <div
                  className={`p-2 rounded-full ${
                    currentStep > index
                      ? "bg-green-500 text-white"
                      : currentStep === index
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > index ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">{step.title}</div>
                  {deviceType !== "mobile" && (
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  )}
                </div>
              </button>
              {index < steps.length - 1 && deviceType !== "mobile" && (
                <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <SuccessMessage onClose={() => setSuccess(false)} />
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <ErrorMessage message={error} onClose={() => setError(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Input Panel */}
      {speechField && useSpeech && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
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
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mt-2">
              {steps[currentStep].description}
            </p>
          </div>

          <div
            className={`${
              deviceType === "mobile" ? "space-y-6" : ""
            } min-h-[400px]`}
          >
            {getStepContent()}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>
                  Verified by{" "}
                  <strong>{medicData?.name || user.fullName}</strong>
                  {center && ` from ${center.name}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Submit Verification
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Basic Information
const BasicInfoStep: React.FC<any> = ({
  data,
  onChange,
  deviceType,
  useSpeech,
  speechField,
  onSpeechFieldChange,
}) => {
  const gridClasses =
    deviceType === "mobile"
      ? "grid grid-cols-1 gap-4"
      : "grid grid-cols-1 md:grid-cols-2 gap-4";

  return (
    <div className={gridClasses}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Pill className="w-4 h-4" />
          Generic Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.genericName}
            onChange={(e) => onChange({ ...data, genericName: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., Amoxicillin"
          />
          {useSpeech && (
            <button
              onClick={() =>
                onSpeechFieldChange(
                  speechField === "genericName" ? null : "genericName"
                )
              }
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                speechField === "genericName"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          Strength <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.strength}
            onChange={(e) => onChange({ ...data, strength: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., 500mg"
          />
          {useSpeech && (
            <button
              onClick={() =>
                onSpeechFieldChange(
                  speechField === "strength" ? null : "strength"
                )
              }
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                speechField === "strength"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Dosage Form <span className="text-red-500">*</span>
        </label>
        <select
          value={data.dosageForm}
          onChange={(e) => onChange({ ...data, dosageForm: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
        >
          <option value="">Select dosage form</option>
          <option value="Tablet">Tablet</option>
          <option value="Capsule">Capsule</option>
          <option value="Syrup">Syrup</option>
          <option value="Injection">Injection</option>
          <option value="Ointment">Ointment</option>
          <option value="Cream">Cream</option>
          <option value="Suspension">Suspension</option>
          <option value="Inhaler">Inhaler</option>
          <option value="Drops">Drops</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Building className="w-4 h-4" />
          Manufacturer <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.manufacturer}
            onChange={(e) =>
              onChange({ ...data, manufacturer: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
            placeholder="e.g., Pfizer Inc."
          />
          {useSpeech && (
            <button
              onClick={() =>
                onSpeechFieldChange(
                  speechField === "manufacturer" ? null : "manufacturer"
                )
              }
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                speechField === "manufacturer"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" />
          NAFDAC Number
        </label>
        <input
          type="text"
          value={data.nafdacNumber}
          onChange={(e) => onChange({ ...data, nafdacNumber: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
          placeholder="e.g., 04-3548"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Scan className="w-4 h-4" />
          Barcode
        </label>
        <input
          type="text"
          value={data.barcode}
          onChange={(e) => onChange({ ...data, barcode: e.target.value })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
          placeholder="e.g., 123456789012"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Clipboard className="w-4 h-4" />
          Brand Names
        </label>
        <div className="space-y-2">
          {data.brandNames.map((brand: string, index: number) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={brand}
                onChange={(e) => {
                  const newBrands = [...data.brandNames];
                  newBrands[index] = e.target.value;
                  onChange({ ...data, brandNames: newBrands });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Amoxil"
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
              onChange({ ...data, brandNames: [...data.brandNames, ""] })
            }
            className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Brand Name
          </button>
        </div>
      </div>
    </div>
  );
};

// Step 2: Classification
const ClassificationStep: React.FC<any> = ({
  data,
  onChange,
  deviceType,
  useSpeech,
  speechField,
  onSpeechFieldChange,
}) => {
  const gridClasses =
    deviceType === "mobile"
      ? "space-y-6"
      : "grid grid-cols-1 md:grid-cols-2 gap-6";

  return (
    <div className={gridClasses}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Beta-lactam antibiotic"
                />
                {useSpeech && index === 0 && (
                  <button
                    onClick={() =>
                      onSpeechFieldChange(
                        speechField === "drugClass" ? null : "drugClass"
                      )
                    }
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                      speechField === "drugClass"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Mic className="w-4 h-4" />
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
            className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Drug Class
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          ATC Code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.atcCode}
            onChange={(e) => onChange({ ...data, atcCode: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., J01CA04"
          />
          {useSpeech && (
            <button
              onClick={() =>
                onSpeechFieldChange(
                  speechField === "atcCode" ? null : "atcCode"
                )
              }
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full ${
                speechField === "atcCode"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Anatomical Therapeutic Chemical (ATC) classification code
        </p>
      </div>

      <div className="md:col-span-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-blue-900">Classification Tips</h4>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use standard pharmacological classification terms</li>
            <li>• Include both therapeutic and chemical classes</li>
            <li>• ATC codes can be found on WHO ATC classification website</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Step 3: Medical Information
const MedicalInfoStep: React.FC<any> = ({ data, onChange, deviceType }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          Mechanism of Action <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={data.mechanismOfAction}
          onChange={(value) => onChange({ ...data, mechanismOfAction: value })}
          placeholder="Describe how the drug works at the molecular/cellular level..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4" />
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
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Indication
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
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
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Nausea, diarrhea, headache"
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
            className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Side Effect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Contraindications
          </label>
          <div className="space-y-2">
            {data.contraindications.map((contra: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={contra}
                  onChange={(e) => {
                    const newContras = [...data.contraindications];
                    newContras[index] = e.target.value;
                    onChange({ ...data, contraindications: newContras });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Hypersensitivity"
                />
                {data.contraindications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newContras = data.contraindications.filter(
                        (_: string, i: number) => i !== index
                      );
                      onChange({ ...data, contraindications: newContras });
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
                onChange({
                  ...data,
                  contraindications: [...data.contraindications, ""],
                })
              }
              className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Contraindication
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Warnings & Precautions
          </label>
          <div className="space-y-2">
            {data.warnings.map((warning: string, index: number) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={warning}
                  onChange={(e) => {
                    const newWarnings = [...data.warnings];
                    newWarnings[index] = e.target.value;
                    onChange({ ...data, warnings: newWarnings });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Renal impairment"
                />
                {data.warnings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newWarnings = data.warnings.filter(
                        (_: string, i: number) => i !== index
                      );
                      onChange({ ...data, warnings: newWarnings });
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
                onChange({ ...data, warnings: [...data.warnings, ""] })
              }
              className="mt-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Warning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 4: Dosage & Administration
const DosageStep: React.FC<any> = ({ data, onChange, deviceType }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Droplets className="w-4 h-4" />
          Dosage Instructions <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={data.dosage}
          onChange={(value) => onChange({ ...data, dosage: value })}
          placeholder="Provide detailed dosage instructions...
Example: 
• Adult: 500mg every 8 hours
• Pediatric: 25-50mg/kg/day divided every 8 hours
• Duration: 7-14 days depending on severity"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Administration <span className="text-red-500">*</span>
        </label>
        <RichTextEditor
          value={data.administration}
          onChange={(value) => onChange({ ...data, administration: value })}
          placeholder="Describe how to administer the drug...
Example:
• Take with or without food
• Shake suspension well before use
• Do not crush extended-release tablets"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route of Administration
          </label>
          <select
            value={data.route}
            onChange={(e) => onChange({ ...data, route: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select route</option>
            <option value="Oral">Oral</option>
            <option value="Intravenous">Intravenous</option>
            <option value="Intramuscular">Intramuscular</option>
            <option value="Subcutaneous">Subcutaneous</option>
            <option value="Topical">Topical</option>
            <option value="Inhalation">Inhalation</option>
            <option value="Rectal">Rectal</option>
            <option value="Ophthalmic">Ophthalmic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency
          </label>
          <select
            value={data.frequency}
            onChange={(e) => onChange({ ...data, frequency: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select frequency</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Four times daily">Four times daily</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Every 12 hours">Every 12 hours</option>
            <option value="As needed">As needed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pregnancy Category
          </label>
          <select
            value={data.pregnancyCategory}
            onChange={(e) =>
              onChange({ ...data, pregnancyCategory: e.target.value })
            }
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select category</option>
            <option value="A">Category A</option>
            <option value="B">Category B</option>
            <option value="C">Category C</option>
            <option value="D">Category D</option>
            <option value="X">Category X</option>
            <option value="N">Not classified</option>
          </select>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h4 className="font-medium text-amber-900">Important Note</h4>
        </div>
        <p className="text-sm text-amber-700">
          Dosage information should be based on official prescribing information
          and local guidelines. Always include specific instructions for
          different populations (adults, children, elderly) when applicable.
        </p>
      </div>
    </div>
  );
};

// Step 5: Review
const ReviewStep: React.FC<any> = ({ data, medicData, center, user }) => {
  const sections = [
    {
      title: "Basic Information",
      fields: [
        { label: "Generic Name", value: data.genericName },
        { label: "Brand Names", value: data.brandNames.join(", ") },
        { label: "Strength", value: data.strength },
        { label: "Dosage Form", value: data.dosageForm },
        { label: "Manufacturer", value: data.manufacturer },
        { label: "NAFDAC Number", value: data.nafdacNumber || "Not provided" },
        { label: "Barcode", value: data.barcode || "Not provided" },
      ],
    },
    {
      title: "Classification",
      fields: [
        { label: "Drug Class", value: data.drugClass.join(", ") },
        { label: "ATC Code", value: data.atcCode },
      ],
    },
    {
      title: "Medical Information",
      fields: [
        {
          label: "Mechanism of Action",
          value: data.mechanismOfAction,
          type: "html",
        },
        { label: "Indications", value: data.indications.join(", ") },
        {
          label: "Contraindications",
          value: data.contraindications.join(", ") || "None specified",
        },
        { label: "Side Effects", value: data.sideEffects.join(", ") },
        { label: "Warnings", value: data.warnings.join(", ") || "None" },
      ],
    },
    {
      title: "Dosage & Administration",
      fields: [
        { label: "Dosage", value: data.dosage, type: "html" },
        { label: "Administration", value: data.administration, type: "html" },
        { label: "Route", value: data.route || "Not specified" },
        { label: "Frequency", value: data.frequency || "Not specified" },
        {
          label: "Pregnancy Category",
          value: data.pregnancyCategory || "Not specified",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Verification Details Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">
              Verification Details
            </h3>
            <p className="text-sm text-blue-700">
              This information will be submitted with your verification
            </p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            Ready to Submit
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Verified by</div>
            <div className="font-medium text-blue-900">
              {medicData?.name || user.fullName}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Institution</div>
            <div className="font-medium text-blue-900">{center.name}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Submission Date</div>
            <div className="font-medium text-blue-900">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Review Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="grid grid-cols-3 gap-4">
                    <div className="text-sm font-medium text-gray-700">
                      {field.label}
                    </div>
                    <div className="col-span-2">
                      {field.type === "html" ? (
                        <div
                          className="text-sm text-gray-600 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: field.value || "Not provided",
                          }}
                        />
                      ) : (
                        <div className="text-sm text-gray-600">
                          {field.value || "Not provided"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submission Warning */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900 mb-2">
              Before You Submit
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• All information must be accurate and verifiable</li>
              <li>
                • You will earn verification points upon successful submission
              </li>
              <li>• Submitted information cannot be edited after submission</li>
              <li>
                • Ensure you have the authority to submit this information
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success and Error message components
const SuccessMessage: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-green-500 p-2 rounded-full">
          <CheckCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-green-900">
            Verification Submitted Successfully!
          </h3>
          <p className="text-sm text-green-700">
            Your drug information has been submitted and points will be awarded
            after review.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <XCircle className="w-5 h-5" />
      </button>
    </div>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onClose: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-red-500 p-2 rounded-full">
          <AlertCircle className="w-5 h-5 text-white" />
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

export default MultiStepDrugForm;
