// app/center/utils/salesUtils.ts
import { Sale, SaleItem } from "../types/pharmacy";

export const calculateSaleTotals = (sale: Sale): Sale => {
  let subTotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;

  // Calculate item-level totals
  const updatedItems = sale.items.map((item) => {
    const itemQuantity = item.quantity || 0;
    const itemUnitPrice = item.unitPrice || 0;
    const itemDiscountPercentage = item.discountPercentage || 0;
    const itemTaxPercentage = item.taxPercentage || 7.5;

    const itemSubtotal = itemQuantity * itemUnitPrice;
    const itemDiscountAmount = (itemSubtotal * itemDiscountPercentage) / 100;
    const itemTaxableAmount = itemSubtotal - itemDiscountAmount;
    const itemTaxAmount = sale.taxEnabled
      ? (itemTaxableAmount * itemTaxPercentage) / 100
      : 0;
    const itemTotal = itemSubtotal - itemDiscountAmount + itemTaxAmount;

    subTotal += itemSubtotal;
    discountAmount += itemDiscountAmount;
    taxAmount += itemTaxAmount;

    return {
      ...item,
      subtotal: itemSubtotal,
      discountAmount: itemDiscountAmount,
      taxAmount: itemTaxAmount,
      total: itemTotal,
    };
  });

  const totalAmount = subTotal - discountAmount + taxAmount;
  const changeAmount = Math.max(0, (sale.amountPaid || 0) - totalAmount);

  return {
    ...sale,
    items: updatedItems,
    subTotal,
    discountAmount,
    taxAmount,
    totalAmount,
    changeAmount,
  };
};

export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₦0.00";
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const validateSale = (
  sale: Sale
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (sale.items.length === 0) {
    errors.push("Sale must contain at least one item");
  }

  if ((sale.totalAmount || 0) <= 0) {
    errors.push("Total amount must be greater than 0");
  }

  // Validate each item
  sale.items.forEach((item, index) => {
    if (!item.productId) {
      errors.push(`Item ${index + 1}: Product ID is required`);
    }
    if ((item.quantity || 0) <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    }
    if ((item.unitPrice || 0) <= 0) {
      errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createSaleItemFromProduct = (
  product: any,
  saleId: string
): SaleItem => {
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    productId: product.id,
    saleId,
    sku: product.sku || "N/A",
    name: product.name || "Unknown Product",
    quantity: 1,
    unitPrice: product.sellingPrice || product.unitPrice || 0,
    markupPercentage: product.markupPercentage || 0,
    sellingPrice: product.sellingPrice || product.unitPrice || 0,
    discountPercentage: 0,
    discountAmount: 0,
    subtotal: product.sellingPrice || product.unitPrice || 0,
    taxPercentage: 7.5,
    taxAmount: 0,
    total: product.sellingPrice || product.unitPrice || 0,
    batchNumber: product.batchNumber || "",
    expiryDate: product.expiryDate || "",
  };
};

export const generateSaleNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SALE${year}${month}${day}${random}`;
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};
