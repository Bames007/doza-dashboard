"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Center, User as UserType } from "@/app/center/type";
import { Product, InventoryAudit, Supplier } from "../types/pharmacy";

type ProductWithLocal = Product & { _local?: boolean };
type SupplierWithLocal = Supplier & { _local?: boolean };

import { InventoryHeader } from "../components/inventory/InventoryHeader";
import { QuickActions } from "../components/inventory/QuickAction";
import { StatisticsCards } from "../components/inventory/StatisticsCards";
import { InventoryFilters } from "../components/inventory/InventoryFilters";
import { ProductTable } from "../components/inventory/ProductTable";

import { ScannerModal } from "../components/ScannerModal";
import { BulkUploadModal } from "../components/inventory/modals/BulkUploadModal"; // Note: Fixed component name to BulkUploadModal
import { ApiWrapper } from "@/app/utils/apiWrapper";
import { ProductFormModal } from "../components/inventory/modals/ProductFormModal";
import { StockAdjustmentModal } from "../components/inventory/modals/StockAdjustmentModal";
import { SupplierModal } from "../components/inventory/modals/SupplierModal";
import { SupplierFormModal } from "../components/inventory/modals/SupplierFormModal";
import { PrintLabelsModal } from "../components/inventory/modals/PrintLabelsModal";
import { AuditLogsModal } from "../components/inventory/modals/AuditLogsModal";
import {
  categoryMapping,
  mapCategory,
  validCategories as sharedValidCategories,
} from "../utils/categoryMapping";

interface InventoryPanelProps {
  center: Center;
  user: UserType;
}

interface Statistics {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiredCount: number;
  categories: string[];
  equipmentCount: number;
  prescriptionCount: number;
}

interface ProductFormData {
  sku: string;
  barcode: string;
  barcodeType: "EAN13" | "UPC" | "CODE128" | "QR" | "CUSTOM";
  name: string;
  genericName: string;
  brand: string;
  category: string;
  manufacturer: string;
  supplierId: string;
  supplierName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  markupPercentage: number;
  sellingPrice: number;
  reorderLevel: number;
  location: string;
  description: string;
  prescriptionRequired: boolean;
  isMedicalEquipment: boolean;
  equipmentType: string;
}

interface StockAdjustmentData {
  productId: string;
  productName: string;
  currentQuantity: number;
  newQuantity: number;
  difference: number;
  action: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT";
  reason: string;
  notes: string;
  unit: string;
}

interface SupplierFormData {
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: string;
  notes: string;
}

