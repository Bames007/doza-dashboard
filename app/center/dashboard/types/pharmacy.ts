// Pharmacy-specific types
export interface Product {
  id: string;
  centerId: string;
  sku: string;
  barcode?: string;
  barcodeType?: "EAN13" | "UPC" | "CODE128" | "QR" | "CUSTOM";
  name: string;
  genericName?: string;
  brand?: string;
  category: string;
  manufacturer: string;
  supplierId?: string;
  supplierName?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  markupPercentage: number;
  sellingPrice: number;
  reorderLevel: number;
  location: string;
  description?: string;
  prescriptionRequired: boolean;
  isMedicalEquipment?: boolean;
  equipmentType?: string;
  weight?: number;
  dimensions?: string;
  warrantyPeriod?: string;
  serviceRequired?: boolean;
  serviceInterval?: string;
  lastServiceDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface InventoryAudit {
  id: string;
  productId: string;
  centerId: string;
  userId: string;
  action: "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT" | "EXPIRED" | "RETURN";
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason?: string;
  reference?: string;
  notes?: string;
  timestamp: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  markupPercentage: number;
  sellingPrice: number;
  discountPercentage: number;
  discountAmount: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
}

type PaymentMethod =
  | "INSURANCE"
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "POS"
  | "DOZA_TAB"
  | "OTHER";

export interface Sale {
  id: string;
  centerId: string;
  saleNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerType: "REGULAR" | "DOZA_USER" | "INSURANCE";
  dozaUserId?: string;
  insuranceProvider?: string;
  insuranceId?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "REFUNDED";
  paymentMethod:
    | "CASH"
    | "CARD"
    | "TRANSFER"
    | "POS"
    | "INSURANCE"
    | "DOZA_TAB";
  paymentReference?: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  notes?: string;
  soldBy: string;
  soldByName: string;
  items: SaleItem[];
  prescriptionReference?: string;
  doctorName?: string;
  createdAt: string;
  updatedAt: string;
  taxEnabled?: boolean;
}

export interface Customer {
  id: string;
  centerId: string;
  customerCode: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  allergies?: string[];
  medications?: string[];
  loyaltyPoints: number;
  totalSpent: number;
  lastVisit?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  centerId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  centerId: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  currentBalance?: number;
  productsSupplied?: string[];
  rating?: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkUploadTemplate {
  headers: string[];
  sampleData: Record<string, any>[];
  requiredFields: string[];
}

export interface ProductScan {
  barcode: string;
  type: "EAN13" | "UPC" | "CODE128" | "QR" | "CUSTOM";
  timestamp: string;
  userId: string;
  location?: string;
  quantity?: number;
}

export interface PurchaseOrder {
  id: string;
  centerId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: "PENDING" | "ORDERED" | "RECEIVED" | "CANCELLED";
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  expectedDelivery?: string;
  receivedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  receivedQuantity: number;
}
