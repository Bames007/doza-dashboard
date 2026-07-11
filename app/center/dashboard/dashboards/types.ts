// app/center/dashboard/types/dashboard.ts

export interface ExpiredDrug {
  id: string;
  name: string;
  expiryDate: string;
  batch: string;
  quantity: number;
  status: "expired" | "expiring_soon" | "near_expiry";
  daysRemaining: number;
  location: string;
  category: string;
  unitPrice?: number;
  sellingPrice?: number;
  unit?: string;
  sku?: string;
  barcode?: string;
}

export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  batchNumber?: string;
  quantity: number;
  category: string;
  location?: string;
  unitPrice?: number;
  sellingPrice?: number;
  unit?: string;
  sku?: string;
  barcode?: string;
  reorderLevel?: number;
  isMedicalEquipment?: boolean;
  prescriptionRequired?: boolean;
}

export interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  totalCustomers: number;
  itemsSold: number;
  todaySales: number;
  todayRevenue: number;
  onlineSales: number;
  offlineSales: number;
}

// Extend for other domains as needed
