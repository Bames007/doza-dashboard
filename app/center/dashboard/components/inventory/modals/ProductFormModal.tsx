"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Loader2, Plus } from "lucide-react";
import { Product, Supplier } from "../../../types/pharmacy";
import { ModalWrapper } from "../ModalWrapper";
import {
  groupedCategories,
  getAllCategories,
  getCategoryGroup,
  isMedicalEquipmentCategory,
  isPrescriptionCategory,
} from "../../../utils/categories";

interface ProductFormData {
  sku: string;
  name: string;
  category: string;
  manufacturer: string;
  expiryDate: string;
  isMedicalEquipment: boolean;
  quantity: number;
  unit: string;
  reorderLevel: number;
  unitPrice: number;
  markupPercentage: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  location: string;
  description: string;
  barcode?: string;
  batchNumber?: string;
  brand?: string;
}

interface ProductFormModalProps {
  productForm: ProductFormData;
  suppliers: Supplier[];
  selectedProduct: Product | null;
  onClose: () => void;
  onSave: () => Promise<void>; // Changed to async function
  onFormChange: (
    field: keyof ProductFormData,
    value: string | number | boolean
  ) => void;
  onGenerateBarcode: () => void;
  saving?: boolean; // Added loading state
}

export const ProductFormModal = ({
  productForm,
  suppliers,
  selectedProduct,
  onClose,
  onSave,
  onFormChange,
  onGenerateBarcode,
  saving = false,
}: ProductFormModalProps) => {
  const [activeTab, setActiveTab] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isSavingLocally, setIsSavingLocally] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const pharmacyCategories = getAllCategories();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Extensive pharmacy categories including provisions
  // const pharmacyCategories = [
  //   // Medical Categories
  //   "Analgesics & Pain Relief",
  //   "Antibiotics",
  //   "Antihypertensives",
  //   "Antidiabetics",
  //   "Antidepressants",
  //   "Antipsychotics",
  //   "Anticoagulants",
  //   "Bronchodilators",
  //   "Corticosteroids",
  //   "Diuretics",
  //   "Gastrointestinal",
  //   "Hormones & Contraceptives",
  //   "Immunosuppressants",
  //   "Muscle Relaxants",
  //   "Ophthalmic",
  //   "Otic (Ear)",
  //   "Topical",
  //   "Vaccines",

  //   // Medical Equipment & Supplies
  //   "Diagnostic Equipment",
  //   "Surgical Instruments",
  //   "Patient Monitoring",
  //   "Mobility Aids",
  //   "First Aid Supplies",
  //   "Wound Care",
  //   "Disposable Medical Supplies",
  //   "Personal Protective Equipment (PPE)",
  //   "Laboratory Equipment",
  //   "Dental Supplies",

  //   // Health & Wellness
  //   "Vitamins & Supplements",
  //   "Minerals",
  //   "Herbal & Natural Remedies",
  //   "Sports Nutrition",
  //   "Weight Management",
  //   "Probiotics & Digestive Health",

  //   // Personal Care & Toiletries
  //   "Skincare",
  //   "Hair Care",
  //   "Oral Care",
  //   "Baby Care",
  //   "Feminine Hygiene",
  //   "Men's Grooming",
  //   "Deodorants & Antiperspirants",
  //   "Soaps & Bath Products",

  //   // Provision Store Items
  //   "Beverages",
  //   "Snacks & Confectionery",
  //   "Canned Foods",
  //   "Dairy Products",
  //   "Grains & Cereals",
  //   "Spices & Condiments",
  //   "Personal Hygiene",
  //   "Household Cleaning",
  //   "Baby Products",
  //   "Pet Care",

  //   // Specialized Pharmacy
  //   "Veterinary Medicines",
  //   "Dermatologicals",
  //   "Oncology",
  //   "Cardiology",
  //   "Neurology",
  //   "Psychiatry",

  //   // Other
  //   "Medical Books & References",
  //   "Pharmacy Accessories",
  //   "Seasonal Items",
  //   "Promotional Items",
  //   "Custom/Other",
  // ];

  const units = [
    "tablets",
    "capsules",
    "bottles",
    "syrups",
    "injections",
    "vials",
    "ampoules",
    "tubes",
    "creams",
    "ointments",
    "suppositories",
    "patches",
    "inhalers",
    "droppers",
    "pieces",
    "boxes",
    "packs",
    "bags",
    "liters",
    "grams",
    "kilograms",
    "milliliters",
    "meters",
    "pairs",
    "sets",
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleNext = () => {
    if (activeTab < 3) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrevious = () => {
    if (activeTab > 1) {
      setActiveTab(activeTab - 1);
    }
  };

  const handleAddCustomCategory = () => {
    if (
      customCategory.trim() &&
      !pharmacyCategories.includes(customCategory.trim())
    ) {
      // Add custom category to form
      onFormChange("category", customCategory.trim());
      setShowCustomCategory(false);
      setCustomCategory("");
    }
  };

  const handleSaveLocalFirst = async () => {
    try {
      setIsSavingLocally(true);
      setSaveStatus("saving");

      // Save to localStorage immediately for instant feedback
      const productsKey = `local_products_${selectedProduct?.id || Date.now()}`;
      const localProduct = {
        ...productForm,
        id: selectedProduct?.id || `local_${Date.now()}`,
        _local: true,
        _synced: false,
        _createdAt: new Date().toISOString(),
      };

      // Get existing local products
      const existingLocalProducts = JSON.parse(
        localStorage.getItem("localProducts") || "[]"
      );
      const updatedLocalProducts = selectedProduct
        ? existingLocalProducts.map((p: any) =>
            p.id === selectedProduct.id ? localProduct : p
          )
        : [...existingLocalProducts, localProduct];

      localStorage.setItem(
        "localProducts",
        JSON.stringify(updatedLocalProducts)
      );

      // Show immediate feedback
      setSaveStatus("saved");

      // Call the original save function (which will try to sync to server)
      await onSave();

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error saving locally:", error);
      alert("Product saved locally. Will sync when online.");
      onClose(); // Still close the modal since it's saved locally
    } finally {
      setIsSavingLocally(false);
      setSaveStatus("idle");
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
              activeTab === step
                ? "bg-emerald-600 text-white"
                : activeTab > step
                ? "bg-emerald-100 text-emerald-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-1 ${
                activeTab > step ? "bg-emerald-300" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
      <div className="ml-4 text-sm text-gray-600">Step {activeTab} of 3</div>
    </div>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
                {selectedProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">
                {selectedProduct?.sku || "New product entry"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
              aria-label="Close"
              disabled={isSavingLocally}
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}
        </div>

        <div className="p-4 md:p-6">
          {/* Step 1: Basic Information */}
          {activeTab === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productForm.sku}
                        onChange={(e) => onFormChange("sku", e.target.value)}
                        className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        placeholder="Enter product SKU"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => onFormChange("name", e.target.value)}
                        className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand (Optional)
                      </label>
                      <input
                        type="text"
                        value={productForm.brand || ""}
                        onChange={(e) => onFormChange("brand", e.target.value)}
                        className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter brand name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            value={productForm.category}
                            onChange={(e) => {
                              if (e.target.value === "custom") {
                                setShowCustomCategory(true);
                              } else {
                                onFormChange("category", e.target.value);
                                // Auto-set prescription requirement based on category
                                // if (isPrescriptionCategory(e.target.value)) {
                                //   onFormChange("prescriptionRequired", true);
                                // }
                                // Auto-set medical equipment flag
                                if (
                                  isMedicalEquipmentCategory(e.target.value)
                                ) {
                                  onFormChange("isMedicalEquipment", true);
                                }
                              }
                            }}
                            className="flex-1 px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="">Select Category</option>
                            {groupedCategories.map((group) => (
                              <optgroup key={group.group} label={group.group}>
                                {group.categories.map((category) => (
                                  <option key={category} value={category}>
                                    {category}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            <option value="custom">
                              + Add Custom Category
                            </option>
                          </select>
                        </div>

                        {/* Category description based on selection */}
                        {productForm.category && (
                          <div className="text-xs text-gray-500">
                            <div className="font-medium mb-1">
                              Category: {productForm.category}
                            </div>
                            <div className="flex gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                Group: {getCategoryGroup(productForm.category)}
                              </span>
                              {isPrescriptionCategory(productForm.category) && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full">
                                  Requires Prescription
                                </span>
                              )}
                              {isMedicalEquipmentCategory(
                                productForm.category
                              ) && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                                  Medical Equipment
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {showCustomCategory && (
                          <div className="flex gap-2 animate-slideDown">
                            <input
                              type="text"
                              value={customCategory}
                              onChange={(e) =>
                                setCustomCategory(e.target.value)
                              }
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              placeholder="Enter custom category"
                            />
                            <button
                              onClick={handleAddCustomCategory}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setShowCustomCategory(false);
                                setCustomCategory("");
                              }}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manufacturer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={productForm.manufacturer}
                        onChange={(e) =>
                          onFormChange("manufacturer", e.target.value)
                        }
                        className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        placeholder="Enter manufacturer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={productForm.expiryDate}
                        onChange={(e) =>
                          onFormChange("expiryDate", e.target.value)
                        }
                        className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isMedicalEquipment"
                      checked={productForm.isMedicalEquipment}
                      onChange={(e) =>
                        onFormChange("isMedicalEquipment", e.target.checked)
                      }
                      className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="isMedicalEquipment"
                      className="text-sm font-medium text-gray-700"
                    >
                      This is medical equipment requiring special handling
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Medical equipment may require calibration, maintenance
                    records, and special storage conditions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Inventory */}
          {activeTab === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Pricing & Inventory
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={productForm.quantity}
                      onChange={(e) =>
                        onFormChange("quantity", parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => onFormChange("unit", e.target.value)}
                      className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select Unit</option>
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={productForm.reorderLevel}
                      onChange={(e) =>
                        onFormChange(
                          "reorderLevel",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price (Cost) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">₦</span>
                      </div>
                      <input
                        type="number"
                        value={productForm.unitPrice}
                        onChange={(e) =>
                          onFormChange(
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pl-8 pr-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Markup Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={productForm.markupPercentage}
                        onChange={(e) =>
                          onFormChange(
                            "markupPercentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full pr-12 pl-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        min="0"
                        step="0.1"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price
                    </label>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(
                        productForm.sellingPrice ||
                          productForm.unitPrice *
                            (1 + (productForm.markupPercentage || 0) / 100)
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated based on cost and markup
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Supplier & Details */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Supplier & Details
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Supplier
                  </label>
                  <select
                    value={productForm.supplierId}
                    onChange={(e) => {
                      const supplier = suppliers.find(
                        (s) => s.id === e.target.value
                      );
                      onFormChange("supplierId", e.target.value);
                      onFormChange("supplierName", supplier?.name || "");
                    }}
                    className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">No Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.contactPerson}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location/Shelf
                    </label>
                    <input
                      type="text"
                      value={productForm.location}
                      onChange={(e) => onFormChange("location", e.target.value)}
                      className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="e.g., Shelf A1, Row 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={productForm.batchNumber || ""}
                      onChange={(e) =>
                        onFormChange("batchNumber", e.target.value)
                      }
                      className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Enter batch number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      onFormChange("description", e.target.value)
                    }
                    rows={4}
                    className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="Enter product description, usage instructions, or special notes..."
                  />
                </div>

                {/* Save status indicator */}
                {saveStatus === "saving" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Saving locally...
                        </p>
                        <p className="text-sm text-blue-700">
                          Product will be available immediately
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {saveStatus === "saved" && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium text-emerald-900">
                          Saved locally!
                        </p>
                        <p className="text-sm text-emerald-700">
                          Syncing to server in background...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300 transition-colors disabled:opacity-50"
              disabled={isSavingLocally}
            >
              Cancel
            </button>

            {activeTab > 1 && (
              <button
                onClick={handlePrevious}
                className="flex-1 px-4 py-3.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300 transition-colors flex items-center justify-center gap-2"
                disabled={isSavingLocally}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            {activeTab < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                disabled={isSavingLocally}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveLocalFirst}
                disabled={isSavingLocally || saving}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingLocally || saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : selectedProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            )}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center mt-4 gap-1">
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                className={`w-2 h-2 rounded-full ${
                  activeTab === dot
                    ? "bg-emerald-600"
                    : activeTab > dot
                    ? "bg-emerald-300"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </ModalWrapper>
  );
};
