// app/center/dashboard/panels/FacilityServicesPanel.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Stethoscope,
  Plus,
  Edit3,
  Trash2,
  Clock,
  MapPin,
  Bed,
  X,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  FlaskConical,
  TestTube,
  Droplets,
  Microscope,
} from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import logger from "@/app/utils/logger";
import {
  Facility,
  Service,
  OperatingHours,
  Center,
  User,
} from "@/app/center/type";

// ─── Types ────────────────────────────────────────────────────────────

interface Test {
  id: string;
  name: string;
  category: string;
  price: number;
  duration?: number;
  description?: string;
  notes?: string;
  sampleType?: string;
  preparationInstructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface FacilityServicesPanelProps {
  center: Center;
  user: User;
  onUpdate: (updatedCenter: Center) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────

const formatNaira = (amount: number) => {
  return `₦${amount.toLocaleString("en-NG")}`;
};

// ─── Skeleton Loaders ──────────────────────────────────────────────

const FacilityCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 w-32 bg-slate-200 rounded-lg" />
        <div className="h-4 w-24 bg-slate-100 rounded mt-1" />
      </div>
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
    </div>
    <div className="h-2 w-full bg-slate-200 rounded-full" />
    <div className="h-3 w-3/4 bg-slate-100 rounded mt-2" />
    <div className="flex gap-1 mt-3">
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
    </div>
  </div>
);

const ServiceCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 w-28 bg-slate-200 rounded-lg" />
        <div className="h-4 w-20 bg-slate-100 rounded mt-1" />
      </div>
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded" />
    <div className="h-3 w-2/3 bg-slate-100 rounded mt-1" />
  </div>
);

const TestCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 animate-pulse shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 w-28 bg-slate-200 rounded-lg" />
        <div className="h-4 w-20 bg-slate-100 rounded mt-1" />
      </div>
      <div className="flex space-x-1">
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
      </div>
    </div>
    <div className="h-3 w-full bg-slate-100 rounded" />
    <div className="h-3 w-2/3 bg-slate-100 rounded mt-1" />
  </div>
);

// ─── Main Component ──────────────────────────────────────────────

