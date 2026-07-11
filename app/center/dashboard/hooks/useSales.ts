// app/center/hooks/useSales.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { Center, User as UserType } from "@/app/center/type";
import { Sale, SaleItem, Customer } from "../types/pharmacy";
import { ApiWrapper } from "@/app/utils/apiWrapper";

interface PaymentDetails {
  amountPaid: number;
  paymentMethod:
    | "CASH"
    | "CARD"
    | "TRANSFER"
    | "POS"
    | "INSURANCE"
    | "DOZA_TAB";
  reference: string;
}

interface CompleteSaleParams {
  selectedCustomer: Customer | null;
  selectedDozaUser: any;
  paymentDetails: PaymentDetails;
  onSuccess: () => void;
}

interface UseSalesProps {
  center: Center;
  user: UserType;
  apiWrapper: ApiWrapper | null;
  updateProductQuantity: (productId: string, quantitySold: number) => void;
  getAvailableProductCount: (productId: string) => number;
}

const generateSaleNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SALE${year}${month}${day}${random}`;
};

export const useSales = ({
  center,
  user,
  apiWrapper,
  updateProductQuantity,
  getAvailableProductCount,
}: UseSalesProps) => {
  const [activeSales, setActiveSales] = useState<Sale[]>([
    {
      id: `sale_${Date.now()}`,
      saleNumber: generateSaleNumber(),
      centerId: center.id,
      soldBy: user.id,
      soldByName:
        user.fullName ||
        `${user.fullName}`.trim() ||
        user.email?.split("@")[0] ||
        "Staff",
      customerType: "REGULAR",
      items: [],
      subTotal: 0,
      discountAmount: 0,
      taxEnabled: false,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      changeAmount: 0,
      paymentMethod: "CASH",
      paymentReference: "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: "",
    },
  ]);

  const [selectedSaleIndex, setSelectedSaleIndex] = useState<number>(0);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    amountPaid: 0,
    paymentMethod: "CASH",
    reference: "",
  });

  // Current sale is the selected sale
  const currentSale = activeSales[selectedSaleIndex] || activeSales[0];

  // Create new sale
  const handleNewSale = useCallback(() => {
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      saleNumber: generateSaleNumber(),
      centerId: center.id,
      soldBy: user.id,
      soldByName:
        user.fullName ||
        `${user.fullName}`.trim() ||
        user.email?.split("@")[0] ||
        "Staff",
      customerType: "REGULAR",
      items: [],
      subTotal: 0,
      discountAmount: 0,
      taxEnabled: false,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      changeAmount: 0,
      paymentMethod: "CASH",
      paymentReference: "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: "",
    };

    setActiveSales((prev) => {
      const newSales = [...prev, newSale];
      setSelectedSaleIndex(newSales.length - 1);
      return newSales;
    });

    setPaymentDetails({
      amountPaid: 0,
      paymentMethod: "CASH",
      reference: "",
    });
  }, [center.id, user]);

  // Delete sale
  const handleDeleteSale = useCallback((index: number) => {
    setActiveSales((prev) => {
      const newSales = prev.filter((_, i) => i !== index);

      setSelectedSaleIndex((prevIndex) => {
        if (prevIndex === index) {
          return Math.max(0, prevIndex - 1);
        } else if (prevIndex > index) {
          return prevIndex - 1;
        }
        return prevIndex;
      });

      return newSales;
    });
  }, []);

  // Calculate sale totals
  const calculateSaleTotals = useCallback((sale: Sale): Sale => {
    let subTotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

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
    const saleAmountPaid = sale.amountPaid || 0;
    const changeAmount = Math.max(0, saleAmountPaid - totalAmount);

    return {
      ...sale,
      items: updatedItems,
      subTotal,
      discountAmount,
      taxAmount,
      totalAmount,
      changeAmount,
    };
  }, []);

  // Add product to cart with stock check
  const handleAddProduct = useCallback(
    (product: any) => {
      if (!product || !product.id) {
        console.error("❌ Invalid product");
        return;
      }

      const availableStock = getAvailableProductCount(product.id);
      if (availableStock <= 0) {
        alert(`❌ ${product.name} is out of stock!`);
        return;
      }

      setActiveSales((prev) => {
        const newSales = [...prev];
        const currentSale = { ...newSales[selectedSaleIndex] };

        // Check if product already exists in cart
        const existingItemIndex = currentSale.items.findIndex(
          (item) => item.productId === product.id
        );

        if (existingItemIndex >= 0) {
          const updatedItems = [...currentSale.items];
          const existingItem = updatedItems[existingItemIndex];

          // Check if we can add more
          const currentCartQuantity = existingItem.quantity || 0;
          if (currentCartQuantity >= availableStock) {
            alert(
              `❌ Cannot add more. Only ${availableStock} items left in stock.`
            );
            return prev;
          }

          const newQuantity = currentCartQuantity + 1;
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
          };

          currentSale.items = updatedItems;
        } else {
          // Add new item
          const newItem: SaleItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: product.id,
            saleId: currentSale.id,
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

          currentSale.items = [...currentSale.items, newItem];
        }

        const updatedSale = calculateSaleTotals(currentSale);
        newSales[selectedSaleIndex] = updatedSale;
        return newSales;
      });
    },
    [selectedSaleIndex, calculateSaleTotals, getAvailableProductCount]
  );

  // Update item quantity with stock check
  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      setActiveSales((prev) => {
        const newSales = [...prev];
        const currentSale = { ...newSales[selectedSaleIndex] };

        const item = currentSale.items.find((item) => item.id === itemId);
        if (!item) return prev;

        const availableStock = getAvailableProductCount(item.productId);
        const requestedQuantity = Math.max(0, quantity);

        if (requestedQuantity > availableStock) {
          alert(
            `❌ Cannot set quantity to ${requestedQuantity}. Only ${availableStock} items left in stock.`
          );
          return prev;
        }

        const updatedItems = currentSale.items
          .map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                quantity: requestedQuantity,
              };
            }
            return item;
          })
          .filter((item) => (item.quantity || 0) > 0);

        const updatedSale = {
          ...currentSale,
          items: updatedItems,
        };

        newSales[selectedSaleIndex] = calculateSaleTotals(updatedSale);
        return newSales;
      });
    },
    [selectedSaleIndex, calculateSaleTotals, getAvailableProductCount]
  );

  // Remove item from sale
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      setActiveSales((prev) => {
        const newSales = [...prev];
        const currentSale = { ...newSales[selectedSaleIndex] };

        const updatedItems = currentSale.items.filter(
          (item) => item.id !== itemId
        );
        const updatedSale = {
          ...currentSale,
          items: updatedItems,
        };

        newSales[selectedSaleIndex] = calculateSaleTotals(updatedSale);
        return newSales;
      });
    },
    [selectedSaleIndex, calculateSaleTotals]
  );

  // Apply discount to item
  const handleApplyDiscount = useCallback(
    (itemId: string, discountPercentage: number) => {
      setActiveSales((prev) => {
        const newSales = [...prev];
        const currentSale = { ...newSales[selectedSaleIndex] };

        const updatedItems = currentSale.items.map((item) => {
          if (item.id === itemId) {
            const discountPct = Math.min(100, Math.max(0, discountPercentage));
            return {
              ...item,
              discountPercentage: discountPct,
            };
          }
          return item;
        });

        const updatedSale = {
          ...currentSale,
          items: updatedItems,
        };

        newSales[selectedSaleIndex] = calculateSaleTotals(updatedSale);
        return newSales;
      });
    },
    [selectedSaleIndex, calculateSaleTotals]
  );

  // Toggle tax
  const handleToggleTax = useCallback(() => {
    setActiveSales((prev) => {
      const newSales = [...prev];
      const currentSale = { ...newSales[selectedSaleIndex] };

      const updatedSale = {
        ...currentSale,
        taxEnabled: !currentSale.taxEnabled,
      };

      newSales[selectedSaleIndex] = calculateSaleTotals(updatedSale);
      return newSales;
    });
  }, [selectedSaleIndex, calculateSaleTotals]);

  // Update payment details
  const updatePaymentDetails = useCallback(
    (details: PaymentDetails) => {
      setPaymentDetails(details);

      setActiveSales((prev) => {
        const newSales = [...prev];
        const currentSale = { ...newSales[selectedSaleIndex] };

        const updatedSale = {
          ...currentSale,
          paymentMethod: details.paymentMethod,
          paymentReference: details.reference,
          amountPaid: details.amountPaid,
        };

        newSales[selectedSaleIndex] = calculateSaleTotals(updatedSale);
        return newSales;
      });
    },
    [selectedSaleIndex, calculateSaleTotals]
  );

  const resetCurrentSale = useCallback(() => {
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      saleNumber: generateSaleNumber(),
      centerId: center.id,
      soldBy: user.id,
      soldByName:
        user.fullName ||
        `${user.fullName}`.trim() ||
        user.email?.split("@")[0] ||
        "Staff",
      customerType: "REGULAR",
      items: [],
      subTotal: 0,
      discountAmount: 0,
      taxEnabled: false,
      taxAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      changeAmount: 0,
      paymentMethod: "CASH",
      paymentReference: "",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: "",
    };

    setActiveSales((prev) => {
      const newSales = [...prev];
      newSales[selectedSaleIndex] = newSale;
      return newSales;
    });

    setPaymentDetails({
      amountPaid: 0,
      paymentMethod: "CASH",
      reference: "",
    });
  }, [center.id, user, selectedSaleIndex]);

  const handleCompleteSale = useCallback(
    async ({
      selectedCustomer,
      selectedDozaUser,
      paymentDetails: salePaymentDetails,
      onSuccess,
    }: CompleteSaleParams) => {
      if (!apiWrapper) {
        throw new Error("API wrapper not initialized");
      }

      if (currentSale.items.length === 0) {
        throw new Error("Sale must contain at least one item");
      }

      // Check stock availability before proceeding
      const validateStockAvailability = async () => {
        const issues: string[] = [];
        currentSale.items.forEach((item) => {
          const availableStock = getAvailableProductCount(item.productId);
          if (availableStock < (item.quantity || 0)) {
            issues.push(
              `${item.name}: Available ${availableStock}, Requested ${item.quantity}`
            );
          }
        });
        return issues;
      };

      const stockIssues = await validateStockAvailability();
      if (stockIssues.length > 0) {
        throw new Error(`Insufficient stock:\n${stockIssues.join("\n")}`);
      }

      try {
        const saleForCalculation: Sale = {
          ...currentSale,
          paymentMethod: salePaymentDetails.paymentMethod,
          paymentReference: salePaymentDetails.reference,
          amountPaid: salePaymentDetails.amountPaid,
          status: "COMPLETED",
          updatedAt: new Date().toISOString(),
          ...(selectedCustomer && {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.fullName,
            customerPhone: selectedCustomer.phone,
          }),
          ...(selectedDozaUser && {
            dozaUserId: selectedDozaUser.id,
          }),
          customerType: selectedDozaUser
            ? "DOZA_USER"
            : selectedCustomer
            ? "REGULAR"
            : "REGULAR",
        };

        const calculatedSale = calculateSaleTotals(saleForCalculation);

        const apiData: any = {
          ...calculatedSale,
          customerId: selectedCustomer?.id || undefined,
          customerName: selectedCustomer?.fullName || undefined,
          customerPhone: selectedCustomer?.phone || undefined,
          dozaUserId: selectedDozaUser?.id || undefined,
          customerType: selectedDozaUser
            ? "DOZA_USER"
            : selectedCustomer
            ? "REGULAR"
            : "REGULAR",
        };

        const cleanApiData = Object.fromEntries(
          Object.entries(apiData).filter(([_, value]) => value !== undefined)
        );

        console.log("🔄 Submitting sale to API...", cleanApiData);
        const result = await apiWrapper.post(
          `/api/centers/${center.id}/sales`,
          cleanApiData
        );

        if (result.success) {
          console.log(
            "✅ Sale completed successfully, updating local stock..."
          );

          currentSale.items.forEach((item) => {
            if (item.productId && item.quantity) {
              updateProductQuantity(item.productId, item.quantity);
            }
          });

          setActiveSales((prev) => {
            const newSales = [...prev];
            const completedSale: Sale = {
              ...apiData,
              id: result.data?.id || apiData.id,
              saleNumber: result.data?.saleNumber || apiData.saleNumber,
              status: "COMPLETED",
            };
            newSales[selectedSaleIndex] = completedSale;
            return newSales;
          });
          resetCurrentSale();
          onSuccess();
          return result;
        } else {
          if (result._local) {
            const localSale: Sale = {
              ...apiData,
              status: "COMPLETED",
            };

            currentSale.items.forEach((item) => {
              if (item.productId && item.quantity) {
                updateProductQuantity(item.productId, item.quantity);
              }
            });

            setActiveSales((prev) => {
              const newSales = [...prev];
              newSales[selectedSaleIndex] = localSale;
              return newSales;
            });

            resetCurrentSale();
            onSuccess();
            return { success: true, data: localSale, _local: true };
          }

          throw new Error(result.error || "Failed to complete sale");
        }
      } catch (error: any) {
        console.error("❌ Error completing sale:", error);

        const offlineSale: Sale = {
          ...currentSale,
          paymentMethod: salePaymentDetails.paymentMethod,
          paymentReference: salePaymentDetails.reference,
          amountPaid: salePaymentDetails.amountPaid,
          status: "COMPLETED",
          updatedAt: new Date().toISOString(),
          ...(selectedCustomer && {
            customerId: selectedCustomer.id,
            customerName: selectedCustomer.fullName,
            customerPhone: selectedCustomer.phone,
          }),
          ...(selectedDozaUser && {
            dozaUserId: selectedDozaUser.id,
          }),
          customerType: selectedDozaUser
            ? "DOZA_USER"
            : selectedCustomer
            ? "REGULAR"
            : "REGULAR",
        };

        const calculatedOfflineSale = calculateSaleTotals(offlineSale);

        // Update local stock for offline sale
        currentSale.items.forEach((item) => {
          if (item.productId && item.quantity) {
            updateProductQuantity(item.productId, item.quantity);
          }
        });

        setActiveSales((prev) => {
          const newSales = [...prev];
          newSales[selectedSaleIndex] = calculatedOfflineSale;
          return newSales;
        });

        resetCurrentSale();

        onSuccess();
        return { success: true, data: calculatedOfflineSale, _local: true };
      }
    },
    [
      apiWrapper,
      center.id,
      currentSale,
      selectedSaleIndex,
      calculateSaleTotals,
      updateProductQuantity,
      getAvailableProductCount,
      resetCurrentSale,
    ]
  );

  useEffect(() => {
    if (activeSales.length > 0 && selectedSaleIndex >= 0) {
      const sale = activeSales[selectedSaleIndex];
      if (sale && sale.items.length > 0) {
        const updatedSale = calculateSaleTotals(sale);
        if (
          updatedSale.subTotal !== sale.subTotal ||
          updatedSale.totalAmount !== sale.totalAmount ||
          updatedSale.changeAmount !== sale.changeAmount
        ) {
          setActiveSales((prev) => {
            const newSales = [...prev];
            newSales[selectedSaleIndex] = updatedSale;
            return newSales;
          });
        }
      }
    }
  }, [activeSales, selectedSaleIndex, calculateSaleTotals]);

  return {
    activeSales,
    selectedSaleIndex,
    currentSale,
    paymentDetails,
    handleNewSale,
    handleDeleteSale,
    handleAddProduct,
    handleUpdateQuantity,
    handleRemoveItem,
    handleApplyDiscount,
    handleToggleTax,
    handleCompleteSale,
    setPaymentDetails: updatePaymentDetails,
    setSelectedSaleIndex,
  };
};

export { generateSaleNumber };
