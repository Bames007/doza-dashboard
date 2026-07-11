"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Download,
  CheckCircle,
  X,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Papa from "papaparse";

interface BulkUploadModalProps {
  onClose: () => void;
  onUpload: (data: any[]) => Promise<void>;
  onDownloadTemplate: () => void;
  centerId: string;
}

interface ProductRow {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  sellingPrice?: number;
  barcode?: string;
  isMedicalEquipment?: boolean;
  expiryDate?: string;
  lotNumber?: string;
  supplier?: string;
  [key: string]: any; // Allow dynamic properties
}

export const BulkUploadModal = ({
  onClose,
  onUpload,
  onDownloadTemplate,
  centerId,
}: BulkUploadModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [allProducts, setAllProducts] = useState<ProductRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState({
    totalValue: 0,
    itemCount: 0,
    categories: new Map<string, number>(),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Define valid categories (the 8 that backend accepts)
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

  // COMPLETE Category Mapping - maps detailed categories to valid ones
  const categoryMapping: { [key: string]: string } = {
    // ===== MEDICATION CATEGORIES =====
    analgesics: "medication",
    "analgesics & pain relief": "medication",
    "analgesics and pain relief": "medication",
    antibiotics: "medication",
    antimalarials: "medication",
    antihypertensives: "medication",
    respiratory: "medication",
    "antacids/ppis": "medication",
    antacids: "medication",
    ppis: "medication",
    rehydration: "medication",
    sedatives: "medication",
    "antibiotics ophthalmic": "medication",
    "ophthalmic antibiotics": "medication",
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
    hormones: "medication",
    contraceptives: "medication",
    immunosuppressants: "medication",
    "muscle relaxants": "medication",
    "muscle relaxers": "medication",
    ophthalmic: "medication",
    "eye drops": "medication",
    "otic (ear)": "medication",
    "ear drops": "medication",
    otic: "medication",
    topical: "medication",
    "topical creams": "medication",

    // ===== EQUIPMENT CATEGORIES =====
    "diagnostic equipment": "equipment",
    "respiratory equipment": "equipment",
    "mobility equipment": "equipment",
    "sterilization equipment": "equipment",
    "surgical instruments": "equipment",
    "patient monitoring": "equipment",
    "mobility aids": "equipment",
    "laboratory equipment": "equipment",
    "dental supplies": "equipment",
    "dental equipment": "equipment",
    "medical equipment": "equipment",
    "hospital equipment": "equipment",

    // ===== SUPPLIES CATEGORIES =====
    "first aid": "supplies",
    "first aid supplies": "supplies",
    "wound care": "supplies",
    "wound dressing": "supplies",
    "disposable medical supplies": "supplies",
    disposables: "supplies",
    "personal protective equipment (ppe)": "supplies",
    ppe: "supplies",
    "medical supplies": "supplies",

    // ===== CONSUMABLES CATEGORIES =====
    antiseptics: "consumables",
    "skin care": "consumables",
    skincare: "consumables",
    "soaps & bath products": "consumables",
    soaps: "consumables",
    "bath products": "consumables",
    "personal hygiene": "consumables",
    "hair care": "consumables",
    shampoo: "consumables",
    "oral care": "consumables",
    toothpaste: "consumables",
    toothbrush: "consumables",
    "baby care": "consumables",
    "baby products": "consumables",
    "feminine hygiene": "consumables",
    "sanitary pads": "consumables",
    "men's grooming": "consumables",
    "deodorants & antiperspirants": "consumables",
    deodorants: "consumables",
    antiperspirants: "consumables",

    // ===== VACCINE CATEGORY =====
    vaccines: "vaccine",
    vaccine: "vaccine",
    immunizations: "vaccine",

    // ===== DIAGNOSTIC CATEGORY =====
    diagnostic: "diagnostic",
    "diagnostic tests": "diagnostic",
    "test kits": "diagnostic",

    // ===== SURGICAL CATEGORY =====
    surgical: "surgical",
    "surgical supplies": "surgical",

    // ===== PHARMACEUTICAL CATEGORIES =====
    vitamins: "pharmaceutical",
    supplements: "pharmaceutical",
    "vitamins & supplements": "pharmaceutical",
    "vitamins and supplements": "pharmaceutical",
    minerals: "pharmaceutical",
    "herbal & natural remedies": "pharmaceutical",
    "herbal remedies": "pharmaceutical",
    "natural remedies": "pharmaceutical",
    "sports nutrition": "pharmaceutical",
    "protein powder": "pharmaceutical",
    "weight management": "pharmaceutical",
    "weight loss": "pharmaceutical",
    "probiotics & digestive health": "pharmaceutical",
    probiotics: "pharmaceutical",
    "digestive health": "pharmaceutical",
    pharmaceutical: "pharmaceutical",

    // ===== SPECIALIZED PHARMACY =====
    "veterinary medicines": "pharmaceutical",
    veterinary: "pharmaceutical",
    dermatologicals: "pharmaceutical",
    dermatology: "pharmaceutical",
    oncology: "pharmaceutical",
    "cancer drugs": "pharmaceutical",
    cardiology: "pharmaceutical",
    "heart medications": "pharmaceutical",
    neurology: "pharmaceutical",
    neurological: "pharmaceutical",
    psychiatry: "pharmaceutical",
    psychiatric: "pharmaceutical",

    // ===== PROVISION STORE ITEMS =====
    beverages: "consumables",
    drinks: "consumables",
    "snacks & confectionery": "consumables",
    snacks: "consumables",
    confectionery: "consumables",
    "canned foods": "consumables",
    "canned goods": "consumables",
    "dairy products": "consumables",
    dairy: "consumables",
    "grains & cereals": "consumables",
    grains: "consumables",
    cereals: "consumables",
    "spices & condiments": "consumables",
    spices: "consumables",
    condiments: "consumables",
    "household cleaning": "supplies",
    "cleaning supplies": "supplies",
    "pet care": "consumables",
    "pet supplies": "consumables",

    // ===== OTHER CATEGORIES =====
    "medical books & references": "supplies",
    "medical books": "supplies",
    "pharmacy accessories": "supplies",
    accessories: "supplies",
    "seasonal items": "consumables",
    "promotional items": "consumables",
    "custom/other": "pharmaceutical",
    custom: "pharmaceutical",
    other: "pharmaceutical",
    miscellaneous: "pharmaceutical",

    // ===== ORIGINAL 8 CATEGORIES (map to themselves) =====
    medication: "medication",
    equipment: "equipment",
    supplies: "supplies",
    consumables: "consumables",
  };

  // Helper function to map category
  const mapCategory = (userCategory: string): string => {
    if (!userCategory) return "medication"; // Default

    const normalizedCategory = userCategory.toLowerCase().trim();

    // If already a valid category, return as is
    if (validCategories.includes(normalizedCategory)) {
      return normalizedCategory;
    }

    // Map from detailed to valid category
    return categoryMapping[normalizedCategory] || "medication"; // Default to medication
  };

  // Helper function to check if a category is accepted
  const isAcceptedCategory = (category: string): boolean => {
    if (!category) return false;

    const normalizedCategory = category.toLowerCase().trim();

    return (
      validCategories.includes(normalizedCategory) ||
      categoryMapping[normalizedCategory] !== undefined
    );
  };

  // Get suggestions for invalid categories
  const getCategorySuggestions = (
    invalidCategory: string,
    limit: number = 3
  ): string[] => {
    const normalized = invalidCategory.toLowerCase();
    const allKeys = [...validCategories, ...Object.keys(categoryMapping)];

    // Find similar categories
    return allKeys
      .filter((cat) => {
        const catLower = cat.toLowerCase();
        return (
          catLower.includes(normalized.substring(0, 3)) ||
          normalized.includes(catLower.substring(0, 3)) ||
          catLower.split(" ").some((word) => normalized.includes(word)) ||
          normalized.split(" ").some((word) => catLower.includes(word))
        );
      })
      .slice(0, limit);
  };

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = allProducts.slice(indexOfFirstRow, indexOfLastRow);

  // Load existing SKUs to prevent duplicates
  useEffect(() => {
    if (centerId) {
      checkExistingSkus();
    }
  }, [centerId]);

  const checkExistingSkus = async () => {
    try {
      const response = await fetch(
        `/api/centers/${centerId}/inventory?limit=1000`
      );
      const data = await response.json();
      if (data.success) {
        const skus = new Set<string>(
          data.data.products.map((p: any) => p.sku as string)
        );
        setExistingSkus(skus);
      }
    } catch (error) {
      console.error("Failed to load existing products:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // File size limit (50MB - increased for larger files)
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrors([`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`]);
      return;
    }

    // File type validation
    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Please select a CSV file"]);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setCurrentPage(1); // Reset to first page

    // Parse CSV with proper handling
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          const parsingErrors = results.errors.map(
            (error) =>
              `Row ${error.row !== undefined ? error.row + 1 : "unknown"}: ${
                error.message
              }`
          );
          setErrors(parsingErrors);
          return;
        }

        const data = results.data as ProductRow[];

        // Increased row limit for larger uploads
        const MAX_ROWS = 10000;
        if (data.length > MAX_ROWS) {
          setErrors([
            `File has too many rows (${data.length}). Maximum is ${MAX_ROWS}.`,
          ]);
          return;
        }

        // Validate and process all data
        const validationErrors = validateData(data);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        } else {
          // Map categories for all products
          const mappedData = data.map((row) => ({
            ...row,
            category: mapCategory(row.category), // Apply category mapping
          }));

          setAllProducts(mappedData);
          calculateSummary(mappedData);
        }
      },
      error: (error: Error) => {
        setErrors([`CSV parsing failed: ${error.message}`]);
      },
    });
  };

  const calculateSummary = (data: ProductRow[]) => {
    let totalValue = 0;
    const categories = new Map<string, number>();

    data.forEach((row) => {
      const quantity = Number(row.quantity) || 0;
      const unitPrice = Number(row.unitPrice) || 0;
      totalValue += quantity * unitPrice;

      const category = row.category?.toLowerCase() || "uncategorized";
      categories.set(category, (categories.get(category) || 0) + 1);
    });

    setSummary({
      totalValue,
      itemCount: data.length,
      categories,
    });
  };

  const validateData = (data: ProductRow[]): string[] => {
    const errors: string[] = [];
    const seenSkus = new Set<string>();

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      const requiredFields = [
        { field: "sku", value: row.sku },
        { field: "name", value: row.name },
        { field: "category", value: row.category },
        { field: "quantity", value: row.quantity },
        { field: "unitPrice", value: row.unitPrice },
      ];

      requiredFields.forEach(({ field, value }) => {
        if (!value || value.toString().trim() === "") {
          errors.push(`Row ${rowNum}: Missing required field "${field}"`);
        }
      });

      // SKU validation
      if (row.sku) {
        const sku = row.sku.trim().toUpperCase();
        if (seenSkus.has(sku)) {
          errors.push(`Row ${rowNum}: Duplicate SKU "${sku}" in upload file`);
        }
        if (existingSkus.has(sku)) {
          errors.push(
            `Row ${rowNum}: SKU "${sku}" already exists in inventory`
          );
        }
        seenSkus.add(sku);
      }

      // Category validation with mapping support
      if (row.category) {
        if (!isAcceptedCategory(row.category)) {
          const suggestions = getCategorySuggestions(row.category, 3);
          const suggestionText =
            suggestions.length > 0
              ? ` Did you mean: ${suggestions.join(", ")}?`
              : "";

          errors.push(
            `Row ${rowNum}: Invalid category "${row.category}".${suggestionText} ` +
              `Valid main categories: ${validCategories.join(", ")}. ` +
              `Or detailed categories like: Analgesics, Antibiotics, Vitamins, First Aid, Diagnostic Equipment, etc.`
          );
        }
      }

      // Numeric validation
      if (
        row.quantity &&
        (isNaN(Number(row.quantity)) || Number(row.quantity) < 0)
      ) {
        errors.push(`Row ${rowNum}: Quantity must be a positive number`);
      }

      if (
        row.unitPrice &&
        (isNaN(Number(row.unitPrice)) || Number(row.unitPrice) <= 0)
      ) {
        errors.push(`Row ${rowNum}: Unit price must be a positive number`);
      }

      // Medical equipment specific validation
      if (
        row.isMedicalEquipment === true ||
        String(row.isMedicalEquipment).toLowerCase() === "true"
      ) {
        if (!row.lotNumber && !row.barcode) {
          errors.push(
            `Row ${rowNum}: Medical equipment requires either lot number or barcode`
          );
        }
      }

      // Expiry date validation
      if (row.expiryDate) {
        const expiry = new Date(row.expiryDate);
        if (isNaN(expiry.getTime())) {
          errors.push(
            `Row ${rowNum}: Invalid expiry date format. Use YYYY-MM-DD`
          );
        } else if (expiry < new Date()) {
          errors.push(`Row ${rowNum}: Expiry date is in the past`);
        }
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (!file || errors.length > 0) return;

    setStatus("uploading");
    setProgress(0);

    try {
      // Read and parse file
      const text = await file.text();

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data as ProductRow[];

          // Validate again before upload
          const validationErrors = validateData(data);
          if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setStatus("error");
            return;
          }

          // Prepare data for API - map categories
          const products = data.map((row) => ({
            ...row,
            category: mapCategory(row.category), // Apply category mapping
            centerId,
            quantity: Number(row.quantity),
            unitPrice: Number(row.unitPrice),
            sellingPrice: row.sellingPrice
              ? Number(row.sellingPrice)
              : undefined,
            isMedicalEquipment:
              row.isMedicalEquipment === true ||
              String(row.isMedicalEquipment).toLowerCase() === "true",
          }));

          // Simulate progress
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 90) {
                clearInterval(interval);
                return prev;
              }
              return prev + 10;
            });
          }, 300);

          // Call API
          await onUpload(products);

          clearInterval(interval);
          setProgress(100);
          setStatus("success");

          // Auto-close after 2 seconds
          setTimeout(() => {
            onClose();
          }, 2000);
        },
        error: (error: Error) => {
          setErrors([`Upload failed: ${error.message}`]);
          setStatus("error");
        },
      });
    } catch (error: any) {
      setErrors([`Upload failed: ${error.message}`]);
      setStatus("error");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);

      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: fileInputRef.current } as any);
      }
    } else {
      setErrors(["Please drop a CSV file only"]);
    }
  };

  // Enhanced download template with proper categories
  const handleEnhancedDownloadTemplate = () => {
    // Create a CSV template with proper headers
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

    // Example rows with various valid categories
    const exampleRows = [
      // Medication examples
      [
        "MED-PAR-001",
        "Paracetamol 500mg",
        "Analgesics",
        "100",
        "0.50",
        "0.60",
        "BC001",
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
        "MED-AMP-002",
        "Amoxicillin 250mg",
        "Antibiotics",
        "50",
        "1.20",
        "1.50",
        "BC002",
        "CUSTOM",
        "Amoxicillin",
        "BrandY",
        "Pharma Corp",
        "",
        "Supplier B",
        "BATCH002",
        "2024-10-31",
        "capsules",
        "25",
        "10",
        "Shelf B2",
        "Antibiotic",
        "true",
        "false",
        "",
      ],
      // Equipment example
      [
        "EQP-DIA-003",
        "Digital Thermometer",
        "Diagnostic Equipment",
        "25",
        "8.00",
        "10.00",
        "BC003",
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
      // Pharmaceutical example
      [
        "PHA-VIT-004",
        "Vitamin C 1000mg",
        "Vitamins",
        "200",
        "0.80",
        "1.00",
        "BC004",
        "CUSTOM",
        "Ascorbic Acid",
        "HealthPlus",
        "Nutrition Corp",
        "",
        "Supplier C",
        "BATCH004",
        "2025-08-31",
        "tablets",
        "25",
        "30",
        "Shelf D3",
        "Immune support",
        "false",
        "false",
        "",
      ],
    ];

    // Get all accepted categories for documentation
    const allAcceptedCategories = [
      ...validCategories,
      ...Object.keys(categoryMapping),
    ]
      .filter((cat, index, self) => self.indexOf(cat) === index) // Remove duplicates
      .sort();

    const csvContent = [
      headers.join(","),
      ...exampleRows.map((row) => row.map((value) => `"${value}"`).join(",")),
      "",
      "=== CATEGORY INFORMATION ===",
      "Main categories (8 accepted by backend):",
      ...validCategories.map((cat) => `# ${cat}`),
      "",
      "Detailed categories (will be auto-mapped):",
      ...Object.keys(categoryMapping)
        .filter((cat) => !validCategories.includes(cat))
        .sort()
        .map((cat) => `# ${cat} → ${categoryMapping[cat]}`),
      "",
      "=== IMPORTANT NOTES ===",
      "1. Categories are case-insensitive",
      "2. Detailed categories are automatically mapped to main categories",
      "3. Example: 'Analgesics' becomes 'medication', 'Diagnostic Equipment' becomes 'equipment'",
      "4. If category is not recognized, it defaults to 'medication'",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template_with_categories.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstRow + 1}</span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(indexOfLastRow, allProducts.length)}
            </span>{" "}
            of <span className="font-medium">{allProducts.length}</span>{" "}
            products
          </span>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-4 border text-gray-600 border-gray-300 rounded-md text-sm py-1 px-2"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-300 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-gray-300 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[32px] h-8 px-2 text-sm rounded-md ${
                  currentPage === page
                    ? "bg-green-600 text-white"
                    : "border text-gray-400 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}
            {endPage < totalPages && (
              <>
                <span className="mx-1">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`min-w-[32px] h-8 px-2 text-sm text-gray-400 rounded-md border border-gray-300 hover:bg-gray-50`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border text-gray-400 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border text-gray-400 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bulk Upload Medical Inventory
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload CSV file with product data for Center #{centerId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              disabled={status === "uploading"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Area with Drag & Drop */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              file
                ? "border-emerald-300 bg-emerald-50"
                : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
            } ${status === "uploading" ? "cursor-wait" : "cursor-pointer"}`}
            onClick={() => status === "idle" && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".csv"
              className="hidden"
              disabled={status === "uploading"}
            />

            {status === "uploading" ? (
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 text-lg">
                    Uploading {file?.name}
                  </p>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing...</span>
                    <span className="font-medium text-emerald-700">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>
            ) : status === "success" ? (
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    Upload Successful!
                  </p>
                  <p className="text-gray-600 mt-1">
                    {allProducts.length} products added to inventory
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Closing in 2 seconds...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-900 text-lg mb-2">
                  {file ? file.name : "Drag & drop CSV file or click to browse"}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Supports .csv files up to 50MB with product information
                </p>

                {file && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 rounded-lg">
                    <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(file.size / 1024)} KB • {allProducts.length}{" "}
                        products
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary Stats */}
          {file && allProducts.length > 0 && status === "idle" && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Total Items</p>
                <p className="text-2xl font-bold text-blue-900">
                  {summary.itemCount}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">
                  Inventory Value
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ${summary.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">
                  Categories
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {summary.categories.size}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {Array.from(summary.categories.entries())
                    .slice(0, 3)
                    .map(([cat, count]) => `${cat} (${count})`)
                    .join(", ")}
                  {summary.categories.size > 3 ? "..." : ""}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-700 font-medium">
                  Pages ({rowsPerPage}/page)
                </p>
                <p className="text-2xl font-bold text-amber-900">
                  {totalPages}
                </p>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-red-800">
                      {errors.length} Validation Error
                      {errors.length !== 1 ? "s" : ""}
                    </p>
                    <button
                      onClick={() => setErrors([])}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {errors.slice(0, 10).map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 rounded hover:bg-red-100"
                      >
                        <span className="text-xs font-mono bg-red-200 text-red-800 px-1.5 py-0.5 rounded">
                          {index + 1}
                        </span>
                        <span className="text-sm text-red-700 flex-1">
                          {error}
                        </span>
                      </div>
                    ))}
                    {errors.length > 10 && (
                      <div className="text-xs text-red-600 text-center py-2">
                        ... and {errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview with Pagination */}
          {file &&
            allProducts.length > 0 &&
            status === "idle" &&
            errors.length === 0 && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Preview {allProducts.length} Products
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Categories are auto-mapped for upload)
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Showing page {currentPage} of {totalPages}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      Scroll horizontally to see all columns →
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        {/* Show mapped category in preview */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Row
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Selling Price
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentRows.map((row, rowIndex) => {
                        const actualIndex = indexOfFirstRow + rowIndex;
                        const originalCategory = row.category;
                        const mappedCategory = mapCategory(originalCategory);

                        return (
                          <tr
                            key={rowIndex}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100">
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {actualIndex + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100 font-mono">
                              {row.sku || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100">
                              {row.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100">
                              <div className="flex flex-col">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-1">
                                  {mappedCategory}
                                </span>
                                {originalCategory.toLowerCase() !==
                                  mappedCategory && (
                                  <span className="text-xs text-gray-500">
                                    from: {originalCategory}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100">
                              {row.quantity || 0}
                            </td>
                            <td className="px-4 py-3 text-gray-700 border-r border-gray-100">
                              ₦{Number(row.unitPrice || 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              ₦
                              {Number(
                                row.sellingPrice || row.unitPrice || 0
                              ).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {renderPagination()}
              </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* Category Mapping Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">
                    Category Auto-Mapping Information:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        Examples of Mapping:
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex justify-between">
                          <span>Analgesics →</span>
                          <span className="font-semibold">medication</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Diagnostic Equipment →</span>
                          <span className="font-semibold">equipment</span>
                        </li>
                        <li className="flex justify-between">
                          <span>First Aid →</span>
                          <span className="font-semibold">supplies</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Vitamins →</span>
                          <span className="font-semibold">pharmaceutical</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-800 mb-1">
                        Backend Accepts Only:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {validCategories.map((cat) => (
                          <span
                            key={cat}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEnhancedDownloadTemplate}
                disabled={status === "uploading"}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>

              {status === "idle" && (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || errors.length > 0}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Upload {allProducts.length} Products
                  </button>
                </>
              )}

              {status === "success" && (
                <button
                  onClick={onClose}
                  className="flex-1 bg-emerald-600 text-white py-3.5 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Done
                </button>
              )}

              {status === "error" && (
                <button
                  onClick={() => {
                    setStatus("idle");
                    setErrors([]);
                  }}
                  className="flex-1 bg-red-600 text-white py-3.5 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