export const InventoryPanel = ({ center, user }: InventoryPanelProps) => {
  const [products, setProducts] = useState<ProductWithLocal[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithLocal[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierWithLocal[]>([]);
  const [auditLogs, setAuditLogs] = useState<InventoryAudit[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithLocal | null>(null);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierWithLocal | null>(null);

  // Offline State
  const [apiWrapper, setApiWrapper] = useState<ApiWrapper | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineStats, setOfflineStats] = useState({
    pendingOperations: 0,
    localProducts: 0,
  });

  const [showProductForm, setShowProductForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPrintLabels, setShowPrintLabels] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [productForm, setProductForm] = useState<ProductFormData>({
    sku: "",
    barcode: "",
    barcodeType: "EAN13",
    name: "",
    genericName: "",
    brand: "",
    category: "",
    manufacturer: "",
    supplierId: "",
    supplierName: "",
    batchNumber: "",
    expiryDate: "",
    quantity: 0,
    unit: "tablets",
    unitPrice: 0,
    markupPercentage: 20,
    sellingPrice: 0,
    reorderLevel: 10,
    location: "Shelf A1",
    description: "",
    prescriptionRequired: false,
    isMedicalEquipment: false,
    equipmentType: "",
  });

  const [stockAdjustment, setStockAdjustment] = useState<StockAdjustmentData>({
    productId: "",
    productName: "",
    currentQuantity: 0,
    newQuantity: 0,
    difference: 0,
    action: "ADJUSTMENT",
    reason: "",
    notes: "",
    unit: "",
  });

  const [supplierForm, setSupplierForm] = useState<SupplierFormData>({
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    paymentTerms: "",
    notes: "",
  });

  const categories = useMemo(() => {
    return [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ] as string[];
  }, [products]);

  const validCategories = useMemo(
    () => [
      "medication",
      "equipment",
      "supplies",
      "consumables",
      "vaccine",
      "diagnostic",
      "surgical",
      "pharmaceutical",
    ],
    []
  );
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const getStockStatusColor = useCallback((product: Product) => {
    if (product.quantity === 0) return "bg-red-100 text-red-800";
    if (product.quantity <= product.reorderLevel)
      return "bg-amber-100 text-amber-800";
    return "bg-emerald-100 text-emerald-800";
  }, []);

  const getExpiryStatus = useCallback((expiryDate: string) => {
    if (!expiryDate)
      return { color: "bg-gray-100 text-gray-800", text: "No Expiry" };

    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime()))
      return { color: "bg-gray-100 text-gray-800", text: "Invalid Date" };

    const today = new Date();
    const daysDiff = Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff < 0)
      return { color: "bg-red-100 text-red-800", text: "Expired" };
    if (daysDiff <= 30)
      return { color: "bg-amber-100 text-amber-800", text: "Expiring Soon" };
    if (daysDiff <= 90)
      return { color: "bg-blue-100 text-blue-800", text: "Near Expiry" };
    return { color: "bg-emerald-100 text-emerald-800", text: "Valid" };
  }, []);

  const generateBarcode = useCallback(() => {
    const prefix = "DZ";
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${random}`;
  }, []);

  const generateSKU = useCallback(
    (category: string = "", name: string = "") => {
      const categoryCode = category.slice(0, 3).toUpperCase() || "GEN";
      const nameCode = name.slice(0, 3).toUpperCase() || "PRO";
      const timestamp = Date.now().toString().slice(-6);
      return `${categoryCode}-${nameCode}-${timestamp}`;
    },
    []
  );

  useEffect(() => {
    const wrapper = new ApiWrapper({
      userId: user.id,
      centerId: center.id,
      offlineFirst: true,
    });
    setApiWrapper(wrapper);

    const handleOnline = () => {
      setIsOnline(true);
      wrapper.forceSync && wrapper.forceSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    if (navigator.onLine && wrapper.forceSync) {
      setTimeout(() => wrapper.forceSync(), 1000);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [center.id, user.id]);

  useEffect(() => {
    if (apiWrapper) {
      loadAllData();
    }
  }, [center.id, user.id, apiWrapper]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProducts(), loadSuppliers(), loadStatistics()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!apiWrapper) return;

    try {
      const endpoint = `/api/centers/${center.id}/inventory`;
      const result = await apiWrapper.get(endpoint);

      if (result.success) {
        let loadedProducts: ProductWithLocal[] = [];

        if (result._local) {
          loadedProducts = (result.data?.products ||
            result.data ||
            []) as ProductWithLocal[];
        } else if (result.data?.products) {
          loadedProducts = result.data.products as ProductWithLocal[];
        } else if (Array.isArray(result.data)) {
          loadedProducts = result.data as ProductWithLocal[];
        }

        const allProducts = loadedProducts.map((product) => ({
          ...product,
          _local: result._local || false,
        }));

        setProducts(allProducts);
        setFilteredProducts(allProducts);

        updateLocalStatistics(allProducts);
      }
    } catch (error) {
      console.error("Error loading products:", error);

      try {
        const localProducts = await getLocalProducts();
        if (localProducts.length > 0) {
          setProducts(localProducts);
          setFilteredProducts(localProducts);
          updateLocalStatistics(localProducts);
        }
      } catch (localError) {
        console.error("Failed to load local products:", localError);
      }
    }
  };

  // Local product storage simulation
  const getLocalProducts = async (): Promise<ProductWithLocal[]> => {
    try {
      const stored = localStorage.getItem(`inventory_${center.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error reading local storage:", error);
    }
    return [];
  };

  const saveLocalProducts = async (products: ProductWithLocal[]) => {
    try {
      localStorage.setItem(`inventory_${center.id}`, JSON.stringify(products));
    } catch (error) {
      console.error("Error saving to local storage:", error);
    }
  };

  // Calculate local statistics
  const updateLocalStatistics = (products: ProductWithLocal[]) => {
    const totalValue = products.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
      0
    );
    const lowStockCount = products.filter(
      (p) => p.quantity <= p.reorderLevel
    ).length;
    const expiredCount = products.filter((p) => {
      if (!p.expiryDate) return false;
      const expiry = new Date(p.expiryDate);
      return !isNaN(expiry.getTime()) && expiry < new Date();
    }).length;
    const equipmentCount = products.filter((p) => p.isMedicalEquipment).length;
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ] as string[];

    setStatistics({
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      expiredCount,
      categories,
      equipmentCount,
      prescriptionCount: products.filter((p) => p.prescriptionRequired).length,
    });
  };

  const loadSuppliers = async () => {
    if (!apiWrapper) return;

    try {
      const endpoint = `/api/centers/${center.id}/suppliers`;
      const result = await apiWrapper.get(endpoint);

      if (result.success) {
        const supplierData = Array.isArray(result.data)
          ? result.data
          : result.data?.suppliers || [];
        setSuppliers(supplierData as SupplierWithLocal[]);
      }
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadStatistics = async () => {
    if (!apiWrapper) return;

    try {
      const endpoint = `/api/centers/${center.id}/inventory/stats`;
      const result = await apiWrapper.get(endpoint);

      if (result.success) {
        setStatistics(result.data);
      } else {
        // If no stats endpoint, calculate from products
        updateLocalStatistics(products);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      updateLocalStatistics(products);
    }
  };

  const handleProductFormChange = (
    field: keyof ProductFormData,
    value: string | number | boolean
  ) => {
    setProductForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate SKU if name and category are provided
      if (field === "name" || field === "category") {
        if (updated.name && updated.category && !updated.sku) {
          updated.sku = generateSKU(updated.category, updated.name);
        }
      }

      // Calculate selling price
      if (field === "unitPrice" || field === "markupPercentage") {
        const unitPrice =
          field === "unitPrice" ? Number(value) : prev.unitPrice;
        const markup =
          field === "markupPercentage" ? Number(value) : prev.markupPercentage;
        updated.sellingPrice = unitPrice * (1 + markup / 100);
      }

      // Generate barcode if needed
      if (field === "name" && !updated.barcode) {
        updated.barcode = generateBarcode();
      }

      return updated;
    });
  };

  const validateProductForm = (): string[] => {
    const errors: string[] = [];

    if (!productForm.name.trim()) errors.push("Product name is required");
    if (!productForm.category.trim()) errors.push("Category is required");
    if (productForm.quantity < 0) errors.push("Quantity cannot be negative");
    if (productForm.unitPrice <= 0)
      errors.push("Unit price must be greater than 0");
    if (productForm.reorderLevel < 0)
      errors.push("Reorder level cannot be negative");

    // Validate expiry date format
    if (productForm.expiryDate) {
      const expiry = new Date(productForm.expiryDate);
      if (isNaN(expiry.getTime())) {
        errors.push("Invalid expiry date format");
      } else if (expiry < new Date()) {
        errors.push("Expiry date cannot be in the past");
      }
    }

    // Validate category
    if (productForm.category) {
      const normalizedCategory = productForm.category.toLowerCase().trim();

      // Check if category is valid
      const isValidCategory =
        sharedValidCategories.includes(normalizedCategory) ||
        categoryMapping[normalizedCategory] !== undefined;

      if (!isValidCategory) {
        // Get suggestions for similar categories
        const allValidCategories = [
          ...sharedValidCategories,
          ...Object.keys(categoryMapping),
        ];

        const suggestions = allValidCategories
          .filter(
            (cat) =>
              cat.includes(normalizedCategory.substring(0, 3)) ||
              normalizedCategory.includes(cat.substring(0, 3))
          )
          .slice(0, 5);

        const suggestionText =
          suggestions.length > 0
            ? `\nDid you mean: ${suggestions.join(", ")}?`
            : "";

        errors.push(
          `Invalid category "${productForm.category}".` +
            `\nValid main categories: ${sharedValidCategories.join(", ")}` +
            `\nOr detailed categories like: Analgesics, Antibiotics, Vitamins, First Aid, Diagnostic Equipment, etc.${suggestionText}`
        );
      }
    }

    return errors;
  };

  const handleSaveProduct = async () => {
    const validationErrors = validateProductForm();
    if (validationErrors.length > 0) {
      console.log(validationErrors.join("\n"));
      alert(validationErrors.join("\n"));
      return;
    }

    if (!apiWrapper) return;

    try {
      // Map category using shared utility
      const mappedCategory = mapCategory(productForm.category);

      const productData = {
        ...productForm,
        category: mappedCategory,
        centerId: center.id,
        createdBy: user.id,
        updatedBy: user.id,
        sellingPrice:
          productForm.sellingPrice ||
          productForm.unitPrice * (1 + productForm.markupPercentage / 100),
        isActive: true,
      };

      const method = selectedProduct ? "PUT" : "POST";
      const url = selectedProduct
        ? `/api/centers/${center.id}/inventory/${selectedProduct.id}`
        : `/api/centers/${center.id}/inventory`;

      const result = await apiWrapper[method.toLowerCase() as "post" | "put"](
        url,
        productData
      );

      if (result.success) {
        if (result.data?._local || !isOnline) {
          // Update local state
          const updatedProducts = [...products];
          if (selectedProduct) {
            const index = updatedProducts.findIndex(
              (p) => p.id === selectedProduct.id
            );
            if (index !== -1) {
              updatedProducts[index] = {
                ...updatedProducts[index],
                ...productData,
                id: selectedProduct.id,
                _local: true,
              };
            }
          } else {
            const newProduct = {
              ...productData,
              id: result.data?.id || `local_${Date.now()}`,
              _local: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            updatedProducts.push(newProduct);
          }

          setProducts(updatedProducts);
          setFilteredProducts(updatedProducts);
          await saveLocalProducts(updatedProducts);

          alert(
            "Product saved offline. Will sync when connection is restored."
          );
        } else {
          // Reload from server
          await loadProducts();
        }

        setShowProductForm(false);
        setSelectedProduct(null);
        resetProductForm();
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert(error.message || "Failed to save product");
    }
  };

  const resetProductForm = () => {
    setProductForm({
      sku: "",
      barcode: generateBarcode(),
      barcodeType: "EAN13",
      name: "",
      genericName: "",
      brand: "",
      category: "",
      manufacturer: "",
      supplierId: "",
      supplierName: "",
      batchNumber: "",
      expiryDate: "",
      quantity: 0,
      unit: "tablets",
      unitPrice: 0,
      markupPercentage: 20,
      sellingPrice: 0,
      reorderLevel: 10,
      location: "Shelf A1",
      description: "",
      prescriptionRequired: false,
      isMedicalEquipment: false,
      equipmentType: "",
    });
  };

  const handleStockAdjustment = async () => {
    if (!stockAdjustment.productId) {
      alert("No product selected");
      return;
    }

    if (stockAdjustment.newQuantity < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    if (!stockAdjustment.reason.trim()) {
      alert("Reason for adjustment is required");
      return;
    }

    if (!apiWrapper) return;

    try {
      const updateData = {
        productId: stockAdjustment.productId,
        quantity: stockAdjustment.newQuantity,
        reason: stockAdjustment.reason,
        notes: stockAdjustment.notes,
      };

      const result = await apiWrapper.put(
        `/api/centers/${center.id}/inventory/${stockAdjustment.productId}`,
        updateData
      );

      if (result.success) {
        if (result.data?._local || !isOnline) {
          // Update local state
          const updatedProducts = [...products];
          const index = updatedProducts.findIndex(
            (p) => p.id === stockAdjustment.productId
          );
          if (index !== -1) {
            updatedProducts[index] = {
              ...updatedProducts[index],
              quantity: stockAdjustment.newQuantity,
              _local: true,
              updatedAt: new Date().toISOString(),
            };
            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);
            await saveLocalProducts(updatedProducts);
          }

          alert(
            "Stock adjustment saved offline. Will sync when connection is restored."
          );
        } else {
          await loadProducts();
        }

        setShowStockAdjustment(false);
        setStockAdjustment({
          productId: "",
          productName: "",
          currentQuantity: 0,
          newQuantity: 0,
          difference: 0,
          action: "ADJUSTMENT",
          reason: "",
          notes: "",
          unit: "",
        });
      }
    } catch (error: any) {
      console.log("Error adjusting stock:", error);
      alert(error.message || "Failed to adjust stock");
    }
  };

  const handleStockAdjustmentChange = (
    field: keyof StockAdjustmentData,
    value: string | number
  ) => {
    setStockAdjustment((prev) => {
      const updated = { ...prev, [field]: value } as StockAdjustmentData;

      if (field === "newQuantity") {
        const newQuantity = Number(value);
        updated.difference = newQuantity - prev.currentQuantity;
        updated.action =
          newQuantity > prev.currentQuantity ? "STOCK_IN" : "STOCK_OUT";
      }

      return updated;
    });
  };

  const handleBulkUpload = async (data: any[]) => {
    if (!apiWrapper) return;

    setUploadStatus("uploading");
    setUploadProgress(0);

    const totalProducts = data.length;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const categoryMapping: { [key: string]: string } = {
        analgesics: "medication",
        "analgesics & pain relief": "medication",
        antibiotics: "medication",
        antimalarials: "medication",
        antihypertensives: "medication",
        respiratory: "medication",
        "antacids/ppis": "medication",
        rehydration: "medication",
        sedatives: "medication",
        "antibiotics ophthalmic": "medication",
        antidiabetics: "medication",
        diabetes: "medication",
        antidepressants: "medication",
        antipsychotics: "medication",
        anticoagulants: "medication",
        bronchodilators: "medication",
        corticosteroids: "medication",
        diuretics: "medication",
        gastrointestinal: "medication",
        "hormones & contraceptives": "medication",
        immunosuppressants: "medication",
        "muscle relaxants": "medication",
        ophthalmic: "medication",
        "otic (ear)": "medication",
        topical: "medication",

        "diagnostic equipment": "equipment",
        "respiratory equipment": "equipment",
        "mobility equipment": "equipment",
        "sterilization equipment": "equipment",
        "surgical instruments": "equipment",
        "patient monitoring": "equipment",
        "mobility aids": "equipment",
        "laboratory equipment": "equipment",
        "dental supplies": "equipment",

        "first aid": "supplies",
        "first aid supplies": "supplies",
        "wound care": "supplies",
        "disposable medical supplies": "supplies",
        "personal protective equipment (ppe)": "supplies",

        antiseptics: "consumables",
        "skin care": "consumables",
        skincare: "consumables",
        "soaps & bath products": "consumables",
        "personal hygiene": "consumables",
        "hair care": "consumables",
        "oral care": "consumables",
        "baby care": "consumables",
        "feminine hygiene": "consumables",
        "men's grooming": "consumables",
        "deodorants & antiperspirants": "consumables",

        vaccines: "vaccine",
        vaccine: "vaccine",

        diagnostic: "diagnostic",

        surgical: "surgical",
        vitamins: "pharmaceutical",
        supplements: "pharmaceutical",
        "vitamins & supplements": "pharmaceutical",
        minerals: "pharmaceutical",
        "herbal & natural remedies": "pharmaceutical",
        "sports nutrition": "pharmaceutical",
        "weight management": "pharmaceutical",
        "probiotics & digestive health": "pharmaceutical",
        pharmaceutical: "pharmaceutical",
      };

      const validatedProducts = [];
      for (let i = 0; i < data.length; i++) {
        const product = { ...data[i] };
        const rowNumber = i + 1;

        if (!product.name || !product.category) {
          errors.push(`Row ${rowNumber}: Missing name or category`);
          failed++;
          continue;
        }

        if (product.quantity && product.quantity < 0) {
          errors.push(`Row ${rowNumber}: Quantity cannot be negative`);
          failed++;
          continue;
        }

        if (product.unitPrice && product.unitPrice <= 0) {
          errors.push(`Row ${rowNumber}: Unit price must be positive`);
          failed++;
          continue;
        }

        // Map category to valid one
        const originalCategory = product.category;
        const normalizedCategory = product.category.toLowerCase().trim();
        const mappedCategory =
          categoryMapping[normalizedCategory] || normalizedCategory;

        // Check if category is valid
        const validCategories = [
          "medication",
          "equipment",
          "supplies",
          "consumables",
          "vaccine",
          "diagnostic",
          "surgical",
          "pharmaceutical",
        ];

        if (
          !validCategories.includes(mappedCategory) &&
          !categoryMapping[normalizedCategory]
        ) {
          errors.push(
            `Row ${rowNumber}: Invalid category "${originalCategory}". Valid categories: ${validCategories.join(
              ", "
            )}`
          );
          failed++;
          continue;
        }

        // Update product with mapped category
        product.category = mappedCategory;
        validatedProducts.push(product);
      }

      if (errors.length > 0 && isOnline) {
        // Don't proceed if there are validation errors
        setUploadStatus("error");
        console.log(
          `Validation errors found:\n${errors.slice(0, 5).join("\n")}${
            errors.length > 5 ? `\n...and ${errors.length - 5} more` : ""
          }`
        );
        alert(
          `Validation errors found:\n${errors.slice(0, 5).join("\n")}${
            errors.length > 5 ? `\n...and ${errors.length - 5} more` : ""
          }`
        );
        return;
      }

      if (isOnline) {
        // Bulk upload online with mapped categories
        const uploadData = {
          products: validatedProducts.map((product) => ({
            ...product,
            centerId: center.id,
            createdBy: user.id,
            updatedBy: user.id,
            quantity: Number(product.quantity) || 0,
            unitPrice: Number(product.unitPrice) || 0,
            sellingPrice:
              product.sellingPrice ||
              (Number(product.unitPrice) || 0) *
                (1 + (product.markupPercentage || 0) / 100),
            isActive: true,
          })),
        };

        console.log("Sending bulk upload data:", {
          productCount: uploadData.products.length,
          sampleCategory: uploadData.products[0]?.category,
          sampleProduct: uploadData.products[0]?.name,
        });

        const response = await fetch(`/api/centers/${center.id}/inventory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify(uploadData),
        });

        // Log the response for debugging
        console.log("Upload response status:", response.status);

        const result = await response.json();
        console.log("Upload response:", result);

        // Handle different response scenarios
        if (response.status === 207) {
          // Partial success - some succeeded, some failed
          successful = result.data?.successful || 0;
          failed = result.data?.failed || 0;

          console.log(
            `Partial success: ${successful} successful, ${failed} failed`
          );

          if (result.data?.errors?.length > 0) {
            const errorMessages = result.data.errors
              .slice(0, 10)
              .map((e: any) => `Row ${e.row}: ${e.error} (SKU: ${e.sku})`)
              .join("\n");
            alert(
              `Upload partially completed: ${successful} successful, ${failed} failed\n\nErrors:\n${errorMessages}${
                result.data.errors.length > 10
                  ? `\n...and ${result.data.errors.length - 10} more`
                  : ""
              }`
            );
            console.log(
              `Upload partially completed: ${successful} successful, ${failed} failed\n\nErrors:\n${errorMessages}${
                result.data.errors.length > 10
                  ? `\n...and ${result.data.errors.length - 10} more`
                  : ""
              }`
            );
          } else if (successful > 0) {
            alert(
              `Upload completed: ${successful} products uploaded successfully`
            );
          }

          // Set status to success if any were successful
          setUploadStatus(successful > 0 ? "success" : "error");
        } else if (response.ok) {
          // Full success (200)
          successful = result.data?.successful || totalProducts;
          failed = result.data?.failed || 0;

          console.log(`Full success: ${successful} successful`);

          if (result.data?.errors?.length > 0) {
            const errorMessages = result.data.errors
              .slice(0, 5)
              .map((e: any) => `Row ${e.row}: ${e.error}`)
              .join("\n");
            alert(
              `Upload completed with ${failed} errors:\n${errorMessages}${
                result.data.errors.length > 5
                  ? `\n...and ${result.data.errors.length - 5} more`
                  : ""
              }`
            );
            console.log(
              `Upload completed with ${failed} errors:\n${errorMessages}${
                result.data.errors.length > 5
                  ? `\n...and ${result.data.errors.length - 5} more`
                  : ""
              }`
            );
          } else {
            alert(`All ${successful} products uploaded successfully.`);
          }

          setUploadStatus("success");
        } else {
          // Error (400, 500, etc.)
          const errorMsg =
            result.error || result.message || "Bulk upload failed";
          console.error("Upload failed details:", {
            status: response.status,
            error: errorMsg,
            result,
          });

          // Try to extract errors from result.data.errors
          if (result.data?.errors?.length > 0) {
            const errorMessages = result.data.errors
              .slice(0, 10)
              .map((e: any) => `Row ${e.row}: ${e.error}`)
              .join("\n");
            throw new Error(`Upload failed:\n${errorMessages}`);
          } else {
            throw new Error(errorMsg);
          }
        }
      } else {
        // Process individually offline
        for (let i = 0; i < validatedProducts.length; i++) {
          const product = validatedProducts[i];

          try {
            const productData = {
              ...product,
              centerId: center.id,
              createdBy: user.id,
              updatedBy: user.id,
              quantity: Number(product.quantity) || 0,
              unitPrice: Number(product.unitPrice) || 0,
              sellingPrice:
                product.sellingPrice ||
                (Number(product.unitPrice) || 0) *
                  (1 + (product.markupPercentage || 0) / 100),
              isActive: true,
            };

            // Save to local storage
            const updatedProducts = [...products];
            const newProduct = {
              ...productData,
              id: `local_${Date.now()}_${i}`,
              _local: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            updatedProducts.push(newProduct);

            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts);
            await saveLocalProducts(updatedProducts);

            successful++;
          } catch (error) {
            failed++;
            console.error(`Failed to process product ${i + 1}:`, error);
          }

          // Update progress
          setUploadProgress(((i + 1) / totalProducts) * 100);
        }

        setUploadStatus(successful > 0 ? "success" : "error");
      }

      // Reload products if online and successful
      if (isOnline && successful > 0) {
        await loadProducts();
      }

      // Auto-close after delay
      setTimeout(() => {
        setShowBulkUpload(false);
        setUploadStatus("idle");
        setUploadProgress(0);

        // Show final summary alert
        if (successful > 0 || failed > 0) {
          alert(
            `Bulk upload completed: ${successful} successful, ${failed} failed`
          );
          console.log(
            `Bulk upload summary: ${successful} successful, ${failed} failed`
          );
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error in bulk upload:", error);
      setUploadStatus("error");
      console.log("Bulk upload error details:", error.message);
      alert(`Bulk upload failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "sku",
      "name",
      "category",
      "quantity",
      "unitPrice",
      "sellingPrice",
      "barcode",
      "barcodeType",
      "genericName",
      "brand",
      "manufacturer",
      "supplierId",
      "supplierName",
      "batchNumber",
      "expiryDate",
      "unit",
      "markupPercentage",
      "reorderLevel",
      "location",
      "description",
      "prescriptionRequired",
      "isMedicalEquipment",
      "equipmentType",
    ];

    const exampleRows = [
      [
        "MED-PAR-001",
        "Paracetamol 500mg",
        "Analgesics",
        "100",
        "0.50",
        "0.60",
        generateBarcode(),
        "CUSTOM",
        "Acetaminophen",
        "BrandX",
        "Pharma Inc",
        "",
        "Supplier Name",
        "BATCH001",
        "2024-12-31",
        "tablets",
        "20",
        "20",
        "Shelf A1",
        "Pain reliever",
        "false",
        "false",
        "",
      ],
      [
        "EQP-DIA-002",
        "Digital Thermometer",
        "Diagnostic Equipment",
        "25",
        "8.00",
        "10.00",
        generateBarcode(),
        "EAN13",
        "",
        "MediTech",
        "Medical Devices Ltd",
        "",
        "Equipment Supplier",
        "LOT123",
        "2026-06-30",
        "pieces",
        "25",
        "5",
        "Cabinet C",
        "Digital thermometer",
        "false",
        "true",
        "diagnostic",
      ],
    ];

    const csvContent = [
      headers.join(","),
      ...exampleRows.map((row) => row.map((value) => `"${value}"`).join(",")),
      "",
      "CATEGORY EXAMPLES:",
      "Main categories: medication, equipment, supplies, consumables, vaccine, diagnostic, surgical, pharmaceutical",
      "Detailed categories (will be auto-mapped): Analgesics, Antibiotics, Antihypertensives, Vitamins, First Aid, Diagnostic Equipment, etc.",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template_with_category_examples.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBarcodeScan = (barcode: string, type: string) => {
    console.log("Scanned barcode:", barcode, type);

    const existingProduct = products.find((p) => p.barcode === barcode);

    if (existingProduct) {
      setStockAdjustment({
        productId: existingProduct.id,
        productName: existingProduct.name,
        currentQuantity: existingProduct.quantity,
        newQuantity: existingProduct.quantity,
        difference: 0,
        action: "ADJUSTMENT",
        reason: "",
        notes: `Scanned barcode: ${barcode}`,
        unit: existingProduct.unit,
      });
      setShowStockAdjustment(true);
    } else {
      setProductForm((prev) => ({
        ...prev,
        barcode,
        barcodeType: type as "EAN13" | "UPC" | "CODE128" | "QR" | "CUSTOM",
        sku: generateSKU("", `BC-${barcode}`),
        name: "",
      }));
      setSelectedProduct(null);
      setShowProductForm(true);
    }
    setShowScanner(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "scan_product":
        setShowScanner(true);
        break;
      case "generate_barcode":
        setProductForm((prev) => ({
          ...prev,
          barcode: generateBarcode(),
          barcodeType: "CUSTOM",
        }));
        if (!showProductForm) {
          setShowProductForm(true);
        }
        break;
      case "print_labels":
        setShowPrintLabels(true);
        break;
      case "low_stock_report":
        const lowStock = products.filter((p) => p.quantity <= p.reorderLevel);
        if (lowStock.length > 0) {
          alert(
            `Low Stock Report: ${
              lowStock.length
            } products need attention\n\nProducts:\n${lowStock
              .map((p) => `• ${p.name} (${p.quantity} ${p.unit})`)
              .join("\n")}`
          );
          console.log(
            `Low Stock Report: ${
              lowStock.length
            } products need attention\n\nProducts:\n${lowStock
              .map((p) => `• ${p.name} (${p.quantity} ${p.unit})`)
              .join("\n")}`
          );
        } else {
          alert("No low stock items found.");
        }
        break;
    }
  };

  useEffect(() => {
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term) ||
          product.genericName?.toLowerCase().includes(term) ||
          product.manufacturer?.toLowerCase().includes(term) ||
          product.barcode?.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    if (showLowStock) {
      filtered = filtered.filter(
        (product) => product.quantity <= product.reorderLevel
      );
    }

    if (showEquipment) {
      filtered = filtered.filter((product) => product.isMedicalEquipment);
    }

    if (showExpired) {
      filtered = filtered.filter((product) => {
        if (!product.expiryDate) return false;
        const expiry = new Date(product.expiryDate);
        return !isNaN(expiry.getTime()) && expiry < new Date();
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "quantity":
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case "sellingPrice":
          aValue = a.sellingPrice;
          bValue = b.sellingPrice;
          break;
        case "expiryDate":
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "name":
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [
    products,
    searchTerm,
    selectedCategory,
    showLowStock,
    showEquipment,
    showExpired,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (showScanner || showProductForm || showStockAdjustment) return;

    let barcode = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture alphanumeric keys
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        barcode += e.key;

        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
          if (barcode.length >= 6) {
            // Minimum barcode length
            console.log("Keyboard barcode detected:", barcode);

            // Dispatch global event for other components
            window.dispatchEvent(
              new CustomEvent("barcodeScanned", {
                detail: { barcode, type: "KEYBOARD" },
              })
            );

            const existingProduct = products.find((p) => p.barcode === barcode);
            if (existingProduct) {
              setStockAdjustment({
                productId: existingProduct.id,
                productName: existingProduct.name,
                currentQuantity: existingProduct.quantity,
                newQuantity: existingProduct.quantity,
                difference: 0,
                action: "ADJUSTMENT",
                reason: "",
                notes: `Keyboard scan: ${barcode}`,
                unit: existingProduct.unit,
              });
              setShowStockAdjustment(true);
            } else {
              setProductForm((prev) => ({
                ...prev,
                barcode,
                barcodeType: "CUSTOM",
                sku: generateSKU("", `BC-${barcode}`),
                name: "",
              }));
              setSelectedProduct(null);
              setShowProductForm(true);
            }
          }
          barcode = "";
        }, 100);
      }

      // Enter key can also trigger if we're building barcode
      if (e.key === "Enter" && barcode.length >= 3) {
        if (timeout) clearTimeout(timeout);
        // Process the barcode
        console.log("Enter pressed with barcode:", barcode);
        barcode = "";
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeout) clearTimeout(timeout);
    };
  }, [
    products,
    showScanner,
    showProductForm,
    showStockAdjustment,
    generateSKU,
  ]);

  useEffect(() => {
    const handleGlobalBarcodeScan = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { barcode, type } = customEvent.detail;

      console.log("Global barcode scan in InventoryPanel:", barcode, type);

      if (!showScanner && !showProductForm && !showStockAdjustment) {
        handleBarcodeScan(barcode, type || "CUSTOM");
      }
    };

    window.addEventListener("barcodeScanned", handleGlobalBarcodeScan);

    return () => {
      window.removeEventListener("barcodeScanned", handleGlobalBarcodeScan);
    };
  }, [showScanner, showProductForm, showStockAdjustment]);

  const handleEditProduct = (product: Product) => {
    const productWithLocal = product as ProductWithLocal;
    setSelectedProduct(productWithLocal);
    setProductForm({
      sku: product.sku,
      barcode: product.barcode || generateBarcode(),
      barcodeType: (product.barcodeType as any) || "CUSTOM",
      name: product.name,
      genericName: product.genericName || "",
      brand: product.brand || "",
      category: product.category,
      manufacturer: product.manufacturer || "",
      supplierId: product.supplierId || "",
      supplierName: product.supplierName || "",
      batchNumber: product.batchNumber || "",
      expiryDate: product.expiryDate || "",
      quantity: product.quantity,
      unit: product.unit,
      unitPrice: product.unitPrice,
      markupPercentage: product.markupPercentage || 20,
      sellingPrice:
        product.sellingPrice ||
        product.unitPrice * (1 + (product.markupPercentage || 20) / 100),
      reorderLevel: product.reorderLevel,
      location: product.location || "Shelf A1",
      description: product.description || "",
      prescriptionRequired: product.prescriptionRequired || false,
      isMedicalEquipment: product.isMedicalEquipment || false,
      equipmentType: product.equipmentType || "",
    });
    setShowProductForm(true);
  };

  const handleAdjustStock = (product: Product) => {
    setStockAdjustment({
      productId: product.id,
      productName: product.name,
      currentQuantity: product.quantity,
      newQuantity: product.quantity,
      difference: 0,
      action: "ADJUSTMENT",
      reason: "",
      notes: "",
      unit: product.unit,
    });
    setShowStockAdjustment(true);
  };

  const handleViewAuditLogs = async (productId: string) => {
    if (!apiWrapper) return;

    try {
      setSelectedProductId(productId);
      const product = products.find((p) => p.id === productId);
      setSelectedProduct(product || null);

      console.log(`Loading audit logs for product: ${productId}`);

      // Try different endpoints
      const endpoints = [
        `/api/centers/${center.id}/inventory/${productId}/audit`,
        `/api/centers/${center.id}/inventory-audit?productId=${productId}`,
        `/api/centers/${center.id}/audit-logs?productId=${productId}`,
      ];

      let result = null;
      for (const endpoint of endpoints) {
        try {
          const response = await apiWrapper.get(endpoint);
          if (response.success) {
            result = response;
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed, trying next...`);
        }
      }

      if (result?.success) {
        setAuditLogs(result.data || []);
        setShowAuditLogs(true);
      } else {
        // Show mock data or empty state
        setAuditLogs([]);
        setShowAuditLogs(true);
        console.log("No audit logs endpoint found, showing empty state");
      }
    } catch (error: any) {
      console.error("Error loading audit logs:", error);
      setAuditLogs([]);
      setShowAuditLogs(true);
    }
  };

  const handleAddProduct = () => {
    setProductForm({
      sku: generateSKU(),
      barcode: generateBarcode(),
      barcodeType: "CUSTOM",
      name: "",
      genericName: "",
      brand: "",
      category: "",
      manufacturer: "",
      supplierId: "",
      supplierName: "",
      batchNumber: "",
      expiryDate: "",
      quantity: 0,
      unit: "tablets",
      unitPrice: 0,
      markupPercentage: 20,
      sellingPrice: 0,
      reorderLevel: 10,
      location: "Shelf A1",
      description: "",
      prescriptionRequired: false,
      isMedicalEquipment: false,
      equipmentType: "",
    });
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleForceSync = async () => {
    if (apiWrapper && isOnline) {
      try {
        // Show loading
        setLoading(true);

        if (apiWrapper.forceSync) {
          await apiWrapper.forceSync();
        }

        // Reload data
        await loadAllData();
        alert("Sync completed successfully!");
      } catch (error) {
        console.error("Sync failed:", error);
        alert("Sync failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Supplier form handlers
  const handleSupplierFormChange = (
    field: keyof SupplierFormData,
    value: string
  ) => {
    setSupplierForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSupplier = async () => {
    if (!apiWrapper) return;

    try {
      const supplierData = {
        ...supplierForm,
        centerId: center.id,
      };

      const method = selectedSupplier ? "PUT" : "POST";
      const url = selectedSupplier
        ? `/api/centers/${center.id}/suppliers/${selectedSupplier.id}`
        : `/api/centers/${center.id}/suppliers`;

      const result = await apiWrapper[method.toLowerCase() as "post" | "put"](
        url,
        supplierData
      );

      if (result.success) {
        await loadSuppliers();
        setShowSupplierForm(false);
        setSelectedSupplier(null);
        setSupplierForm({
          code: "",
          name: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          paymentTerms: "",
          notes: "",
        });
      }
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      alert(error.message || "Failed to save supplier");
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    const supplierWithLocal = supplier as SupplierWithLocal;
    setSelectedSupplier(supplierWithLocal);
    setSupplierForm({
      code: supplier.code || "",
      name: supplier.name || "",
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      paymentTerms: supplier.paymentTerms || "",
      notes: supplier.notes || "",
    });
    setShowSupplierForm(true);
    setShowSuppliers(false);
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setSupplierForm({
      code: `SUP-${Date.now().toString().slice(-6)}`,
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      paymentTerms: "Net 30",
      notes: "",
    });
    setShowSupplierForm(true);
    setShowSuppliers(false);
  };

  const handlePrintLabels = (
    selectedProducts: Product[],
    labelSize: string,
    copies: number,
    includeQR: boolean,
    includeBarcode: boolean,
    includeExpiry: boolean,
    includePrice: boolean
  ) => {
    console.log("Print Labels Request:", {
      selectedProducts: selectedProducts.length,
      labelSize,
      copies,
      includeQR,
      includeBarcode,
      includeExpiry,
      includePrice,
    });

    // Generate label content
    const labelContent = selectedProducts.map((product) => ({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      expiryDate: product.expiryDate,
      price: product.sellingPrice,
    }));

    // Create printable content
    const printableContent = `
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .label { 
                border: 1px dashed #ccc; 
                padding: 10px; 
                margin: 5px; 
                display: inline-block;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          ${labelContent
            .map(
              (product, index) => `
            <div class="label">
              <h3>${product.name}</h3>
              <p><strong>SKU:</strong> ${product.sku}</p>
              ${
                includeBarcode && product.barcode
                  ? `<p><strong>Barcode:</strong> ${product.barcode}</p>`
                  : ""
              }
              ${
                includeExpiry && product.expiryDate
                  ? `<p><strong>Expiry:</strong> ${formatDate(
                      product.expiryDate
                    )}</p>`
                  : ""
              }
              ${
                includePrice
                  ? `<p><strong>Price:</strong> ${formatCurrency(
                      product.price
                    )}</p>`
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printableContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  // Offline Status Indicator Component
  const OfflineStatusIndicator = () => {
    if (isOnline && offlineStats.pendingOperations === 0) return null;

    return (
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            {!isOnline ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  You're offline
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  Online
                </span>
              </>
            )}

            {offlineStats.pendingOperations > 0 && (
              <div className="ml-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {offlineStats.pendingOperations} pending
              </div>
            )}

            {offlineStats.localProducts > 0 && (
              <div className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                {offlineStats.localProducts} local
              </div>
            )}

            <button
              onClick={handleForceSync}
              className="ml-4 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              disabled={!isOnline}
            >
              Sync Now
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // Update offline stats periodically
  useEffect(() => {
    const updateStats = () => {
      const localProducts = products.filter((p) => p._local).length;
      const pendingOperations = 0; // You would calculate this from your ApiWrapper

      setOfflineStats({
        pendingOperations,
        localProducts,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <OfflineStatusIndicator />
      <div className="max-w-7xl mx-auto space-y-4 p-3 sm:p-4 md:p-6">
        <InventoryHeader
          onOpenSuppliers={() => setShowSuppliers(true)}
          onOpenScanner={() => setShowScanner(true)}
          onOpenBulkUpload={() => setShowBulkUpload(true)}
          onAddProduct={handleAddProduct}
          onGenerateBarcode={() => handleQuickAction("generate_barcode")}
        />

        <QuickActions
          onScanProduct={() => handleQuickAction("scan_product")}
          onGenerateBarcode={() => handleQuickAction("generate_barcode")}
          onPrintLabels={() => handleQuickAction("print_labels")}
          onLowStockReport={() => handleQuickAction("low_stock_report")}
        />

        <StatisticsCards
          statistics={statistics}
          suppliersCount={suppliers.length}
          barcodedCount={products.filter((p) => p.barcode).length}
        />

        <InventoryFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          showLowStock={showLowStock}
          setShowLowStock={setShowLowStock}
          showEquipment={showEquipment}
          setShowEquipment={setShowEquipment}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          categories={categories}
          onRefresh={loadAllData}
          onOpenScanner={() => setShowScanner(true)}
        />

        <ProductTable
          products={products}
          filteredProducts={filteredProducts}
          loading={loading}
          onEditProduct={handleEditProduct}
          onAdjustStock={handleAdjustStock}
          onViewAuditLogs={handleViewAuditLogs}
          onOpenScanner={() => setShowScanner(true)}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStockStatusColor={getStockStatusColor}
          getExpiryStatus={getExpiryStatus}
        />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showProductForm && (
          <ProductFormModal
            key="product-form"
            productForm={productForm}
            suppliers={suppliers}
            selectedProduct={selectedProduct}
            onClose={() => {
              setShowProductForm(false);
              setSelectedProduct(null);
              resetProductForm();
            }}
            onSave={handleSaveProduct}
            onFormChange={handleProductFormChange}
            onGenerateBarcode={() => {
              setProductForm((prev) => ({
                ...prev,
                barcode: generateBarcode(),
                barcodeType: "CUSTOM",
              }));
            }}
          />
        )}

        {showStockAdjustment && (
          <StockAdjustmentModal
            key="stock-adjustment"
            stockAdjustment={stockAdjustment}
            onClose={() => setShowStockAdjustment(false)}
            onSave={handleStockAdjustment}
            onAdjustmentChange={handleStockAdjustmentChange}
          />
        )}

        {showScanner && (
          <ScannerModal
            key="scanner"
            onClose={() => setShowScanner(false)}
            onScan={handleBarcodeScan}
            onManualEntry={(barcode: string) => {
              handleBarcodeScan(barcode, "CUSTOM");
              setShowScanner(false);
            }}
          />
        )}

        {showBulkUpload && (
          <BulkUploadModal
            key="bulk-upload"
            onClose={() => {
              setShowBulkUpload(false);
              setUploadStatus("idle");
              setUploadProgress(0);
            }}
            onUpload={handleBulkUpload}
            centerId={center.id}
            onDownloadTemplate={handleDownloadTemplate}
          />
        )}

        {showAuditLogs && (
          <AuditLogsModal
            key="audit-logs"
            auditLogs={auditLogs}
            selectedProduct={selectedProduct}
            selectedProductId={selectedProductId}
            onClose={() => {
              setShowAuditLogs(false);
              setSelectedProductId(null);
            }}
          />
        )}

        {showSuppliers && (
          <SupplierModal
            key="suppliers"
            suppliers={suppliers}
            onClose={() => setShowSuppliers(false)}
            onAddSupplier={handleAddSupplier}
            onEditSupplier={handleEditSupplier}
          />
        )}

        {showSupplierForm && (
          <SupplierFormModal
            key="supplier-form"
            supplierForm={supplierForm}
            selectedSupplier={selectedSupplier}
            onClose={() => {
              setShowSupplierForm(false);
              setSelectedSupplier(null);
              setSupplierForm({
                code: "",
                name: "",
                contactPerson: "",
                phone: "",
                email: "",
                address: "",
                city: "",
                state: "",
                paymentTerms: "",
                notes: "",
              });
            }}
            onSave={handleSaveSupplier}
            onFormChange={handleSupplierFormChange}
          />
        )}

        {showPrintLabels && (
          <PrintLabelsModal
            key="print-labels"
            products={products}
            center={center}
            onClose={() => setShowPrintLabels(false)}
            onPrint={handlePrintLabels}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPanel;