export default function FacilityServicesPanel({
  center,
  user,
  onUpdate,
}: FacilityServicesPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "facilities" | "services" | "tests" | "hours"
  >("facilities");
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    opening: "08:00",
    closing: "18:00",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    timezone: "WAT",
  });

  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Facility form state
  const [facilityForm, setFacilityForm] = useState({
    name: "",
    type: "",
    customType: "",
    capacity: 1,
    available: 1,
    costPerDay: 0,
    description: "",
    features: [""],
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    customCategory: "",
    price: 0,
    duration: 30,
    description: "",
    notes: "",
  });

  // Test form state
  const [testForm, setTestForm] = useState({
    name: "",
    category: "",
    customCategory: "",
    price: 0,
    duration: 30,
    description: "",
    notes: "",
    sampleType: "",
    preparationInstructions: "",
  });

  // Sample types for tests
  const sampleTypes = [
    "Blood",
    "Urine",
    "Stool",
    "Tissue",
    "Saliva",
    "CSF",
    "Other",
  ];

  // Test categories
  const testCategories = [
    "Laboratory",
    "Imaging",
    "Cardiology",
    "Neurology",
    "Pathology",
    "Microbiology",
    "Immunology",
    "Genetics",
    "Other",
  ];

  // Load initial data
  useEffect(() => {
    if (center?.id) {
      Promise.all([loadFacilities(), loadServices(), loadTests()]).finally(() =>
        setIsInitialLoading(false),
      );
      loadOperatingHours();
    }
  }, [center]);

  const getCenterName = () => center.centerName || "Unknown Center";

  // ─── Load Functions ──────────────────────────────────────────────

  const loadFacilities = async () => {
    try {
      const response = await fetch(`/api/centers/${center.id}/facilities`, {
        headers: { "x-user-id": user.id },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success && result.data) {
        setFacilities(result.data);
      } else {
        setFacilities([]);
      }
    } catch (error: any) {
      logger.error("Error loading facilities", error);
      setFacilities([]);
      setError(`Failed to load facilities: ${error.message}`);
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch(`/api/centers/${center.id}/services`, {
        headers: { "x-user-id": user.id },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success && result.data) {
        setServices(result.data);
      } else {
        setServices([]);
      }
    } catch (error: any) {
      logger.error("Error loading services", error);
      setServices([]);
    }
  };

  const loadTests = async () => {
    try {
      const response = await fetch(`/api/centers/${center.id}/tests`, {
        headers: { "x-user-id": user.id },
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success && result.data) {
        setTests(result.data);
      } else {
        setTests([]);
      }
    } catch (error: any) {
      logger.error("Error loading tests", error);
      setTests([]);
    }
  };

  const loadOperatingHours = () => {
    if (center?.operatingHours) {
      setOperatingHours(center.operatingHours);
    } else {
      setOperatingHours({
        opening: "08:00",
        closing: "18:00",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        timezone: "WAT",
      });
    }
  };

  // ─── Save Handlers ───────────────────────────────────────────────

  const handleSaveFacility = async () => {
    setLoading(true);
    setSaveStatus("saving");
    setError("");

    try {
      const facilityType = facilityForm.customType.trim() || facilityForm.type;
      if (!facilityType) throw new Error("Facility type is required");

      const facilityData = {
        name: facilityForm.name,
        type: facilityType,
        capacity: facilityForm.capacity,
        available: facilityForm.available,
        costPerDay: facilityForm.costPerDay,
        description: facilityForm.description,
        features: facilityForm.features.filter((f) => f.trim() !== ""),
      };

      const url = editingFacility
        ? `/api/centers/${center.id}/facilities/${editingFacility.id}`
        : `/api/centers/${center.id}/facilities`;

      const response = await fetch(url, {
        method: editingFacility ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(facilityData),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save facility");

      await loadFacilities();
      setSaveStatus("success");
      setShowFacilityForm(false);
      setEditingFacility(null);
      resetFacilityForm();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      logger.error("Error saving facility", error);
      setError(error.message);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async () => {
    setLoading(true);
    setSaveStatus("saving");
    setError("");

    try {
      const serviceCategory =
        serviceForm.customCategory.trim() || serviceForm.category;
      if (!serviceCategory) throw new Error("Service category is required");

      const serviceData = {
        name: serviceForm.name,
        category: serviceCategory,
        price: serviceForm.price,
        duration: serviceForm.duration,
        description: serviceForm.description,
        notes: serviceForm.notes,
      };

      const url = editingService
        ? `/api/centers/${center.id}/services/${editingService.id}`
        : `/api/centers/${center.id}/services`;

      const response = await fetch(url, {
        method: editingService ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save service");

      await loadServices();
      setSaveStatus("success");
      setShowServiceForm(false);
      setEditingService(null);
      resetServiceForm();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      logger.error("Error saving service", error);
      setError(error.message);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTest = async () => {
    setLoading(true);
    setSaveStatus("saving");
    setError("");

    try {
      const testCategory = testForm.customCategory.trim() || testForm.category;
      if (!testCategory) throw new Error("Test category is required");

      const testData = {
        name: testForm.name,
        category: testCategory,
        price: testForm.price,
        duration: testForm.duration,
        description: testForm.description,
        notes: testForm.notes,
        sampleType: testForm.sampleType,
        preparationInstructions: testForm.preparationInstructions,
      };

      const url = editingTest
        ? `/api/centers/${center.id}/tests/${editingTest.id}`
        : `/api/centers/${center.id}/tests`;

      const response = await fetch(url, {
        method: editingTest ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(testData),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save test");

      await loadTests();
      setSaveStatus("success");
      setShowTestForm(false);
      setEditingTest(null);
      resetTestForm();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      logger.error("Error saving test", error);
      setError(error.message);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOperatingHours = async () => {
    setLoading(true);
    setSaveStatus("saving");
    setError("");

    try {
      const response = await fetch(
        `/api/centers/${center.id}/operating-hours`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify(operatingHours),
        },
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to save operating hours");

      onUpdate({ ...center, operatingHours });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error: any) {
      logger.error("Error saving operating hours", error);
      setError(error.message);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete Handlers ─────────────────────────────────────────────

  const handleDeleteFacility = async (facilityId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this facility? This action cannot be undone.",
      )
    )
      return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/centers/${center.id}/facilities/${facilityId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id },
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await loadFacilities();
    } catch (error: any) {
      logger.error("Error deleting facility", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone.",
      )
    )
      return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/centers/${center.id}/services/${serviceId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id },
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await loadServices();
    } catch (error: any) {
      logger.error("Error deleting service", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This action cannot be undone.",
      )
    )
      return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/centers/${center.id}/tests/${testId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id },
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      await loadTests();
    } catch (error: any) {
      logger.error("Error deleting test", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset Forms ─────────────────────────────────────────────────

  const resetFacilityForm = () => {
    setFacilityForm({
      name: "",
      type: "",
      customType: "",
      capacity: 1,
      available: 1,
      costPerDay: 0,
      description: "",
      features: [""],
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      category: "",
      customCategory: "",
      price: 0,
      duration: 30,
      description: "",
      notes: "",
    });
  };

  const resetTestForm = () => {
    setTestForm({
      name: "",
      category: "",
      customCategory: "",
      price: 0,
      duration: 30,
      description: "",
      notes: "",
      sampleType: "",
      preparationInstructions: "",
    });
  };

  // ─── Edit Handlers ───────────────────────────────────────────────

  const editFacility = (facility: Facility) => {
    setFacilityForm({
      name: facility.name,
      type: facility.type,
      customType: "",
      capacity: facility.capacity,
      available: facility.available,
      costPerDay: facility.costPerDay,
      description: facility.description || "",
      features: facility.features.length > 0 ? facility.features : [""],
    });
    setEditingFacility(facility);
    setShowFacilityForm(true);
  };

  const editService = (service: Service) => {
    setServiceForm({
      name: service.name,
      category: service.category,
      customCategory: "",
      price: service.price,
      duration: service.duration,
      description: service.description || "",
      notes: service.notes || "",
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const editTest = (test: Test) => {
    setTestForm({
      name: test.name,
      category: test.category,
      customCategory: "",
      price: test.price,
      duration: test.duration || 30,
      description: test.description || "",
      notes: test.notes || "",
      sampleType: test.sampleType || "",
      preparationInstructions: test.preparationInstructions || "",
    });
    setEditingTest(test);
    setShowTestForm(true);
  };

  // ─── Search ──────────────────────────────────────────────────────

  const getSearchResults = () => {
    if (!searchTerm.trim()) {
      return {
        facilities,
        services,
        tests,
        hasResults:
          facilities.length > 0 || services.length > 0 || tests.length > 0,
      };
    }
    const searchLower = searchTerm.toLowerCase();
    const filteredFacilities = facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(searchLower) ||
        f.type.toLowerCase().includes(searchLower) ||
        f.description?.toLowerCase().includes(searchLower) ||
        f.features.some((feat) => feat.toLowerCase().includes(searchLower)),
    );
    const filteredServices = services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.notes?.toLowerCase().includes(searchLower),
    );
    const filteredTests = tests.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.category.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower) ||
        t.notes?.toLowerCase().includes(searchLower) ||
        t.sampleType?.toLowerCase().includes(searchLower),
    );
    return {
      facilities: filteredFacilities,
      services: filteredServices,
      tests: filteredTests,
      hasResults:
        filteredFacilities.length > 0 ||
        filteredServices.length > 0 ||
        filteredTests.length > 0,
    };
  };

  const searchResults = getSearchResults();

  // ─── Form Helpers ────────────────────────────────────────────────

  const addFeature = () => {
    setFacilityForm((prev) => ({ ...prev, features: [...prev.features, ""] }));
  };
  const updateFeature = (index: number, value: string) => {
    setFacilityForm((prev) => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }));
  };
  const removeFeature = (index: number) => {
    setFacilityForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  // ─── Get Options ─────────────────────────────────────────────────

  const getFacilityTypes = (): string[] => {
    switch (center.centerType) {
      case "hospital":
        return [
          "General Ward",
          "Private Ward",
          "ICU",
          "Emergency Room",
          "Maternity Ward",
          "Pediatric Ward",
          "Isolation Room",
          "Recovery Room",
          "Operating Theater",
          "Consultation Room",
        ];
      case "clinic":
        return [
          "Consultation Room",
          "Emergency Room",
          "Recovery Room",
          "Procedure Room",
        ];
      case "diagnostic_lab":
        return ["Laboratory", "Consultation Room", "Sample Collection Room"];
      case "pharmacy":
        return ["Pharmacy", "Dispensing Area", "Consultation Room"];
      case "dental_clinic":
        return ["Dental Room", "Consultation Room", "X-Ray Room"];
      case "optical_center":
        return ["Optical Room", "Consultation Room", "Exam Room"];
      default:
        return ["Consultation Room", "Treatment Room"];
    }
  };

  const getServiceCategories = (): string[] => {
    switch (center.centerType) {
      case "hospital":
        return [
          "General Consultation",
          "Specialist Consultation",
          "Emergency Care",
          "Surgical Services",
          "Maternity Services",
          "Pediatric Care",
          "Diagnostic Imaging",
          "Laboratory Tests",
          "Therapeutic Services",
          "Vaccination",
          "Health Checkup",
        ];
      case "clinic":
        return [
          "General Consultation",
          "Emergency Care",
          "Laboratory Tests",
          "Therapeutic Services",
          "Vaccination",
          "Minor Procedures",
        ];
      case "diagnostic_lab":
        return [
          "Laboratory Tests",
          "Diagnostic Imaging",
          "Health Screening",
          "Sample Collection",
        ];
      case "pharmacy":
        return [
          "Pharmacy Services",
          "Medication Dispensing",
          "Health Consultation",
        ];
      case "dental_clinic":
        return [
          "Dental Care",
          "Dental Consultation",
          "Teeth Cleaning",
          "Dental Surgery",
        ];
      case "optical_center":
        return [
          "Optical Services",
          "Eye Examination",
          "Contact Lens Fitting",
          "Glasses Prescription",
        ];
      default:
        return ["General Consultation", "Health Services"];
    }
  };

  const formatFacilityType = (type: string) =>
    type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* ─── Header ───────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Facility, Services & Tests
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {facilities.length + services.length + tests.length} items
              </span>
            </div>
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              {getCenterName()}
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Manage your facilities, services, tests, and operating hours
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveTab("facilities")}
              className={cn(
                "px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === "facilities"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/50"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              Facilities ({facilities.length})
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={cn(
                "px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === "services"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/50"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              Services ({services.length})
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={cn(
                "px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === "tests"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/50"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={cn(
                "px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                activeTab === "hours"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200/50"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              Hours
            </button>
          </div>
        </header>

        {/* ─── Save Status ─────────────────────────────────────── */}
        <AnimatePresence>
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "rounded-xl p-3 border shadow-sm",
                saveStatus === "success" &&
                  "bg-emerald-50 border-emerald-200 text-emerald-800",
                saveStatus === "error" &&
                  "bg-rose-50 border-rose-200 text-rose-800",
                saveStatus === "saving" &&
                  "bg-blue-50 border-blue-200 text-blue-800",
              )}
            >
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {saveStatus === "success" && (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {saveStatus === "saving" && "Saving changes..."}
                  {saveStatus === "success" && "Changes saved successfully!"}
                  {saveStatus === "error" && `Error: ${error}`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search facilities, services, tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* ─── Content ───────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === "facilities" && (
            <motion.div
              key="facilities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={() => setShowFacilityForm(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-emerald-200/50 transition-all disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Facility
              </button>

              {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <FacilityCardSkeleton key={i} />
                  ))}
                </div>
              ) : searchResults.facilities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchResults.facilities.map((facility) => (
                    <FacilityCard
                      key={facility.id}
                      facility={facility}
                      onEdit={() => editFacility(facility)}
                      onDelete={() => handleDeleteFacility(facility.id)}
                      loading={loading}
                      formatFacilityType={formatFacilityType}
                      formatNaira={formatNaira}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Building}
                  title={
                    searchTerm ? "No matching facilities" : "No facilities yet"
                  }
                  message={
                    searchTerm
                      ? "Try a different search term"
                      : "Add your first facility to get started"
                  }
                />
              )}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={() => setShowServiceForm(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-emerald-200/50 transition-all disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Service
              </button>

              {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <ServiceCardSkeleton key={i} />
                  ))}
                </div>
              ) : searchResults.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchResults.services.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onEdit={() => editService(service)}
                      onDelete={() => handleDeleteService(service.id)}
                      loading={loading}
                      formatFacilityType={formatFacilityType}
                      formatNaira={formatNaira}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Stethoscope}
                  title={
                    searchTerm ? "No matching services" : "No services yet"
                  }
                  message={
                    searchTerm
                      ? "Try a different search term"
                      : "Add your first service to get started"
                  }
                />
              )}
            </motion.div>
          )}

          {activeTab === "tests" && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button
                onClick={() => setShowTestForm(true)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-emerald-200/50 transition-all disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Test
              </button>

              {isInitialLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <TestCardSkeleton key={i} />
                  ))}
                </div>
              ) : searchResults.tests.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchResults.tests.map((test) => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onEdit={() => editTest(test)}
                      onDelete={() => handleDeleteTest(test.id)}
                      loading={loading}
                      formatNaira={formatNaira}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FlaskConical}
                  title={searchTerm ? "No matching tests" : "No tests yet"}
                  message={
                    searchTerm
                      ? "Try a different search term"
                      : "Add your first test to get started"
                  }
                />
              )}
            </motion.div>
          )}

          {activeTab === "hours" && (
            <motion.div
              key="hours"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/80">
                <h2
                  className={cn(
                    "text-xl font-bold text-slate-800 mb-4",
                    bebasNeue.className,
                  )}
                >
                  Operating Hours
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        className={cn(
                          "block text-xs font-medium text-slate-600 mb-1",
                          poppins.className,
                        )}
                      >
                        Opening
                      </label>
                      <input
                        type="time"
                        value={operatingHours.opening}
                        onChange={(e) =>
                          setOperatingHours((prev) => ({
                            ...prev,
                            opening: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label
                        className={cn(
                          "block text-xs font-medium text-slate-600 mb-1",
                          poppins.className,
                        )}
                      >
                        Closing
                      </label>
                      <input
                        type="time"
                        value={operatingHours.closing}
                        onChange={(e) =>
                          setOperatingHours((prev) => ({
                            ...prev,
                            closing: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={cn(
                        "block text-xs font-medium text-slate-600 mb-2",
                        poppins.className,
                      )}
                    >
                      Operating Days
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                        (shortDay) => {
                          const fullDay =
                            shortDay === "Mon"
                              ? "Monday"
                              : shortDay === "Tue"
                                ? "Tuesday"
                                : shortDay === "Wed"
                                  ? "Wednesday"
                                  : shortDay === "Thu"
                                    ? "Thursday"
                                    : shortDay === "Fri"
                                      ? "Friday"
                                      : shortDay === "Sat"
                                        ? "Saturday"
                                        : "Sunday";
                          const checked = operatingHours.days.includes(fullDay);
                          return (
                            <label
                              key={shortDay}
                              className={cn(
                                "flex flex-col items-center p-2 rounded-lg border transition-all cursor-pointer",
                                checked
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOperatingHours((prev) => ({
                                      ...prev,
                                      days: [...prev.days, fullDay],
                                    }));
                                  } else {
                                    setOperatingHours((prev) => ({
                                      ...prev,
                                      days: prev.days.filter(
                                        (d) => d !== fullDay,
                                      ),
                                    }));
                                  }
                                }}
                                className="sr-only"
                              />
                              <span className="text-xs font-medium">
                                {shortDay}
                              </span>
                            </label>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      className={cn(
                        "block text-xs font-medium text-slate-600 mb-1",
                        poppins.className,
                      )}
                    >
                      Timezone
                    </label>
                    <select
                      value={operatingHours.timezone}
                      onChange={(e) =>
                        setOperatingHours((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
                    >
                      <option value="WAT">West Africa Time (WAT)</option>
                      <option value="GMT">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveOperatingHours}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-emerald-200/50 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Save Hours"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/80">
                <h3
                  className={cn(
                    "text-base font-bold text-slate-800 mb-3",
                    bebasNeue.className,
                  )}
                >
                  Location
                </h3>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {center.location?.address || "Address not available"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        Verified Location
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Modals ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFacilityForm && (
          <Modal
            title={editingFacility ? "Edit Facility" : "Add Facility"}
            onClose={() => {
              setShowFacilityForm(false);
              setEditingFacility(null);
              resetFacilityForm();
            }}
            onSave={handleSaveFacility}
            loading={loading}
            disabled={
              loading ||
              !facilityForm.name ||
              (!facilityForm.type && !facilityForm.customType)
            }
          >
            <FacilityFormContent
              form={facilityForm}
              setForm={setFacilityForm}
              getFacilityTypes={getFacilityTypes}
              addFeature={addFeature}
              updateFeature={updateFeature}
              removeFeature={removeFeature}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showServiceForm && (
          <Modal
            title={editingService ? "Edit Service" : "Add Service"}
            onClose={() => {
              setShowServiceForm(false);
              setEditingService(null);
              resetServiceForm();
            }}
            onSave={handleSaveService}
            loading={loading}
            disabled={
              loading ||
              !serviceForm.name ||
              (!serviceForm.category && !serviceForm.customCategory)
            }
          >
            <ServiceFormContent
              form={serviceForm}
              setForm={setServiceForm}
              getServiceCategories={getServiceCategories}
            />
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTestForm && (
          <Modal
            title={editingTest ? "Edit Test" : "Add Test"}
            onClose={() => {
              setShowTestForm(false);
              setEditingTest(null);
              resetTestForm();
            }}
            onSave={handleSaveTest}
            loading={loading}
            disabled={
              loading ||
              !testForm.name ||
              (!testForm.category && !testForm.customCategory)
            }
          >
            <TestFormContent
              form={testForm}
              setForm={setTestForm}
              testCategories={testCategories}
              sampleTypes={sampleTypes}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Card Components ────────────────────────────────────────────────

const FacilityCard = ({
  facility,
  onEdit,
  onDelete,
  loading,
  formatFacilityType,
  formatNaira,
}: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-emerald-200/60 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm md:text-base font-bold text-slate-800 truncate">
            {facility.name}
          </h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap">
            {formatFacilityType(facility.type)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            {facility.available}/{facility.capacity}
          </span>
          <span className="flex items-center gap-1">
            <span className="font-medium">₦</span>
            {facility.costPerDay.toLocaleString()}/day
          </span>
        </div>
      </div>
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="mb-3">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>Availability</span>
        <span>
          {Math.round((facility.available / facility.capacity) * 100)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            facility.available === 0
              ? "bg-rose-500"
              : facility.available / facility.capacity < 0.2
                ? "bg-amber-500"
                : "bg-emerald-500",
          )}
          style={{
            width: `${(facility.available / facility.capacity) * 100}%`,
          }}
        />
      </div>
    </div>
    {facility.description && (
      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
        {facility.description}
      </p>
    )}
    {facility.features.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {facility.features.slice(0, 3).map((feature: string, idx: number) => (
          <span
            key={idx}
            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-medium rounded-full border border-blue-200"
          >
            {feature}
          </span>
        ))}
        {facility.features.length > 3 && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-medium rounded-full">
            +{facility.features.length - 3}
          </span>
        )}
      </div>
    )}
  </motion.div>
);

const ServiceCard = ({
  service,
  onEdit,
  onDelete,
  loading,
  formatFacilityType,
  formatNaira,
}: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-emerald-200/60 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm md:text-base font-bold text-slate-800 truncate">
            {service.name}
          </h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap">
            {formatFacilityType(service.category)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="font-medium">₦</span>
            {service.price.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {service.duration} mins
          </span>
        </div>
      </div>
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    {service.description && (
      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
        {service.description}
      </p>
    )}
    {service.notes && (
      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-xs text-amber-800 leading-relaxed line-clamp-2">
          <strong>Note:</strong> {service.notes}
        </p>
      </div>
    )}
  </motion.div>
);

const TestCard = ({ test, onEdit, onDelete, loading, formatNaira }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-emerald-200/60 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="text-sm md:text-base font-bold text-slate-800 truncate">
            {test.name}
          </h3>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] md:text-xs font-medium rounded-full whitespace-nowrap">
            {test.category}
          </span>
          {test.sampleType && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] md:text-xs font-medium rounded-full border border-blue-200 whitespace-nowrap">
              {test.sampleType}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="font-medium">₦</span>
            {test.price.toLocaleString()}
          </span>
          {test.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {test.duration} mins
            </span>
          )}
        </div>
      </div>
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
    {test.description && (
      <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
        {test.description}
      </p>
    )}
    {test.preparationInstructions && (
      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
        <p className="text-xs text-amber-800 leading-relaxed line-clamp-2">
          <strong>Preparation:</strong> {test.preparationInstructions}
        </p>
      </div>
    )}
    {test.notes && (
      <div className="mt-1 p-2 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          <strong>Note:</strong> {test.notes}
        </p>
      </div>
    )}
  </motion.div>
);

// ─── Empty State ─────────────────────────────────────────────────────

const EmptyState = ({ icon: Icon, title, message }: any) => (
  <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-300/60">
    <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
    <h3 className={cn("text-lg font-bold text-slate-800", bebasNeue.className)}>
      {title}
    </h3>
    <p className="text-sm text-slate-500 mt-1">{message}</p>
  </div>
);

// ─── Modal ───────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
  disabled: boolean;
  children: React.ReactNode;
}

const Modal = ({
  title,
  onClose,
  onSave,
  loading,
  disabled,
  children,
}: ModalProps) => (
  <div
    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between rounded-t-2xl">
        <h2
          className={cn(
            "text-lg sm:text-xl font-bold text-slate-800",
            bebasNeue.className,
          )}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 -m-1 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-slate-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 rounded-b-2xl">
        <button
          onClick={onClose}
          className="w-full sm:flex-1 px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl transition font-medium order-2 sm:order-1"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={disabled}
          className="w-full sm:flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Form Content Components ──────────────────────────────────────

const FacilityFormContent = ({
  form,
  setForm,
  getFacilityTypes,
  addFeature,
  updateFeature,
  removeFeature,
}: any) => (
  <div className="space-y-4">
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Facility Name *
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, name: e.target.value }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="e.g., General Ward"
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Facility Type *
      </label>
      <select
        value={form.type}
        onChange={(e) =>
          setForm((prev: any) => ({
            ...prev,
            type: e.target.value,
            customType: e.target.value === "custom" ? prev.customType : "",
          }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 mb-2"
      >
        <option value="">Select Type</option>
        {getFacilityTypes().map((type: string) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
        <option value="custom">Custom Type...</option>
      </select>
      {form.type === "custom" && (
        <input
          type="text"
          value={form.customType}
          onChange={(e) =>
            setForm((prev: any) => ({ ...prev, customType: e.target.value }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
          placeholder="Enter custom facility type..."
        />
      )}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Capacity *
        </label>
        <input
          type="number"
          value={form.capacity}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              capacity: parseInt(e.target.value) || 0,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="1"
        />
      </div>
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Available *
        </label>
        <input
          type="number"
          value={form.available}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              available: parseInt(e.target.value) || 0,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="0"
          max={form.capacity}
        />
      </div>
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Cost Per Day (₦) *
      </label>
      <input
        type="number"
        value={form.costPerDay}
        onChange={(e) =>
          setForm((prev: any) => ({
            ...prev,
            costPerDay: parseInt(e.target.value) || 0,
          }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
        min="0"
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Description
      </label>
      <textarea
        value={form.description}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, description: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="Describe this facility..."
      />
    </div>
    <div>
      <div className="flex items-center justify-between mb-2">
        <label
          className={cn(
            "text-sm font-medium text-slate-700",
            poppins.className,
          )}
        >
          Features
        </label>
        <button
          type="button"
          onClick={addFeature}
          className="text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
      {form.features.map((feature: string, index: number) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            value={feature}
            onChange={(e) => updateFeature(index, e.target.value)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
            placeholder="e.g., AC, TV"
          />
          {form.features.length > 1 && (
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="px-3 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ServiceFormContent = ({ form, setForm, getServiceCategories }: any) => (
  <div className="space-y-4">
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Service Name *
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, name: e.target.value }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="e.g., General Consultation"
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Category *
      </label>
      <select
        value={form.category}
        onChange={(e) =>
          setForm((prev: any) => ({
            ...prev,
            category: e.target.value,
            customCategory:
              e.target.value === "custom" ? prev.customCategory : "",
          }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 mb-2"
      >
        <option value="">Select Category</option>
        {getServiceCategories().map((category: string) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value="custom">Custom Category...</option>
      </select>
      {form.category === "custom" && (
        <input
          type="text"
          value={form.customCategory}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              customCategory: e.target.value,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
          placeholder="Enter custom service category..."
        />
      )}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Price (₦) *
        </label>
        <input
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              price: parseInt(e.target.value) || 0,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="0"
        />
      </div>
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Duration (mins) *
        </label>
        <input
          type="number"
          value={form.duration}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              duration: parseInt(e.target.value) || 30,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="1"
        />
      </div>
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Description
      </label>
      <textarea
        value={form.description}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, description: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="Describe this service..."
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Additional Notes
      </label>
      <textarea
        value={form.notes}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, notes: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="Any special instructions..."
      />
    </div>
  </div>
);

const TestFormContent = ({
  form,
  setForm,
  testCategories,
  sampleTypes,
}: any) => (
  <div className="space-y-4">
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Test Name *
      </label>
      <input
        type="text"
        value={form.name}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, name: e.target.value }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="e.g., Complete Blood Count"
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Category *
      </label>
      <select
        value={form.category}
        onChange={(e) =>
          setForm((prev: any) => ({
            ...prev,
            category: e.target.value,
            customCategory:
              e.target.value === "custom" ? prev.customCategory : "",
          }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 mb-2"
      >
        <option value="">Select Category</option>
        {testCategories.map((category: string) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value="custom">Custom Category...</option>
      </select>
      {form.category === "custom" && (
        <input
          type="text"
          value={form.customCategory}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              customCategory: e.target.value,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
          placeholder="Enter custom category..."
        />
      )}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Price (₦) *
        </label>
        <input
          type="number"
          value={form.price}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              price: parseInt(e.target.value) || 0,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="0"
        />
      </div>
      <div>
        <label
          className={cn(
            "block text-sm font-medium text-slate-700 mb-1",
            poppins.className,
          )}
        >
          Duration (mins)
        </label>
        <input
          type="number"
          value={form.duration}
          onChange={(e) =>
            setForm((prev: any) => ({
              ...prev,
              duration: parseInt(e.target.value) || 30,
            }))
          }
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
          min="1"
        />
      </div>
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Sample Type
      </label>
      <select
        value={form.sampleType}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, sampleType: e.target.value }))
        }
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 mb-2"
      >
        <option value="">Select Sample Type</option>
        {sampleTypes.map((type: string) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Description
      </label>
      <textarea
        value={form.description}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, description: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="Describe this test..."
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Preparation Instructions
      </label>
      <textarea
        value={form.preparationInstructions}
        onChange={(e) =>
          setForm((prev: any) => ({
            ...prev,
            preparationInstructions: e.target.value,
          }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="e.g., Fasting for 8 hours..."
      />
    </div>
    <div>
      <label
        className={cn(
          "block text-sm font-medium text-slate-700 mb-1",
          poppins.className,
        )}
      >
        Additional Notes
      </label>
      <textarea
        value={form.notes}
        onChange={(e) =>
          setForm((prev: any) => ({ ...prev, notes: e.target.value }))
        }
        rows={2}
        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
        placeholder="Any special instructions..."
      />
    </div>
  </div>
);
