"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Clipboard,
  Pill,
  Plus,
  Trash2,
  AlertCircle,
  QrCode,
  Search,
  UserCheck,
  Scan,
  Barcode,
} from "lucide-react";
import { Center, User as UserType } from "@/app/center/type";
import { Product } from "../../types/pharmacy";

// Theme Colors
const PRIMARY_COLOR = "#1E8E39";
const PRIMARY_DARK = "#16652A";
const PRIMARY_LIGHT = "#2BA84A";

interface NewPrescriptionModalProps {
  center: Center;
  user: UserType;
  patientPhone?: string;
  onClose: () => void;
  onSave: (data: any) => void;
  onLoadPrescriptions: () => void;
}

// Modal Wrapper Component
const ModalWrapper = ({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-2 md:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl"
      >
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

export const NewPrescriptionModal = ({
  center,
  user,
  patientPhone,
  onClose,
  onSave,
  onLoadPrescriptions,
}: NewPrescriptionModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDozaUser, setIsDozaUser] = useState(false);
  const [dozaUserInfo, setDozaUserInfo] = useState<any>(null);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    // Patient Information
    patientName: "",
    patientPhone: patientPhone || "",
    patientEmail: "",
    patientAge: "",
    patientGender: "",
    patientAddress: "",

    // Medical Information
    complaints: "",
    vitals: {
      bloodPressure: "",
      temperature: "",
      heartRate: "",
      respiratoryRate: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
      bmi: "",
    },
    diagnosis: "",

    // Prescription Details
    medications: [] as any[],
    advice: "",
    notes: "",

    // Timing
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    nextRefillDate: "",

    // Doza Features
    remindersEnabled: true,
  });

  // Load products for medication selection
  useEffect(() => {
    loadProducts();

    // Check if patient is Doza user
    if (patientPhone) {
      checkDozaUser(patientPhone);
      setFormData((prev) => ({ ...prev, patientPhone }));
    }
  }, [center.id, patientPhone]);

  const loadProducts = async () => {
    try {
      const response = await fetch(`/api/centers/${center.id}/inventory`, {
        headers: { "x-user-id": user.id },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProducts(result.data.products || []);
        }
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const checkDozaUser = async (phone: string) => {
    try {
      const response = await fetch(`/api/users/check?phone=${phone}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setIsDozaUser(true);
          setDozaUserInfo(result.data);
          setFormData((prev) => ({
            ...prev,
            patientName: result.data.name || "",
            patientEmail: result.data.email || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error checking Doza user:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("vitals.")) {
      const vitalField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        vitals: {
          ...prev.vitals,
          [vitalField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await fetch(
        `/api/centers/${center.id}/inventory?barcode=${encodeURIComponent(
          barcode
        )}`,
        {
          headers: {
            "x-user-id": user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          handleAddMedication(data.data);
        } else {
          const product = Array.isArray(products)
            ? products.find(
                (p) =>
                  p?.sku === barcode ||
                  p?.name?.toLowerCase().includes(barcode.toLowerCase())
              )
            : null;

          if (product) {
            handleAddMedication(product);
          } else {
            alert("Product not found!");
          }
        }
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
      alert("Error scanning barcode");
    } finally {
      setBarcodeInput("");
      setScanning(false);
    }
  };

  const handleAddMedication = (product: Product) => {
    if (!product || !product.id) {
      console.error("Invalid product:", product);
      alert("Invalid product data");
      return;
    }

    if (product.quantity <= 0) {
      alert("Product out of stock!");
      return;
    }

    // Check if medication already exists
    const existingIndex = formData.medications.findIndex(
      (med) => med.productId === product.id
    );

    if (existingIndex >= 0) {
      // Update quantity if enough stock
      const currentMed = formData.medications[existingIndex];
      const requestedQuantity = currentMed.quantity + 1;

      if (requestedQuantity > product.quantity) {
        alert(`Only ${product.quantity} units available in stock`);
        return;
      }

      const updatedMedications = [...formData.medications];
      updatedMedications[existingIndex] = {
        ...currentMed,
        quantity: requestedQuantity,
      };

      setFormData((prev) => ({
        ...prev,
        medications: updatedMedications,
      }));
    } else {
      // Add new medication
      const newMedication = {
        id: `med-${Date.now()}`,
        productId: product.id,
        sku: product.sku || `SKU-${product.id}`,
        name: product.name || "Unknown Product",
        genericName: product.genericName,
        category: product.category,
        dosage: "1 tablet",
        frequency: "Once daily",
        duration: "7 days",
        quantity: 1,
        unit: product.unit || "tablets",
        instructions: "Take as directed",
        route: "ORAL",
        stock: product.quantity || 0,
        batchNumber: product.batchNumber,
        expiryDate: product.expiryDate,
        sideEffects: [],
        contraindications: [],
        warnings: [],
        dispensed: false,
      };

      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, newMedication],
      }));
    }

    setShowProductSearch(false);
    setScanning(false);
  };

  const handleUpdateMedication = (index: number, field: string, value: any) => {
    const updatedMedications = [...formData.medications];
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      medications: updatedMedications,
    }));
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = formData.medications.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      medications: updatedMedications,
    }));
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.vitals.weight);
    const height = parseFloat(formData.vitals.height) / 100; // Convert cm to meters

    if (weight && height) {
      const bmi = (weight / (height * height)).toFixed(1);
      handleInputChange("vitals.bmi", bmi);
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.patientName ||
      !formData.patientPhone ||
      !formData.complaints
    ) {
      alert(
        "Please fill in required fields: Patient Name, Phone, and Complaints"
      );
      return;
    }

    if (formData.medications.length === 0) {
      alert("Please add at least one medication");
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving prescription:", error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered products for better performance
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    const searchTermLower = searchTerm.toLowerCase();

    return products
      .filter((product) => {
        if (!product || !product.isActive || (product.quantity || 0) <= 0)
          return false;

        if (!searchTerm.trim()) return true;

        return (
          product.name?.toLowerCase().includes(searchTermLower) ||
          product.sku?.toLowerCase().includes(searchTermLower) ||
          product.genericName?.toLowerCase().includes(searchTermLower) ||
          product.barcode?.includes(searchTerm)
        );
      })
      .slice(0, 50); // Limit results for better performance
  }, [products, searchTerm]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-2xl z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                New Prescription
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {isDozaUser ? "For Doza User" : "For New Patient"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === stepNum
                      ? "text-white bg-[#1E8E39]"
                      : step > stepNum
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNum ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {step === 1 && "Patient Information"}
            {step === 2 && "Medical Assessment"}
            {step === 3 && "Medications"}
            {step === 4 && "Review & Save"}
          </div>
        </div>

        {/* Barcode Scanner */}
        {scanning && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 mx-4 md:mx-6 mt-4 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5" />
                <span className="text-base font-medium">Scan Barcode</span>
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                Auto-focus active
              </span>
            </div>
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && barcodeInput.trim()) {
                  handleBarcodeScan(barcodeInput);
                }
              }}
              className="w-full px-4 py-3 text-gray-900 rounded-lg text-lg font-mono tracking-wider"
              placeholder="Scan barcode or enter manually..."
              autoFocus
            />
            <p className="text-sm mt-2 text-blue-100">
              Press Enter after scanning or type SKU/name
            </p>
          </div>
        )}

        <div className="p-4 md:p-6">
          {/* Step 1: Patient Information */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Doza User Status */}
              {isDozaUser && dozaUserInfo && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-medium text-indigo-900">
                        Doza User Detected
                      </h3>
                      <p className="text-sm text-indigo-700">
                        {dozaUserInfo.name} • Member since{" "}
                        {new Date(dozaUserInfo.createdAt).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Information Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) =>
                      handleInputChange("patientName", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) =>
                      handleInputChange("patientPhone", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                    placeholder="08012345678"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) =>
                      handleInputChange("patientEmail", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                    placeholder="patient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) =>
                      handleInputChange("patientAge", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                    placeholder="Age in years"
                    min="0"
                    max="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.patientGender}
                    onChange={(e) =>
                      handleInputChange("patientGender", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.patientAddress}
                    onChange={(e) =>
                      handleInputChange("patientAddress", e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                    placeholder="Patient's address"
                  />
                </div>
              </div>

              {/* Doza Reminders Toggle */}
              {isDozaUser && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Enable Medication Reminders
                    </h4>
                    <p className="text-sm text-gray-600">
                      Send automatic reminders to patient's Doza app
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.remindersEnabled}
                      onChange={(e) =>
                        handleInputChange("remindersEnabled", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E8E39]"></div>
                  </label>
                </div>
              )}

              {/* Non-Doza User QR Code Info */}
              {!isDozaUser && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <QrCode className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">
                        Invite to Doza
                      </h4>
                      <p className="text-sm text-amber-700 mt-1">
                        After creating prescription, you can print a slip with
                        QR code. Patient can scan to download Doza app and get
                        medication reminders.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Medical Assessment */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Complaints */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clipboard className="w-5 h-5 text-gray-500" />
                  <h3 className="font-medium text-gray-900">
                    Patient Complaints *
                  </h3>
                </div>
                <textarea
                  value={formData.complaints}
                  onChange={(e) =>
                    handleInputChange("complaints", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                  placeholder="Describe the patient's complaints and symptoms..."
                  required
                />
              </div>

              {/* Vitals */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Vital Signs</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.bloodPressure}
                      onChange={(e) =>
                        handleInputChange(
                          "vitals.bloodPressure",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="120/80"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.temperature}
                      onChange={(e) =>
                        handleInputChange("vitals.temperature", e.target.value)
                      }
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="36.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.heartRate}
                      onChange={(e) =>
                        handleInputChange("vitals.heartRate", e.target.value)
                      }
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="72"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      O2 Saturation (%)
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.oxygenSaturation}
                      onChange={(e) =>
                        handleInputChange(
                          "vitals.oxygenSaturation",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="98"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.weight}
                      onChange={(e) =>
                        handleInputChange("vitals.weight", e.target.value)
                      }
                      onBlur={calculateBMI}
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="70"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.height}
                      onChange={(e) =>
                        handleInputChange("vitals.height", e.target.value)
                      }
                      onBlur={calculateBMI}
                      className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="175"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      BMI
                    </label>
                    <input
                      type="text"
                      value={formData.vitals.bmi}
                      readOnly
                      className="w-full px-3 py-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provisional Diagnosis
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) =>
                    handleInputChange("diagnosis", e.target.value)
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                  placeholder="Enter provisional diagnosis if known..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Medications - Updated with PharmacySalesPanel style */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Scan & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search medications by name, generic name, or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                  />
                </div>
                <button
                  onClick={() => setScanning(!scanning)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    scanning
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {scanning ? (
                    <>
                      <X className="w-4 h-4" />
                      <span className="text-sm font-medium">Stop Scan</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span className="text-sm font-medium">Scan Barcode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Current Medications List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">
                    Medications Prescribed ({formData.medications.length})
                  </h3>
                  {formData.medications.length > 0 && (
                    <button
                      onClick={() => setShowProductSearch(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#1E8E39] text-white rounded-lg hover:bg-[#16652A] transition-colors text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add More
                    </button>
                  )}
                </div>

                {formData.medications.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No medications added yet</p>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      Search medications above or scan barcode
                    </p>
                    <button
                      onClick={() => setShowProductSearch(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#1E8E39] to-[#2BA84A] text-white rounded-lg hover:from-[#16652A] hover:to-[#1E8E39] transition-colors"
                    >
                      Browse All Medications
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.medications.map((med, index) => (
                      <div
                        key={med.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {med.name}
                            </h4>
                            {med.genericName && (
                              <p className="text-sm text-gray-600">
                                {med.genericName}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                {med.category || "Medication"}
                              </span>
                              <span className="text-xs text-gray-500">
                                Stock: {med.stock || 0} {med.unit}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) =>
                                handleUpdateMedication(
                                  index,
                                  "dosage",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                              placeholder="e.g., 500mg"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Frequency
                            </label>
                            <select
                              value={med.frequency}
                              onChange={(e) =>
                                handleUpdateMedication(
                                  index,
                                  "frequency",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                            >
                              <option>Once daily</option>
                              <option>Twice daily</option>
                              <option>Three times daily</option>
                              <option>Four times daily</option>
                              <option>Every 6 hours</option>
                              <option>Every 8 hours</option>
                              <option>As needed</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) =>
                                handleUpdateMedication(
                                  index,
                                  "duration",
                                  e.target.value
                                )
                              }
                              className="w-full px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                              placeholder="e.g., 7 days"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Quantity
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleUpdateMedication(
                                    index,
                                    "quantity",
                                    Math.max(1, med.quantity - 1)
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                <span className="text-gray-600 text-sm">-</span>
                              </button>
                              <input
                                type="number"
                                value={med.quantity}
                                onChange={(e) =>
                                  handleUpdateMedication(
                                    index,
                                    "quantity",
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  )
                                }
                                className="w-12 text-center px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                                min="1"
                                max={med.stock || 100}
                              />
                              <button
                                onClick={() =>
                                  handleUpdateMedication(
                                    index,
                                    "quantity",
                                    med.quantity + 1
                                  )
                                }
                                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200"
                              >
                                <span className="text-gray-600 text-sm">+</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-1">
                            Instructions
                          </label>
                          <textarea
                            value={med.instructions}
                            onChange={(e) =>
                              handleUpdateMedication(
                                index,
                                "instructions",
                                e.target.value
                              )
                            }
                            rows={2}
                            className="w-full px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                            placeholder="Special instructions for patient..."
                          />
                        </div>

                        {med.expiryDate && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Expiry:{" "}
                              {new Date(med.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {formData.medications.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowProductSearch(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#1E8E39] hover:text-[#1E8E39] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Add More Medications
                    </span>
                  </button>
                </div>
              )}

              {/* Safety Information */}
              {formData.medications.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">
                        Important Safety Information
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Please inform patient about potential side effects,
                        contraindications, and warnings for all prescribed
                        medications.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review & Save */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Patient Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Patient Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {formData.patientName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">
                      {formData.patientPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Doza User</p>
                    <p className="font-medium text-gray-900">
                      {isDozaUser ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reminders</p>
                    <p className="font-medium text-gray-900">
                      {isDozaUser && formData.remindersEnabled
                        ? "Enabled"
                        : "Not applicable"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Medical Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Medical Summary
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Complaints</p>
                    <p className="text-gray-900">{formData.complaints}</p>
                  </div>

                  {Object.values(formData.vitals).some((v) => v) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Vital Signs</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.vitals.bloodPressure && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            BP: {formData.vitals.bloodPressure}
                          </span>
                        )}
                        {formData.vitals.temperature && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            Temp: {formData.vitals.temperature}°C
                          </span>
                        )}
                        {formData.vitals.heartRate && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            HR: {formData.vitals.heartRate} bpm
                          </span>
                        )}
                        {formData.vitals.bmi && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            BMI: {formData.vitals.bmi}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Medications ({formData.medications.length})
                </h3>
                <div className="space-y-2">
                  {formData.medications.map((med, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">
                          {med.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-xs text-gray-500 mt-1">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          Qty: {med.quantity} {med.unit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Advice & Notes
                </label>
                <textarea
                  value={formData.advice}
                  onChange={(e) => handleInputChange("advice", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                  placeholder="Enter advice for the patient..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 shadow-lg">
          <div className="flex justify-between">
            <button
              onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
              className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <div className="flex gap-3">
              {step < 4 && (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#1E8E39] to-[#2BA84A] text-white rounded-lg hover:from-[#16652A] hover:to-[#1E8E39] font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  Next Step
                </button>
              )}

              {step === 4 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#1E8E39] to-[#2BA84A] text-white rounded-lg hover:from-[#16652A] hover:to-[#1E8E39] disabled:opacity-50 font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  {loading ? "Saving..." : "Save Prescription"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Search Modal - PharmacySalesPanel style */}
      <AnimatePresence>
        {showProductSearch && (
          <ModalWrapper onClose={() => setShowProductSearch(false)}>
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      Search Medications
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredProducts.length} products available
                    </p>
                  </div>
                  <button
                    onClick={() => setShowProductSearch(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E8E39] focus:border-[#1E8E39]"
                      placeholder="Search by name, SKU, barcode..."
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={() => setScanning(!scanning)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      scanning
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {scanning ? (
                      <>
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Stop Scan</span>
                      </>
                    ) : (
                      <>
                        <Scan className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Scan Barcode
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No products found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try searching by different terms
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product?.id}
                        className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-[#1E8E39] hover:shadow-md transition-all duration-200"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 mr-2">
                              <h3 className="font-bold text-gray-900 line-clamp-1 text-sm sm:text-base">
                                {product?.name || "Unknown Product"}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {product?.genericName ||
                                  product?.category ||
                                  "Generic"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddMedication(product)}
                              disabled={
                                !product || (product?.quantity || 0) <= 0
                              }
                              className={`p-2 rounded-full ${
                                !product || (product?.quantity || 0) <= 0
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-[#1E8E39] text-white hover:bg-[#16652A]"
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">SKU:</span>
                              <span className="font-mono text-gray-900">
                                {product?.sku || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Stock:</span>
                              <span
                                className={`font-semibold ${
                                  (product?.quantity || 0) > 10
                                    ? "text-emerald-600"
                                    : (product?.quantity || 0) > 0
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                              >
                                {product?.quantity || 0}{" "}
                                {product?.unit || "units"}
                              </span>
                            </div>
                            {product?.expiryDate && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Expiry:</span>
                                <span
                                  className={`font-medium ${
                                    new Date(product.expiryDate) > new Date()
                                      ? "text-gray-900"
                                      : "text-red-600"
                                  }`}
                                >
                                  {new Date(
                                    product.expiryDate
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                            {product?.batchNumber && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Batch:</span>
                                <span className="font-mono text-gray-900">
                                  {product.batchNumber}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAddMedication(product)}
                            disabled={!product || (product?.quantity || 0) <= 0}
                            className={`w-full mt-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                              !product || (product?.quantity || 0) <= 0
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#1E8E39] to-[#2BA84A] text-white hover:from-[#16652A] hover:to-[#1E8E39]"
                            }`}
                          >
                            {!product || (product?.quantity || 0) <= 0
                              ? "Out of Stock"
                              : "Add to Prescription"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </ModalWrapper>
  );
};
