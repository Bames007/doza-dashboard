// app/center/hooks/useProducts.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product } from "../types/pharmacy";
import { ApiWrapper } from "@/app/utils/apiWrapper";

export const useProducts = (
  centerId: string,
  userId: string,
  apiWrapper: ApiWrapper | null
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeString = (value: any): string => {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    try {
      return String(value).trim();
    } catch {
      return "";
    }
  };

  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined || value === "")
      return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : Math.max(0, num);
  };

  const safeBoolean = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const str = value.toLowerCase().trim();
      return str === "true" || str === "1" || str === "yes" || str === "y";
    }
    if (typeof value === "number") return value !== 0;
    return Boolean(value);
  };

  const safeDate = (value: any): string => {
    if (!value) return new Date().toISOString();
    try {
      const date = new Date(value);
      return isNaN(date.getTime())
        ? new Date().toISOString()
        : date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const safeBarcodeType = (
    value: any
  ): "EAN13" | "UPC" | "CODE128" | "QR" | "CUSTOM" => {
    const str = safeString(value).toUpperCase();
    if (["EAN13", "UPC", "CODE128", "QR", "CUSTOM"].includes(str)) {
      return str as any;
    }
    return "CUSTOM";
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log("🔍 Loading products for center:", centerId);

    try {
      let result;

      if (apiWrapper) {
        result = await apiWrapper.get(`/api/centers/${centerId}/inventory`);
      } else {
        const response = await fetch(`/api/centers/${centerId}/inventory`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch products: ${response.status} ${response.statusText}`
          );
        }

        result = await response.json();
      }

      console.log("📦 Raw API response:", result);

      let productsData: any[] = [];

      if (result && result.success !== false) {
        if (result.data?.products && Array.isArray(result.data.products)) {
          productsData = result.data.products;
        } else if (Array.isArray(result.data)) {
          productsData = result.data;
        } else if (
          result.data &&
          typeof result.data === "object" &&
          !Array.isArray(result.data)
        ) {
          productsData = Object.entries(result.data).map(([key, value]) => ({
            id: key,
            ...(value as any),
          }));
        } else if (Array.isArray(result)) {
          productsData = result;
        } else if (result.data && typeof result.data === "object") {
          productsData = [result.data];
        } else {
          console.warn("Unexpected API response structure:", result);
          productsData = [];
        }
      } else {
        throw new Error(
          result?.error || result?.message || "API request failed"
        );
      }

      console.log("✅ Raw products data:", productsData.length, "items");

      const validatedProducts: Product[] = [];

      for (const rawProduct of productsData) {
        try {
          if (
            !rawProduct ||
            typeof rawProduct !== "object" ||
            Array.isArray(rawProduct)
          ) {
            console.warn("Skipping invalid product:", rawProduct);
            continue;
          }

          // Skip explicitly inactive products (only skip if isActive is explicitly false)
          if (rawProduct.isActive === false) {
            console.log(
              "Skipping inactive product:",
              rawProduct.id || rawProduct.name
            );
            continue;
          }

          const productId = safeString(
            rawProduct.id ||
              rawProduct.productId ||
              `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );

          const product: Product = {
            id: productId,
            centerId: safeString(rawProduct.centerId || centerId),
            sku: safeString(
              rawProduct.sku || `SKU-${productId.substring(0, 8)}`
            ),
            name: safeString(rawProduct.name) || "Unknown Product",
            genericName: safeString(rawProduct.genericName),
            brand: safeString(rawProduct.brand),
            category: safeString(rawProduct.category) || "Uncategorized",
            manufacturer:
              safeString(rawProduct.manufacturer) || "Unknown Manufacturer",
            batchNumber: safeString(rawProduct.batchNumber || "N/A"),
            expiryDate: safeDate(rawProduct.expiryDate),
            quantity: safeNumber(rawProduct.quantity),
            unit: safeString(rawProduct.unit) || "units",
            unitPrice: safeNumber(rawProduct.unitPrice),
            markupPercentage: safeNumber(rawProduct.markupPercentage, 20),
            sellingPrice:
              safeNumber(rawProduct.sellingPrice) ||
              safeNumber(rawProduct.unitPrice) *
                (1 + safeNumber(rawProduct.markupPercentage, 20) / 100),
            reorderLevel: safeNumber(rawProduct.reorderLevel, 10),
            location: safeString(rawProduct.location) || "Main Storage",
            description: safeString(rawProduct.description),
            prescriptionRequired: safeBoolean(rawProduct.prescriptionRequired),
            isActive: rawProduct.isActive !== false, // Default to true if not specified
            createdAt: safeDate(rawProduct.createdAt),
            updatedAt: safeDate(rawProduct.updatedAt),
            createdBy: safeString(rawProduct.createdBy || userId),
            updatedBy: safeString(rawProduct.updatedBy || userId),

            // Optional fields with defaults
            barcode: safeString(rawProduct.barcode),
            barcodeType: safeBarcodeType(rawProduct.barcodeType),
            supplierId: safeString(rawProduct.supplierId),
            supplierName: safeString(rawProduct.supplierName),
            isMedicalEquipment: safeBoolean(rawProduct.isMedicalEquipment),
            equipmentType: safeString(rawProduct.equipmentType),
            weight: safeNumber(rawProduct.weight),
            dimensions: safeString(rawProduct.dimensions),
            warrantyPeriod: safeString(rawProduct.warrantyPeriod),
            serviceRequired: safeBoolean(rawProduct.serviceRequired),
            serviceInterval: safeString(rawProduct.serviceInterval),
            lastServiceDate: safeDate(rawProduct.lastServiceDate),

            // Copy any other properties that might exist (excluding ones we've already handled)
            ...Object.keys(rawProduct).reduce((acc, key) => {
              const excludedKeys = [
                "id",
                "productId",
                "centerId",
                "sku",
                "name",
                "genericName",
                "brand",
                "category",
                "manufacturer",
                "batchNumber",
                "expiryDate",
                "quantity",
                "unit",
                "unitPrice",
                "markupPercentage",
                "sellingPrice",
                "reorderLevel",
                "location",
                "description",
                "prescriptionRequired",
                "isActive",
                "createdAt",
                "updatedAt",
                "createdBy",
                "updatedBy",
                "barcode",
                "barcodeType",
                "supplierId",
                "supplierName",
                "isMedicalEquipment",
                "equipmentType",
                "weight",
                "dimensions",
                "warrantyPeriod",
                "serviceRequired",
                "serviceInterval",
                "lastServiceDate",
              ];

              if (
                !excludedKeys.includes(key) &&
                rawProduct[key] !== undefined
              ) {
                acc[key] = rawProduct[key];
              }
              return acc;
            }, {} as Record<string, any>),
          };

          // Ensure selling price is never less than unit price
          if (product.sellingPrice < product.unitPrice) {
            product.sellingPrice =
              product.unitPrice * (1 + product.markupPercentage / 100);
          }

          validatedProducts.push(product);
        } catch (productError: any) {
          console.error(
            "Error processing individual product:",
            productError,
            rawProduct
          );
          // Create a minimal valid product for error cases
          const errorProduct: Product = {
            id: `error_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            centerId: centerId,
            sku: "ERROR",
            name: safeString(rawProduct?.name) || "Error Product",
            category: "error",
            manufacturer: "System",
            batchNumber: "N/A",
            expiryDate: new Date().toISOString(),
            quantity: 0,
            unit: "units",
            unitPrice: 0,
            markupPercentage: 0,
            sellingPrice: 0,
            reorderLevel: 10,
            location: "Error Shelf",
            description: "This product had an error during processing",
            prescriptionRequired: false,
            isActive: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: userId,
            updatedBy: userId,
          };
          validatedProducts.push(errorProduct);
        }
      }

      console.log("✅ Validated products:", validatedProducts.length);

      // Sort by name for better UX
      const sortedProducts = [...validatedProducts].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);

      // Cache in localStorage for offline use
      try {
        localStorage.setItem(
          `products_${centerId}`,
          JSON.stringify(sortedProducts)
        );
        localStorage.setItem(
          `products_${centerId}_timestamp`,
          Date.now().toString()
        );
      } catch (storageError) {
        console.warn("Could not cache products:", storageError);
      }
    } catch (error: any) {
      console.error("❌ Error loading products:", error);
      setError(error.message || "Failed to load products");

      // Try to load from cache
      try {
        const cached = localStorage.getItem(`products_${centerId}`);
        if (cached) {
          const cachedProducts = JSON.parse(cached);
          setProducts(cachedProducts);
          setFilteredProducts(cachedProducts);
          console.log("📦 Loaded products from cache:", cachedProducts.length);
        } else {
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (cacheError) {
        console.error("❌ Error loading cached products:", cacheError);
        setProducts([]);
        setFilteredProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [centerId, userId, apiWrapper]);

  // Update product quantity locally
  const updateProductQuantity = useCallback(
    (productId: string, quantitySold: number) => {
      console.log(
        `🔄 Updating product ${productId} quantity by -${quantitySold}`
      );

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product.id === productId) {
            const currentQty = product.quantity || 0;
            const newQuantity = Math.max(0, currentQty - quantitySold);
            console.log(`📊 ${product.name}: ${currentQty} → ${newQuantity}`);
            return { ...product, quantity: newQuantity };
          }
          return product;
        })
      );

      setFilteredProducts((prevProducts) =>
        prevProducts.map((product) => {
          if (product.id === productId) {
            const currentQty = product.quantity || 0;
            const newQuantity = Math.max(0, currentQty - quantitySold);
            return { ...product, quantity: newQuantity };
          }
          return product;
        })
      );
    },
    []
  );

  // Get available count for a specific product
  const getAvailableProductCount = useCallback(
    (productId: string): number => {
      const product = products.find((p) => p.id === productId);
      const count = product ? product.quantity || 0 : 0;
      console.log(`📊 Available count for ${productId}: ${count}`);
      return count;
    },
    [products]
  );

  const handleProductSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setError("Please enter a barcode, SKU, or product name");
        return null;
      }

      console.log("🔍 Searching for product:", term);

      try {
        // First, search in already loaded products
        const foundInCache = products.find(
          (product) =>
            product.barcode === term ||
            product.sku === term ||
            product.name?.toLowerCase().includes(term.toLowerCase())
        );

        if (foundInCache) {
          console.log("✅ Found product in cache:", foundInCache.name);
          return foundInCache;
        }

        // If not found in cache, search via API
        console.log("🔍 Searching via API...");
        const response = await fetch(
          `/api/centers/${centerId}/inventory?search=${encodeURIComponent(
            term
          )}&limit=1`,
          {
            headers: {
              "x-user-id": userId,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const result = await response.json();
        console.log("🔍 API search result:", result);

        let productData = null;

        if (result.success) {
          // Extract product from different response structures
          if (
            result.data?.products &&
            Array.isArray(result.data.products) &&
            result.data.products.length > 0
          ) {
            productData = result.data.products[0];
          } else if (
            result.data &&
            Array.isArray(result.data) &&
            result.data.length > 0
          ) {
            productData = result.data[0];
          } else if (
            result.data &&
            typeof result.data === "object" &&
            result.data.id
          ) {
            productData = result.data;
          }
        }

        if (productData) {
          console.log("✅ Found product via API:", productData.name);

          // Create validated product from API response
          return {
            id:
              safeString(productData.id || productData.productId) ||
              `product_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            centerId: safeString(productData.centerId || centerId),
            sku: safeString(
              productData.sku || `SKU-${Date.now().toString().slice(-6)}`
            ),
            name: safeString(productData.name) || "Unknown Product",
            genericName: safeString(productData.genericName),
            brand: safeString(productData.brand),
            category: safeString(productData.category) || "other",
            manufacturer:
              safeString(productData.manufacturer) || "Unknown Manufacturer",
            batchNumber: safeString(productData.batchNumber || "N/A"),
            expiryDate: safeDate(productData.expiryDate),
            quantity: safeNumber(productData.quantity),
            unit: safeString(productData.unit) || "units",
            unitPrice: safeNumber(productData.unitPrice),
            markupPercentage: safeNumber(productData.markupPercentage, 20),
            sellingPrice:
              safeNumber(productData.sellingPrice) ||
              safeNumber(productData.unitPrice) *
                (1 + safeNumber(productData.markupPercentage, 20) / 100),
            reorderLevel: safeNumber(productData.reorderLevel, 10),
            location: safeString(productData.location) || "Shelf A1",
            description: safeString(productData.description),
            prescriptionRequired: safeBoolean(productData.prescriptionRequired),
            isActive: productData.isActive !== false,
            createdAt: safeDate(productData.createdAt),
            updatedAt: safeDate(productData.updatedAt),
            createdBy: safeString(productData.createdBy || userId),
            updatedBy: safeString(productData.updatedBy || userId),
            barcode: safeString(productData.barcode),
            barcodeType: safeBarcodeType(productData.barcodeType),
            supplierId: safeString(productData.supplierId),
            supplierName: safeString(productData.supplierName),
            isMedicalEquipment: safeBoolean(productData.isMedicalEquipment),
            equipmentType: safeString(productData.equipmentType),
            weight: safeNumber(productData.weight),
            dimensions: safeString(productData.dimensions),
            warrantyPeriod: safeString(productData.warrantyPeriod),
            serviceRequired: safeBoolean(productData.serviceRequired),
            serviceInterval: safeString(productData.serviceInterval),
            lastServiceDate: safeDate(productData.lastServiceDate),
          } as Product;
        }

        // Product not found
        console.log("❌ Product not found:", term);
        setError(`Product not found: ${term}`);
        return null;
      } catch (error: any) {
        console.error("Error searching product:", error);
        setError(error.message || "Failed to search for product");
        return null;
      }
    },
    [centerId, userId, products]
  );

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      setError(null);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = products.filter((product) => {
      if (!product.isActive) return false;

      // Search across multiple fields
      const searchableFields = [
        product.name,
        product.sku,
        product.genericName,
        product.barcode,
        product.category,
        product.description,
        product.brand,
        product.manufacturer,
        product.batchNumber,
      ];

      return searchableFields.some(
        (field) => field && field.toString().toLowerCase().includes(term)
      );
    });

    console.log("🔍 Filtered products:", filtered.length);
    setFilteredProducts(filtered);

    if (filtered.length === 0 && searchTerm.trim()) {
      setError("No products found matching your search");
    } else {
      setError(null);
    }
  }, [searchTerm, products]);

  // Get count of available products (for display)
  const getAvailableProductCountNumber = useMemo(() => {
    return products.filter((p) => p.isActive && (p.quantity || 0) > 0).length;
  }, [products]);

  // Get total product value
  const getTotalInventoryValue = useMemo(() => {
    return products.reduce((total, product) => {
      if (product.isActive) {
        const quantity = product.quantity || 0;
        const cost = product.unitPrice || product.sellingPrice || 0;
        return total + quantity * cost;
      }
      return total;
    }, 0);
  }, [products]);

  // Get low stock products (below reorder level)
  const getLowStockProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.isActive &&
        (p.quantity || 0) > 0 &&
        (p.quantity || 0) < (p.reorderLevel || 10)
    );
  }, [products]);

  // Get out of stock products
  const getOutOfStockProducts = useMemo(() => {
    return products.filter((p) => p.isActive && (p.quantity || 0) <= 0);
  }, [products]);

  // Get expiring soon products (within 30 days)
  const getExpiringSoonProducts = useMemo(() => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return products.filter((p) => {
      if (!p.isActive || !p.expiryDate) return false;

      try {
        const expiryDate = new Date(p.expiryDate);
        const today = new Date();
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
      } catch {
        return false;
      }
    });
  }, [products]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setFilteredProducts(products);
    setError(null);
  }, [products]);

  // Refresh products
  const refreshProducts = useCallback(() => {
    return loadProducts();
  }, [loadProducts]);

  // Add a new product locally (for immediate UI update)
  const addProductLocally = useCallback((newProduct: Product) => {
    setProducts((prev) => {
      const updated = [newProduct, ...prev].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return updated;
    });
    setFilteredProducts((prev) => {
      const updated = [newProduct, ...prev].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      return updated;
    });
  }, []);

  // Update a product locally
  const updateProductLocally = useCallback((updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setFilteredProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  }, []);

  // Remove a product locally
  const removeProductLocally = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setFilteredProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  return {
    products,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    loadProducts,
    handleProductSearch,
    getAvailableProductCount, // Function that takes productId and returns count
    getAvailableProductCountNumber, // Number of available products
    getTotalInventoryValue,
    getLowStockProducts,
    getOutOfStockProducts,
    getExpiringSoonProducts,
    clearSearch,
    refreshProducts,
    addProductLocally,
    updateProductLocally,
    removeProductLocally,
    updateProductQuantity, // Added function
  };
};
