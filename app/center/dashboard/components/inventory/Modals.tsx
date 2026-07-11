// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { motion } from "framer-motion";
// import {
//   X,
//   Plus,
//   Edit3,
//   Trash2,
//   Truck,
//   Upload,
//   Download,
//   AlertCircle,
//   CheckCircle,
//   Barcode,
//   QrCode,
//   Camera,
//   Search,
//   User,
//   TrendingUp,
//   TrendingDown,
//   RefreshCw,
//   Printer,
//   Settings,
//   Grid,
//   List,
//   Smartphone,
//   Monitor,
//   Tablet,
//   Scan,
//   Package,
//   ShoppingBag,
//   Info,
//   Zap,
//   Layout,
//   FileText,
//   Hash,
//   DollarSign,
//   Calendar,
//   HashIcon,
//   Tag,
// } from "lucide-react";
// import { Product, Supplier, InventoryAudit } from "../../types/pharmacy";
// import { Center } from "@/app/center/type";
// import jsPDF from "jspdf";

// // Type definitions for form data
// interface ProductFormData {
//   sku: string;
//   name: string;
//   category: string;
//   manufacturer: string;
//   expiryDate: string;
//   isMedicalEquipment: boolean;
//   quantity: number;
//   unit: string;
//   reorderLevel: number;
//   unitPrice: number;
//   markupPercentage: number;
//   sellingPrice: number;
//   supplierId: string;
//   supplierName: string;
//   location: string;
//   description: string;
//   barcode?: string;
//   batchNumber?: string;
//   brand?: string;
// }

// interface StockAdjustmentData {
//   productName: string;
//   currentQuantity: number;
//   newQuantity: number;
//   unit: string;
//   reason: string;
//   notes: string;
// }

// interface SupplierFormData {
//   code: string;
//   name: string;
//   contactPerson: string;
//   phone: string;
//   email: string;
//   address: string;
//   city: string;
//   state: string;
//   paymentTerms: string;
//   notes: string;
// }

// interface SupplierModalProps {
//   suppliers: Supplier[];
//   onClose: () => void;
//   onAddSupplier: () => void;
//   onEditSupplier: (supplier: Supplier) => void;
//   onDeleteSupplier?: (supplierId: string) => void;
// }
// // import html2canvas from "html2canvas";
// // import { QRCode } from "qrcode.react";
// import BarcodeComponent from "react-barcode";
// import { QRCodeCanvas } from "qrcode.react";
// import QRCode, { toCanvas } from "qrcode";

// // Enhanced Modal Wrapper Component with better mobile support
// const ModalWrapper = ({ children, onClose, fullScreen = false }: any) => (
//   <motion.div
//     initial={{ opacity: 0 }}
//     animate={{ opacity: 1 }}
//     exit={{ opacity: 0 }}
//     className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4 ${
//       fullScreen ? "" : ""
//     }`}
//     onClick={onClose}
//   >
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95, y: 20 }}
//       animate={{ opacity: 1, scale: 1, y: 0 }}
//       exit={{ opacity: 0, scale: 0.95, y: 20 }}
//       onClick={(e) => e.stopPropagation()}
//       className={`w-full ${fullScreen ? "h-full" : "max-h-[95vh]"}`}
//       style={{
//         maxWidth: fullScreen ? "100%" : "min(96vw, 1400px)",
//       }}
//     >
//       {children}
//     </motion.div>
//   </motion.div>
// );

// interface ProductFormModalProps {
//   productForm: ProductFormData;
//   suppliers: Supplier[];
//   selectedProduct: Product | null;
//   onClose: () => void;
//   onSave: () => void;
//   onFormChange: (
//     field: keyof ProductFormData,
//     value: string | number | boolean
//   ) => void;
//   onGenerateBarcode: () => void;
// }

// export const ProductFormModal = ({
//   productForm,
//   suppliers,
//   selectedProduct,
//   onClose,
//   onSave,
//   onFormChange,
//   onGenerateBarcode,
// }: ProductFormModalProps) => {
//   const [activeTab, setActiveTab] = useState("basic");
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       setIsMobile(window.innerWidth < 768);
//     };
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount);
//   };

//   return (
//     <ModalWrapper onClose={onClose}>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
//         {/* Sticky Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
//           <div className="flex items-center justify-between">
//             <div className="min-w-0">
//               <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
//                 {selectedProduct ? "Edit Product" : "Add New Product"}
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">
//                 {selectedProduct?.sku || "New product entry"}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>
//         </div>

//         {/* Tabs - Mobile friendly */}
//         <div className="border-b border-gray-200 overflow-x-auto">
//           <div className="flex min-w-max px-2 md:px-6">
//             {["basic", "pricing", "supplier"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`flex-1 min-w-[100px] px-3 md:px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
//                   activeTab === tab
//                     ? "text-emerald-600 border-emerald-600 bg-emerald-50"
//                     : "text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50"
//                 }`}
//               >
//                 {tab === "basic" && "Basic Info"}
//                 {tab === "pricing" && "Pricing"}
//                 {tab === "supplier" && "Supplier"}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           {activeTab === "basic" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     SKU <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={productForm.sku}
//                     onChange={(e) => onFormChange("sku", e.target.value)}
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     required
//                     placeholder="Enter product SKU"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Product Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={productForm.name}
//                     onChange={(e) => onFormChange("name", e.target.value)}
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     required
//                     placeholder="Enter product name"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Category <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     value={productForm.category}
//                     onChange={(e) => onFormChange("category", e.target.value)}
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                   >
//                     <option value="">Select Category</option>
//                     <option value="Analgesics">Analgesics</option>
//                     <option value="Antibiotics">Antibiotics</option>
//                     <option value="Antihypertensives">Antihypertensives</option>
//                     <option value="Vitamins">Vitamins</option>
//                     <option value="Medical Equipment">Medical Equipment</option>
//                     <option value="Surgical Supplies">Surgical Supplies</option>
//                     <option value="Diagnostic Equipment">
//                       Diagnostic Equipment
//                     </option>
//                   </select>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Manufacturer <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={productForm.manufacturer}
//                     onChange={(e) =>
//                       onFormChange("manufacturer", e.target.value)
//                     }
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     required
//                     placeholder="Enter manufacturer"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Expiry Date <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="date"
//                     value={productForm.expiryDate}
//                     onChange={(e) => onFormChange("expiryDate", e.target.value)}
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     required
//                   />
//                 </div>

//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <input
//                       type="checkbox"
//                       id="isMedicalEquipment"
//                       checked={productForm.isMedicalEquipment}
//                       onChange={(e) =>
//                         onFormChange("isMedicalEquipment", e.target.checked)
//                       }
//                       className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
//                     />
//                     <label
//                       htmlFor="isMedicalEquipment"
//                       className="text-sm font-medium text-gray-700"
//                     >
//                       Medical Equipment
//                     </label>
//                   </div>
//                   <p className="text-xs text-gray-500 mt-2">
//                     Check if this is medical equipment requiring special
//                     handling
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === "pricing" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Quantity <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="number"
//                     value={productForm.quantity}
//                     onChange={(e) =>
//                       onFormChange("quantity", parseInt(e.target.value) || 0)
//                     }
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     min="0"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Unit
//                   </label>
//                   <select
//                     value={productForm.unit}
//                     onChange={(e) => onFormChange("unit", e.target.value)}
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                   >
//                     <option value="tablets">Tablets</option>
//                     <option value="bottles">Bottles</option>
//                     <option value="capsules">Capsules</option>
//                     <option value="syrups">Syrups</option>
//                     <option value="injections">Injections</option>
//                     <option value="pieces">Pieces</option>
//                     <option value="boxes">Boxes</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Reorder Level
//                   </label>
//                   <input
//                     type="number"
//                     value={productForm.reorderLevel}
//                     onChange={(e) =>
//                       onFormChange(
//                         "reorderLevel",
//                         parseInt(e.target.value) || 0
//                       )
//                     }
//                     className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                     min="0"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Unit Price (Cost) <span className="text-red-500">*</span>
//                   </label>
//                   <div className="relative">
//                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                       <span className="text-gray-500">₦</span>
//                     </div>
//                     <input
//                       type="number"
//                       value={productForm.unitPrice}
//                       onChange={(e) =>
//                         onFormChange(
//                           "unitPrice",
//                           parseFloat(e.target.value) || 0
//                         )
//                       }
//                       className="w-full pl-8 pr-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                       min="0"
//                       step="0.01"
//                       required
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Markup Percentage
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="number"
//                       value={productForm.markupPercentage}
//                       onChange={(e) =>
//                         onFormChange(
//                           "markupPercentage",
//                           parseFloat(e.target.value) || 0
//                         )
//                       }
//                       className="w-full pr-12 pl-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                       min="0"
//                       step="0.1"
//                     />
//                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
//                       <span className="text-gray-500">%</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="p-4 bg-gray-50 rounded-lg">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Selling Price
//                   </label>
//                   <div className="text-2xl font-bold text-emerald-600">
//                     {formatCurrency(
//                       productForm.sellingPrice ||
//                         productForm.unitPrice *
//                           (1 + (productForm.markupPercentage || 0) / 100)
//                     )}
//                   </div>
//                   <p className="text-xs text-gray-500 mt-1">
//                     Auto-calculated based on cost and markup
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {activeTab === "supplier" && (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Supplier
//                 </label>
//                 <select
//                   value={productForm.supplierId}
//                   onChange={(e) => {
//                     const supplier = suppliers.find(
//                       (s) => s.id === e.target.value
//                     );
//                     onFormChange("supplierId", e.target.value);
//                     onFormChange("supplierName", supplier?.name || "");
//                   }}
//                   className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 >
//                   <option value="">No Supplier</option>
//                   {suppliers.map((supplier) => (
//                     <option key={supplier.id} value={supplier.id}>
//                       {supplier.name} - {supplier.contactPerson}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Location/Shelf
//                 </label>
//                 <input
//                   type="text"
//                   value={productForm.location}
//                   onChange={(e) => onFormChange("location", e.target.value)}
//                   className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                   placeholder="e.g., Shelf A1, Row 3"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   value={productForm.description}
//                   onChange={(e) => onFormChange("description", e.target.value)}
//                   rows={3}
//                   className="w-full px-3 md:px-4 py-2.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
//                   placeholder="Enter product description, usage instructions, or special notes..."
//                 />
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Sticky Footer */}
//         <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6 mt-4">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={onClose}
//               className="flex-1 px-4 py-3.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onSave}
//               className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all"
//             >
//               {selectedProduct ? "Update Product" : "Add Product"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// // Enhanced Stock Adjustment Modal
// interface StockAdjustmentModalProps {
//   stockAdjustment: StockAdjustmentData;
//   onClose: () => void;
//   onSave: () => void;
//   onAdjustmentChange: (
//     field: keyof StockAdjustmentData,
//     value: string | number
//   ) => void;
// }
// export const StockAdjustmentModal = ({
//   stockAdjustment,
//   onClose,
//   onSave,
//   onAdjustmentChange,
// }: StockAdjustmentModalProps) => {
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     setLoading(true);
//     try {
//       await onSave();
//     } finally {
//       setLoading(false);
//     }
//   };

//   const difference =
//     stockAdjustment.newQuantity - stockAdjustment.currentQuantity;

//   return (
//     <ModalWrapper onClose={onClose}>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-md mx-auto shadow-2xl">
//         <div className="border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-center justify-between">
//             <div className="min-w-0">
//               <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
//                 Adjust Stock
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">
//                 {stockAdjustment.productName || "Product"}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>
//         </div>

//         <div className="p-4 md:p-6 space-y-4 md:space-y-6">
//           {/* Current Stock Display */}
//           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-blue-700">
//                   Current Stock
//                 </p>
//                 <p className="text-xs text-blue-600">Available quantity</p>
//               </div>
//               <div className="text-right">
//                 <div className="text-2xl md:text-3xl font-bold text-blue-800">
//                   {stockAdjustment.currentQuantity}
//                 </div>
//                 <p className="text-xs text-blue-600 mt-0.5">
//                   {stockAdjustment.unit || "units"}
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* New Quantity Input */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-800 mb-2">
//               New Quantity <span className="text-red-500">*</span>
//             </label>
//             <div className="relative">
//               <input
//                 type="number"
//                 value={stockAdjustment.newQuantity}
//                 onChange={(e) =>
//                   onAdjustmentChange(
//                     "newQuantity",
//                     parseInt(e.target.value) || 0
//                   )
//                 }
//                 className="w-full px-4 py-3 text-lg font-semibold text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 min="0"
//                 required
//               />
//               <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
//                 <span className="text-gray-500">
//                   {stockAdjustment.unit || "units"}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Difference Indicator */}
//           <div
//             className={`rounded-xl p-4 transition-all ${
//               difference === 0
//                 ? "bg-gray-50"
//                 : difference > 0
//                 ? "bg-emerald-50 border border-emerald-200"
//                 : "bg-red-50 border border-red-200"
//             }`}
//           >
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 {difference > 0 ? (
//                   <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
//                     <TrendingUp className="w-5 h-5 text-emerald-600" />
//                   </div>
//                 ) : difference < 0 ? (
//                   <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
//                     <TrendingDown className="w-5 h-5 text-red-600" />
//                   </div>
//                 ) : (
//                   <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
//                     <AlertCircle className="w-5 h-5 text-gray-600" />
//                   </div>
//                 )}
//                 <div>
//                   <p className="font-semibold text-gray-800">
//                     {difference > 0
//                       ? "Stock Increase"
//                       : difference < 0
//                       ? "Stock Decrease"
//                       : "No Change"}
//                   </p>
//                   <p className="text-sm text-gray-600">
//                     {Math.abs(difference)} units{" "}
//                     {difference > 0 ? "added" : difference < 0 ? "removed" : ""}
//                   </p>
//                 </div>
//               </div>
//               <div
//                 className={`text-xl font-bold ${
//                   difference > 0
//                     ? "text-emerald-600"
//                     : difference < 0
//                     ? "text-red-600"
//                     : "text-gray-600"
//                 }`}
//               >
//                 {difference > 0 ? "+" : ""}
//                 {difference}
//               </div>
//             </div>
//           </div>

//           {/* Reason Selection */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-800 mb-2">
//               Adjustment Reason <span className="text-red-500">*</span>
//             </label>
//             <select
//               value={stockAdjustment.reason}
//               onChange={(e) => onAdjustmentChange("reason", e.target.value)}
//               className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//               required
//             >
//               <option value="">Select Reason</option>
//               <option value="INITIAL_STOCK">Initial Stock</option>
//               <option value="PURCHASE_ORDER">Purchase Order</option>
//               <option value="SALE">Sale</option>
//               <option value="RETURN">Customer Return</option>
//               <option value="DAMAGED">Damaged Goods</option>
//               <option value="EXPIRED">Expired</option>
//               <option value="THEFT">Theft/Loss</option>
//               <option value="ADJUSTMENT">Manual Adjustment</option>
//             </select>
//           </div>

//           {/* Notes */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-800 mb-2">
//               Notes
//             </label>
//             <textarea
//               value={stockAdjustment.notes}
//               onChange={(e) => onAdjustmentChange("notes", e.target.value)}
//               rows={3}
//               className="w-full px-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
//               placeholder="Enter adjustment details, reference numbers, or additional information..."
//             />
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="border-t border-gray-200 p-4 md:p-6">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={onClose}
//               className="flex-1 px-4 py-3.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium border border-gray-300 transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               disabled={
//                 loading ||
//                 stockAdjustment.newQuantity ===
//                   stockAdjustment.currentQuantity ||
//                 !stockAdjustment.reason
//               }
//               className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center gap-2">
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                   Saving...
//                 </span>
//               ) : (
//                 "Save Adjustment"
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// interface SupplierFormModalProps {
//   supplierForm: SupplierFormData;
//   selectedSupplier: Supplier | null;
//   onClose: () => void;
//   onSave: () => void;
//   onFormChange: (field: keyof SupplierFormData, value: string) => void;
// }

// export const SupplierModal = ({
//   suppliers,
//   onClose,
//   onAddSupplier,
//   onEditSupplier,
//   onDeleteSupplier,
// }: SupplierModalProps) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

//   const filteredSuppliers = suppliers.filter(
//     (supplier) =>
//       supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       supplier.contactPerson
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       supplier.phone.includes(searchTerm)
//   );

//   const handleDelete = (
//     e: React.MouseEvent,
//     supplierId: string,
//     supplierName: string
//   ) => {
//     e.stopPropagation();
//     if (
//       confirm(
//         `Are you sure you want to delete "${supplierName}"? This action cannot be undone.`
//       )
//     ) {
//       onDeleteSupplier?.(supplierId);
//     }
//   };

//   return (
//     <ModalWrapper onClose={onClose} fullScreen>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
//         {/* Sticky Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//             <div className="min-w-0">
//               <h2 className="text-base md:text-xl font-bold text-gray-900">
//                 Suppliers
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5">
//                 {filteredSuppliers.length} supplier
//                 {filteredSuppliers.length !== 1 ? "s" : ""} found
//               </p>
//             </div>

//             <div className="flex items-center gap-2">
//               {/* View Mode Toggle */}
//               <div className="flex border border-gray-300 rounded-lg overflow-hidden">
//                 <button
//                   onClick={() => setViewMode("grid")}
//                   className={`p-2 ${
//                     viewMode === "grid"
//                       ? "bg-emerald-100 text-emerald-700"
//                       : "bg-white text-gray-600"
//                   }`}
//                   title="Grid View"
//                 >
//                   <Grid className="w-4 h-4" />
//                 </button>
//                 <button
//                   onClick={() => setViewMode("list")}
//                   className={`p-2 ${
//                     viewMode === "list"
//                       ? "bg-emerald-100 text-emerald-700"
//                       : "bg-white text-gray-600"
//                   }`}
//                   title="List View"
//                 >
//                   <List className="w-4 h-4" />
//                 </button>
//               </div>

//               {/* Add Supplier Button */}
//               <button
//                 onClick={onAddSupplier}
//                 className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20"
//               >
//                 <Plus className="w-4 h-4" />
//                 <span className="hidden sm:inline">Add Supplier</span>
//                 <span className="sm:hidden">Add</span>
//               </button>

//               {/* Close Button */}
//               <button
//                 onClick={onClose}
//                 className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//                 aria-label="Close"
//               >
//                 <X className="w-5 h-5 text-gray-700" />
//               </button>
//             </div>
//           </div>

//           {/* Search Bar */}
//           <div className="mt-4">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search suppliers by name, contact, or phone..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//               />
//               {searchTerm && (
//                 <button
//                   onClick={() => setSearchTerm("")}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
//                 >
//                   <X className="w-4 h-4 text-gray-400" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           {filteredSuppliers.length === 0 ? (
//             <div className="text-center py-12 md:py-16">
//               <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
//                 <Truck className="w-10 h-10 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 No suppliers found
//               </h3>
//               <p className="text-gray-600 mb-6 max-w-md mx-auto">
//                 {searchTerm
//                   ? `No suppliers match "${searchTerm}"`
//                   : "Get started by adding your first supplier"}
//               </p>
//               {!searchTerm && (
//                 <button
//                   onClick={onAddSupplier}
//                   className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/20"
//                 >
//                   <Plus className="w-5 h-5" />
//                   Add First Supplier
//                 </button>
//               )}
//             </div>
//           ) : viewMode === "grid" ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
//               {filteredSuppliers.map((supplier) => (
//                 <div
//                   key={supplier.id}
//                   className="group border border-gray-200 rounded-xl p-4 md:p-5 hover:border-emerald-300 hover:shadow-lg transition-all cursor-pointer bg-white"
//                   onClick={() => onEditSupplier(supplier)}
//                 >
//                   <div className="flex items-start justify-between mb-4">
//                     <div className="flex items-center gap-3 min-w-0">
//                       <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                         <Truck className="w-6 h-6 text-indigo-600" />
//                       </div>
//                       <div className="min-w-0">
//                         <h3 className="font-semibold text-gray-900 truncate">
//                           {supplier.name}
//                         </h3>
//                         <p className="text-sm text-gray-600 truncate">
//                           {supplier.contactPerson || "No contact"}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           onEditSupplier(supplier);
//                         }}
//                         className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
//                         title="Edit"
//                       >
//                         <Edit3 className="w-4 h-4" />
//                       </button>
//                       {onDeleteSupplier && (
//                         <button
//                           onClick={(e) =>
//                             handleDelete(e, supplier.id, supplier.name)
//                           }
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Delete"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       )}
//                     </div>
//                   </div>

//                   <div className="space-y-3">
//                     <div className="flex items-center gap-2 text-sm">
//                       <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
//                         <span className="text-blue-600 text-xs">📞</span>
//                       </div>
//                       <a
//                         href={`tel:${supplier.phone}`}
//                         className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
//                         onClick={(e) => e.stopPropagation()}
//                       >
//                         {supplier.phone}
//                       </a>
//                     </div>

//                     {supplier.email && (
//                       <div className="flex items-center gap-2 text-sm">
//                         <div className="w-6 h-6 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
//                           <span className="text-purple-600 text-xs">✉️</span>
//                         </div>
//                         <a
//                           href={`mailto:${supplier.email}`}
//                           className="font-medium text-purple-600 hover:text-purple-700 hover:underline truncate"
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           {supplier.email}
//                         </a>
//                       </div>
//                     )}

//                     {supplier.address && (
//                       <div className="flex items-start gap-2 text-sm">
//                         <div className="w-6 h-6 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
//                           <span className="text-gray-600 text-xs">📍</span>
//                         </div>
//                         <p className="text-gray-600 line-clamp-2">
//                           {supplier.address}
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   {supplier.notes && (
//                     <div className="mt-4 pt-4 border-t border-gray-100">
//                       <p className="text-xs text-gray-500 line-clamp-2">
//                         {supplier.notes}
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             // List View
//             <div className="space-y-2">
//               {filteredSuppliers.map((supplier) => (
//                 <div
//                   key={supplier.id}
//                   className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
//                   onClick={() => onEditSupplier(supplier)}
//                 >
//                   <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <Truck className="w-5 h-5 text-indigo-600" />
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <h3 className="font-semibold text-gray-900 truncate">
//                         {supplier.name}
//                       </h3>
//                       <div className="flex items-center gap-2 ml-2">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onEditSupplier(supplier);
//                           }}
//                           className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
//                           title="Edit"
//                         >
//                           <Edit3 className="w-4 h-4" />
//                         </button>
//                         {onDeleteSupplier && (
//                           <button
//                             onClick={(e) =>
//                               handleDelete(e, supplier.id, supplier.name)
//                             }
//                             className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
//                             title="Delete"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
//                       <span className="flex items-center gap-1">
//                         <span>👤</span>
//                         {supplier.contactPerson || "No contact"}
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <span>📞</span>
//                         {supplier.phone}
//                       </span>
//                       {supplier.email && (
//                         <span className="flex items-center gap-1">
//                           <span>✉️</span>
//                           {supplier.email}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// // Enhanced Bulk Upload Modal
// interface BulkUploadModalProps {
//   onClose: () => void;
//   onUpload: (data: any[]) => void;
//   onDownloadTemplate: () => void;
//   progress: number;
//   status: "idle" | "uploading" | "success" | "error";
// }

// export const BulkUploadModal = ({
//   onClose,
//   onUpload,
//   onDownloadTemplate,
//   progress,
//   status,
// }: BulkUploadModalProps) => {
//   const [file, setFile] = useState<File | null>(null);
//   const [preview, setPreview] = useState<string[]>([]);
//   const [errors, setErrors] = useState<string[]>([]);
//   const [isDragging, setIsDragging] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const droppedFile = e.dataTransfer.files?.[0];
//     if (droppedFile && droppedFile.name.endsWith(".csv")) {
//       handleFileSelect(droppedFile);
//     } else {
//       setErrors(["Please drop a CSV file only"]);
//     }
//   };

//   const handleFileSelect = (selectedFile: File) => {
//     if (!selectedFile.name.endsWith(".csv")) {
//       setErrors(["Please select a CSV file only"]);
//       return;
//     }

//     setFile(selectedFile);
//     setErrors([]);

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const text = event.target?.result as string;
//       const lines = text.split("\n").slice(0, 6);
//       setPreview(lines);
//     };
//     reader.readAsText(selectedFile);
//   };

//   const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (selectedFile) {
//       handleFileSelect(selectedFile);
//     }
//   };

//   const handleUpload = async () => {
//     if (!file) {
//       setErrors(["Please select a file first"]);
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = async (event) => {
//       const text = event.target?.result as string;
//       const rows = text.split("\n").filter((row) => row.trim());

//       if (rows.length < 2) {
//         setErrors(["CSV file is empty or has no data rows"]);
//         return;
//       }

//       // Parse CSV
//       const data = rows.slice(1).map((row) => {
//         const values = row
//           .split(",")
//           .map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
//         return {
//           sku: values[0] || "",
//           name: values[1] || "",
//           category: values[2] || "",
//           quantity: values[3] || "0",
//           unitPrice: values[4] || "0",
//         };
//       });

//       const validationErrors: string[] = [];

//       data.forEach((row, index) => {
//         if (!row.sku)
//           validationErrors.push(`Row ${index + 1}: SKU is required`);
//         if (!row.name)
//           validationErrors.push(`Row ${index + 1}: Name is required`);
//         if (!row.category)
//           validationErrors.push(`Row ${index + 1}: Category is required`);
//         if (!row.quantity || isNaN(Number(row.quantity)))
//           validationErrors.push(`Row ${index + 1}: Valid quantity required`);
//         if (!row.unitPrice || isNaN(Number(row.unitPrice)))
//           validationErrors.push(`Row ${index + 1}: Valid unit price required`);
//       });

//       if (validationErrors.length > 0) {
//         setErrors(validationErrors);
//         return;
//       }

//       onUpload(data);
//     };
//     reader.readAsText(file);
//   };

//   return (
//     <ModalWrapper onClose={onClose}>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-2xl mx-auto shadow-2xl">
//         <div className="border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-base md:text-xl font-bold text-gray-900">
//                 Bulk Upload Products
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5">
//                 Upload CSV file with product data
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>
//         </div>

//         <div className="p-4 md:p-6 space-y-6">
//           {/* File Upload Area */}
//           <div
//             className={`border-3 border-dashed rounded-2xl p-6 md:p-8 text-center transition-all cursor-pointer ${
//               isDragging
//                 ? "border-emerald-400 bg-emerald-50"
//                 : status === "uploading"
//                 ? "border-blue-300 bg-blue-50"
//                 : status === "success"
//                 ? "border-emerald-300 bg-emerald-50"
//                 : status === "error"
//                 ? "border-red-300 bg-red-50"
//                 : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
//             }`}
//             onClick={() => fileInputRef.current?.click()}
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}
//           >
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileInputChange}
//               accept=".csv"
//               className="hidden"
//             />

//             {status === "uploading" ? (
//               <div className="space-y-4">
//                 <div className="relative w-16 h-16 mx-auto">
//                   <div className="w-full h-full border-4 border-emerald-200 rounded-full"></div>
//                   <div className="absolute top-0 left-0 w-full h-full border-4 border-t-emerald-600 rounded-full animate-spin"></div>
//                 </div>
//                 <div>
//                   <p className="font-semibold text-gray-900">
//                     Uploading {file?.name}
//                   </p>
//                   <div className="mt-3">
//                     <div className="flex justify-between text-sm text-gray-600 mb-1">
//                       <span>Progress</span>
//                       <span>{progress}%</span>
//                     </div>
//                     <div className="w-full bg-gray-200 rounded-full h-2">
//                       <div
//                         className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-300"
//                         style={{ width: `${progress}%` }}
//                       ></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ) : status === "success" ? (
//               <div className="space-y-3">
//                 <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
//                   <CheckCircle className="w-8 h-8 text-emerald-600" />
//                 </div>
//                 <p className="font-semibold text-gray-900">
//                   Upload Successful!
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   Products have been added to inventory
//                 </p>
//               </div>
//             ) : (
//               <>
//                 <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
//                   <Upload className="w-8 h-8 text-gray-400" />
//                 </div>
//                 <p className="font-semibold text-gray-900 mb-2">
//                   {file ? file.name : "Drop CSV file or click to browse"}
//                 </p>
//                 <p className="text-sm text-gray-600 mb-4">
//                   Supports .csv files up to 10MB
//                 </p>
//                 {file && (
//                   <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg">
//                     <span className="text-sm font-medium text-gray-900">
//                       {file.name}
//                     </span>
//                     <span className="text-xs text-gray-500">
//                       ({Math.round(file.size / 1024)} KB)
//                     </span>
//                   </div>
//                 )}
//                 <p className="text-xs text-gray-500 mt-4">
//                   Drag and drop your CSV file here
//                 </p>
//               </>
//             )}
//           </div>

//           {/* Error Display */}
//           {errors.length > 0 && (
//             <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
//               <div className="flex items-start gap-3">
//                 <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold text-red-800">
//                     Validation Errors
//                   </p>
//                   <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
//                     {errors.map((error, index) => (
//                       <li
//                         key={index}
//                         className="text-sm text-red-700 flex items-start gap-2"
//                       >
//                         <span className="text-red-500 mt-0.5">•</span>
//                         <span>{error}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Preview Table */}
//           {file && preview.length > 0 && status === "idle" && (
//             <div>
//               <h4 className="text-sm font-semibold text-gray-900 mb-3">
//                 CSV Preview (first {preview.length} rows):
//               </h4>
//               <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         {preview[0]?.split(",").map((header, index) => (
//                           <th
//                             key={index}
//                             className="px-4 py-3 text-left font-medium text-gray-700 border-r border-gray-200 last:border-r-0"
//                           >
//                             {header.trim()}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {preview.slice(1).map((row, rowIndex) => (
//                         <tr
//                           key={rowIndex}
//                           className="border-t border-gray-200 hover:bg-gray-100"
//                         >
//                           {row.split(",").map((cell, cellIndex) => (
//                             <td
//                               key={cellIndex}
//                               className="px-4 py-3 text-gray-700 border-r border-gray-200 last:border-r-0"
//                             >
//                               {cell.trim()}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={onDownloadTemplate}
//               className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               Download Template
//             </button>

//             {status === "idle" && (
//               <>
//                 <button
//                   onClick={onClose}
//                   className="flex-1 px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpload}
//                   disabled={!file}
//                   className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   Upload Products
//                 </button>
//               </>
//             )}

//             {(status === "success" || status === "error") && (
//               <button
//                 onClick={onClose}
//                 className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all"
//               >
//                 Done
//               </button>
//             )}
//           </div>

//           {/* Help Section */}
//           <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
//             <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
//               <Settings className="w-4 h-4" />
//               CSV Format Requirements:
//             </h3>
//             <ul className="text-sm text-blue-800 space-y-1.5">
//               <li className="flex items-start gap-2">
//                 <span className="text-blue-600 mt-0.5">✓</span>
//                 <span>
//                   <strong>Required fields:</strong> SKU, Name, Category,
//                   Quantity, UnitPrice
//                 </span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-blue-600 mt-0.5">✓</span>
//                 <span>
//                   <strong>Format:</strong> Comma-separated values (CSV)
//                 </span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-blue-600 mt-0.5">✓</span>
//                 <span>
//                   <strong>Headers:</strong> Include header row with column names
//                 </span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-blue-600 mt-0.5">✓</span>
//                 <span>
//                   <strong>Size:</strong> Maximum file size 10MB
//                 </span>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// // Enhanced Audit Logs Modal
// interface AuditLogsModalProps {
//   auditLogs: InventoryAudit[];
//   selectedProduct: Product | null;
//   selectedProductId: string | null;
//   onClose: () => void;
// }

// export const AuditLogsModal = ({
//   auditLogs,
//   selectedProduct,
//   selectedProductId,
//   onClose,
// }: AuditLogsModalProps) => {
//   const [filter, setFilter] = useState<string>("all");
//   const [searchTerm, setSearchTerm] = useState("");

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   const getActionColor = (action: string) => {
//     switch (action) {
//       case "STOCK_IN":
//         return "bg-emerald-100 text-emerald-800";
//       case "STOCK_OUT":
//         return "bg-red-100 text-red-800";
//       case "ADJUSTMENT":
//         return "bg-blue-100 text-blue-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getActionIcon = (action: string) => {
//     switch (action) {
//       case "STOCK_IN":
//         return <TrendingUp className="w-3 h-3" />;
//       case "STOCK_OUT":
//         return <TrendingDown className="w-3 h-3" />;
//       case "ADJUSTMENT":
//         return <RefreshCw className="w-3 h-3" />;
//       default:
//         return null;
//     }
//   };

//   const filteredLogs = auditLogs.filter((log) => {
//     if (filter !== "all" && log.action !== filter) return false;
//     if (searchTerm) {
//       const searchLower = searchTerm.toLowerCase();
//       return (
//         log.reason?.toLowerCase().includes(searchLower) ||
//         log.notes?.toLowerCase().includes(searchLower) ||
//         log.userId?.toLowerCase().includes(searchLower)
//       );
//     }
//     return true;
//   });

//   return (
//     <ModalWrapper onClose={onClose} fullScreen>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto shadow-2xl">
//         {/* Sticky Header */}
//         <div className="sticky top-0 bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-xl md:rounded-t-2xl z-10">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//             <div className="min-w-0">
//               <h2 className="text-base md:text-xl font-bold text-gray-900">
//                 Audit Logs
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5">
//                 {selectedProduct?.name || "Product History"}
//                 {selectedProductId && (
//                   <span className="text-gray-400">
//                     {" "}
//                     • ID: {selectedProductId}
//                   </span>
//                 )}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>

//           {/* Filters and Search */}
//           <div className="flex flex-col sm:flex-row gap-3">
//             <div className="flex-1">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search in logs..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 />
//               </div>
//             </div>
//             <div className="flex gap-2 overflow-x-auto pb-1">
//               <button
//                 onClick={() => setFilter("all")}
//                 className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
//                   filter === "all"
//                     ? "bg-emerald-100 text-emerald-800"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 All
//               </button>
//               <button
//                 onClick={() => setFilter("STOCK_IN")}
//                 className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
//                   filter === "STOCK_IN"
//                     ? "bg-emerald-100 text-emerald-800"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 Stock In
//               </button>
//               <button
//                 onClick={() => setFilter("STOCK_OUT")}
//                 className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
//                   filter === "STOCK_OUT"
//                     ? "bg-red-100 text-red-800"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 Stock Out
//               </button>
//               <button
//                 onClick={() => setFilter("ADJUSTMENT")}
//                 className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
//                   filter === "ADJUSTMENT"
//                     ? "bg-blue-100 text-blue-800"
//                     : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//                 }`}
//               >
//                 Adjustments
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           {filteredLogs.length === 0 ? (
//             <div className="text-center py-12 md:py-16">
//               <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
//                 <RefreshCw className="w-10 h-10 text-gray-400" />
//               </div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 No audit logs found
//               </h3>
//               <p className="text-gray-600 mb-1">
//                 {searchTerm || filter !== "all"
//                   ? "No logs match your search criteria"
//                   : "There are no audit logs for this product yet"}
//               </p>
//               {(searchTerm || filter !== "all") && (
//                 <button
//                   onClick={() => {
//                     setSearchTerm("");
//                     setFilter("all");
//                   }}
//                   className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mt-2"
//                 >
//                   Clear filters
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="space-y-3">
//               <div className="flex items-center justify-between mb-2">
//                 <p className="text-sm text-gray-600">
//                   Showing {filteredLogs.length} audit log
//                   {filteredLogs.length !== 1 ? "s" : ""}
//                 </p>
//                 <div className="flex items-center gap-2">
//                   <span className="text-xs text-gray-500">Latest first</span>
//                 </div>
//               </div>

//               {filteredLogs.map((log) => (
//                 <div
//                   key={log.id}
//                   className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
//                     {/* Left Column - Action Info */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex flex-wrap items-center gap-2 mb-3">
//                         <span
//                           className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(
//                             log.action
//                           )}`}
//                         >
//                           {getActionIcon(log.action)}
//                           {log.action.replace("_", " ")}
//                         </span>
//                         <span className="text-sm font-medium text-gray-900">
//                           {formatDate(log.timestamp)}
//                         </span>
//                         {log.userId && (
//                           <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
//                             <User className="w-3 h-3" />
//                             {log.userId.slice(0, 8)}...
//                           </span>
//                         )}
//                       </div>

//                       {/* Quantity Changes */}
//                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
//                         <div className="bg-gray-50 rounded-lg p-3">
//                           <p className="text-xs text-gray-500 mb-1">Previous</p>
//                           <p className="text-lg font-bold text-gray-800">
//                             {log.previousQuantity || 0}
//                           </p>
//                         </div>
//                         <div className="bg-gray-50 rounded-lg p-3">
//                           <p className="text-xs text-gray-500 mb-1">New</p>
//                           <p className="text-lg font-bold text-gray-800">
//                             {log.newQuantity || 0}
//                           </p>
//                         </div>
//                         <div className="bg-gray-50 rounded-lg p-3">
//                           <p className="text-xs text-gray-500 mb-1">
//                             Difference
//                           </p>
//                           <p
//                             className={`text-lg font-bold ${
//                               (log.difference || 0) > 0
//                                 ? "text-emerald-600"
//                                 : (log.difference || 0) < 0
//                                 ? "text-red-600"
//                                 : "text-gray-600"
//                             }`}
//                           >
//                             {(log.difference || 0) > 0 ? "+" : ""}
//                             {log.difference || 0}
//                           </p>
//                         </div>
//                       </div>

//                       {/* Reason and Notes */}
//                       {log.reason && (
//                         <div className="mb-3">
//                           <p className="text-xs font-medium text-gray-700 mb-1">
//                             Reason
//                           </p>
//                           <p className="text-sm text-gray-900">{log.reason}</p>
//                         </div>
//                       )}

//                       {log.notes && (
//                         <div>
//                           <p className="text-xs font-medium text-gray-700 mb-1">
//                             Notes
//                           </p>
//                           <p className="text-sm text-gray-600">{log.notes}</p>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Sticky Footer */}
//         <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 md:p-6">
//           <button
//             onClick={onClose}
//             className="w-full px-4 py-3.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
//           >
//             Close Audit Logs
//           </button>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// interface PrintLabelsModalProps {
//   products: Product[];
//   center: Center;
//   onClose: () => void;
//   onPrint: (
//     selectedProducts: Product[],
//     labelSize: string,
//     copies: number,
//     includeQR: boolean,
//     includeBarcode: boolean,
//     includeExpiry: boolean,
//     includePrice: boolean
//   ) => void;
// }

// export const PrintLabelsModal = ({
//   products,
//   center,
//   onClose,
//   onPrint,
// }: PrintLabelsModalProps) => {
//   const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
//   const [labelSize, setLabelSize] = useState<
//     "small" | "medium" | "large" | "xlarge"
//   >("medium");
//   const [copies, setCopies] = useState(1);
//   const [includeQR, setIncludeQR] = useState(true);
//   const [includeBarcode, setIncludeBarcode] = useState(true);
//   const [includeExpiry, setIncludeExpiry] = useState(true);
//   const [includePrice, setIncludePrice] = useState(true);
//   const [includeBrand, setIncludeBrand] = useState(false);
//   const [includeLocation, setIncludeLocation] = useState(false);
//   const [includeBatch, setIncludeBatch] = useState(false);
//   const [includeManufacturer, setIncludeManufacturer] = useState(false);
//   const [selectedProductForPreview, setSelectedProductForPreview] =
//     useState<Product | null>(null);
//   const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">(
//     "desktop"
//   );
//   const [fullScreenPreview, setFullScreenPreview] = useState(false);
//   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
//   const [pdfProgress, setPdfProgress] = useState(0);
//   const [paperSize, setPaperSize] = useState<"A4" | "Letter" | "A5">("A4");
//   const [orientation, setOrientation] = useState<"portrait" | "landscape">(
//     "portrait"
//   );
//   const [labelSpacing, setLabelSpacing] = useState(2);
//   const [labelMargins, setLabelMargins] = useState(1);

//   const previewRef = useRef<HTMLDivElement>(null);
//   const pdfContainerRef = useRef<HTMLDivElement>(null);

//   // Initialize with first product selected
//   useEffect(() => {
//     if (products.length > 0 && !selectedProductForPreview) {
//       const firstProduct = products[0];
//       setSelectedProductForPreview(firstProduct);
//       setSelectedProducts([firstProduct.id]);
//     }
//   }, [products]);

//   // Update preview when selected products change
//   useEffect(() => {
//     if (
//       selectedProducts.length > 0 &&
//       !selectedProducts.includes(selectedProductForPreview?.id || "")
//     ) {
//       const product = products.find((p) => p.id === selectedProducts[0]);
//       if (product) {
//         setSelectedProductForPreview(product);
//       }
//     }
//   }, [selectedProducts]);

//   useEffect(() => {
//     if (labelSize === "xlarge") {
//       setOrientation("portrait");
//     } else {
//       setOrientation("landscape");
//     }
//   }, [labelSize]);

//   const toggleProduct = (productId: string) => {
//     setSelectedProducts((prev) =>
//       prev.includes(productId)
//         ? prev.filter((id) => id !== productId)
//         : [...prev, productId]
//     );

//     if (!selectedProducts.includes(productId)) {
//       const product = products.find((p) => p.id === productId);
//       if (product) {
//         setSelectedProductForPreview(product);
//       }
//     }
//   };

//   const toggleAll = () => {
//     if (selectedProducts.length === products.length) {
//       setSelectedProducts([]);
//     } else {
//       setSelectedProducts(products.map((p) => p.id));
//     }
//   };

//   const handlePrint = () => {
//     const selected = products.filter((p) => selectedProducts.includes(p.id));
//     onPrint(
//       selected,
//       labelSize,
//       copies,
//       includeQR,
//       includeBarcode,
//       includeExpiry,
//       includePrice
//     );
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat("en-NG", {
//       style: "currency",
//       currency: "NGN",
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   const truncateText = (
//     text: string,
//     maxLength: number,
//     type: "name" | "sku" | "general" = "general"
//   ) => {
//     if (!text) return "";

//     if (text.length <= maxLength) return text;

//     switch (type) {
//       case "name":
//         return text.substring(0, maxLength - 1) + "…";
//       case "sku":
//         return text.substring(0, maxLength - 3) + "…";
//       default:
//         return text.substring(0, maxLength - 2) + "…";
//     }
//   };

//   // Get optimal font size based on text length
//   const getFontSizeClass = (
//     text: string,
//     baseClass: string,
//     isTitle = false
//   ) => {
//     if (!text) return baseClass;

//     const length = text.length;
//     const sizeMap = {
//       small: {
//         title: {
//           short: "text-[8px]",
//           medium: "text-[7px]",
//           long: "text-[6px]",
//         },
//         normal: {
//           short: "text-[7px]",
//           medium: "text-[6px]",
//           long: "text-[5px]",
//         },
//       },
//       medium: {
//         title: {
//           short: "text-[10px]",
//           medium: "text-[9px]",
//           long: "text-[8px]",
//         },
//         normal: {
//           short: "text-[9px]",
//           medium: "text-[8px]",
//           long: "text-[7px]",
//         },
//       },
//       large: {
//         title: {
//           short: "text-[12px]",
//           medium: "text-[11px]",
//           long: "text-[10px]",
//         },
//         normal: {
//           short: "text-[11px]",
//           medium: "text-[10px]",
//           long: "text-[9px]",
//         },
//       },
//       xlarge: {
//         title: {
//           short: "text-[14px]",
//           medium: "text-[13px]",
//           long: "text-[12px]",
//         },
//         normal: {
//           short: "text-[13px]",
//           medium: "text-[12px]",
//           long: "text-[11px]",
//         },
//       },
//     };

//     const sizeKey = labelSize;
//     const category = isTitle ? "title" : "normal";
//     const lengthKey = length > 30 ? "long" : length > 20 ? "medium" : "short";

//     return sizeMap[sizeKey][category][lengthKey];
//   };

//   // Label sizes configuration
//   const labelSizes = {
//     small: {
//       name: "Small (38×21mm)",
//       width: "w-38",
//       height: "h-21",
//       fontSize: "text-[6px]",
//       titleSize: "text-[8px]",
//       margin: "p-1",
//       qrSize: 20,
//       barcodeHeight: 12,
//       previewCols: 6,
//       rowsPerPage: 10,
//       colsPerPage: 4,
//     },
//     medium: {
//       name: "Medium (50×30mm)",
//       width: "w-50",
//       height: "h-30",
//       fontSize: "text-[8px]",
//       titleSize: "text-[10px]",
//       margin: "p-1.5",
//       qrSize: 25,
//       barcodeHeight: 16,
//       previewCols: 4,
//       rowsPerPage: 7,
//       colsPerPage: 3,
//     },
//     large: {
//       name: "Large (70×40mm)",
//       width: "w-70",
//       height: "h-40",
//       fontSize: "text-[10px]",
//       titleSize: "text-[12px]",
//       margin: "p-2",
//       qrSize: 30,
//       barcodeHeight: 20,
//       previewCols: 3,
//       rowsPerPage: 5,
//       colsPerPage: 2,
//     },
//     xlarge: {
//       name: "X-Large (90×60mm)",
//       width: "w-90",
//       height: "h-60",
//       fontSize: "text-[12px]",
//       titleSize: "text-[14px]",
//       margin: "p-2.5",
//       qrSize: 35,
//       barcodeHeight: 24,
//       previewCols: 2,
//       rowsPerPage: 3,
//       colsPerPage: 2,
//     },
//   };

//   const sizeConfig = labelSizes[labelSize];

//   // Optimized Professional Label Component
//   const ProfessionalLabel = ({
//     product,
//     isMain = false,
//   }: {
//     product: Product;
//     isMain?: boolean;
//   }) => {
//     const qrData = `${product.id}|${product.sku}|${center.id}`;
//     const barcodeData = product.barcode || product.sku || product.id;

//     return (
//       <div
//         className={`${sizeConfig.width} ${
//           sizeConfig.height
//         } bg-white border border-gray-300 rounded shadow-sm relative overflow-hidden ${
//           isMain ? "ring-2 ring-blue-500 ring-offset-1" : ""
//         }`}
//         ref={isMain ? previewRef : null}
//       >
//         <div className={`h-full flex flex-col ${sizeConfig.margin}`}>
//           {/* Compact Header */}
//           <div className="text-center mb-1 pb-0.5 border-b border-gray-200">
//             <h3
//               className={`${getFontSizeClass(
//                 center.centerName,
//                 sizeConfig.titleSize,
//                 true
//               )} font-bold text-gray-900 leading-tight truncate`}
//             >
//               {truncateText(center.centerName, 25, "general")}
//             </h3>
//             <p className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}>
//               Medical Center
//             </p>
//           </div>

//           {/* Main Content */}
//           <div className="flex-1 overflow-hidden">
//             {/* Product Name - Adjusted based on available space */}
//             <div className="mb-1">
//               <h4
//                 className={`${getFontSizeClass(
//                   product.name,
//                   sizeConfig.titleSize,
//                   true
//                 )} font-bold text-gray-900 leading-tight line-clamp-2`}
//               >
//                 {product.name}
//               </h4>
//             </div>

//             {/* Details Row */}
//             <div className="flex justify-between items-center mb-1">
//               <span
//                 className={`${sizeConfig.fontSize} font-semibold text-gray-700 truncate`}
//               >
//                 SKU: {product.sku}
//               </span>
//               {includeBatch && product.batchNumber && (
//                 <span
//                   className={`${sizeConfig.fontSize} text-gray-600 truncate ml-1`}
//                 >
//                   {truncateText(`B:${product.batchNumber}`, 8, "sku")}
//                 </span>
//               )}
//             </div>

//             {/* Optional Fields */}
//             {includeManufacturer && product.manufacturer && (
//               <p
//                 className={`${sizeConfig.fontSize} text-gray-600 truncate mb-1`}
//               >
//                 {truncateText(product.manufacturer, 20, "general")}
//               </p>
//             )}

//             {includeBrand && product.brand && (
//               <p
//                 className={`${sizeConfig.fontSize} text-gray-700 truncate mb-0.5`}
//               >
//                 {truncateText(product.brand, 15, "general")}
//               </p>
//             )}

//             {includeLocation && product.location && (
//               <p
//                 className={`${sizeConfig.fontSize} text-gray-600 truncate mb-0.5 flex items-center gap-0.5`}
//               >
//                 <span className="text-[6px]">📍</span>{" "}
//                 {truncateText(product.location, 15, "general")}
//               </p>
//             )}
//           </div>

//           {/* Barcode & QR Code Area */}
//           <div className="mt-1">
//             {includeBarcode && barcodeData && (
//               <div className="mb-1">
//                 <div className="flex justify-center bg-white">
//                   <div className="scale-75 origin-center">
//                     <BarcodeComponent
//                       value={barcodeData}
//                       format="CODE128"
//                       width={1.2}
//                       height={sizeConfig.barcodeHeight}
//                       fontSize={8}
//                       background="transparent"
//                       margin={0}
//                     />
//                   </div>
//                 </div>
//                 <p
//                   className={`${sizeConfig.fontSize} text-center text-gray-700 font-mono truncate`}
//                 >
//                   {truncateText(barcodeData, 20, "sku")}
//                 </p>
//               </div>
//             )}

//             {includeQR && (
//               <div className="absolute bottom-1 right-1">
//                 <QRCodeCanvas
//                   value={qrData}
//                   size={sizeConfig.qrSize}
//                   level="M"
//                   includeMargin={false}
//                   bgColor="#FFFFFF"
//                   fgColor="#000000"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Bottom Section - Price & Expiry */}
//           <div className="mt-auto pt-1 border-t border-gray-200">
//             <div className="flex justify-between items-center">
//               {includePrice && (
//                 <div className="flex-1 text-center">
//                   <p
//                     className={`${sizeConfig.titleSize} font-bold text-green-700 leading-tight`}
//                   >
//                     {formatCurrency(product.sellingPrice)}
//                   </p>
//                   <p
//                     className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}
//                   >
//                     per {product.unit}
//                   </p>
//                 </div>
//               )}

//               {includeExpiry && (
//                 <div className="flex-1 text-center">
//                   <p
//                     className={`${sizeConfig.titleSize} font-bold text-red-600 leading-tight`}
//                   >
//                     {formatDate(product.expiryDate)}
//                   </p>
//                   <p
//                     className={`${sizeConfig.fontSize} text-gray-600 leading-tight`}
//                   >
//                     Exp
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             <p
//               className={`text-[5px] text-center text-gray-400 leading-tight mt-0.5`}
//             >
//               Doza Project • EBCom Tech
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Enhanced PDF Generation
//   const handleDownloadPDF = async () => {
//     if (selectedProducts.length === 0) {
//       alert("Please select at least one product to generate PDF");
//       return;
//     }

//     setIsGeneratingPDF(true);
//     setPdfProgress(0);

//     try {
//       const selected = products.filter((p) => selectedProducts.includes(p.id));
//       const pdf = new jsPDF({
//         orientation: orientation,
//         unit: "mm",
//         format: paperSize.toLowerCase() as any,
//       });

//       // Page dimensions
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();

//       // Label dimensions (in mm)
//       const labelDimensions = {
//         small: { width: 38, height: 21, fontSize: 5, titleSize: 6, margin: 1 },
//         medium: {
//           width: 50,
//           height: 30,
//           fontSize: 6,
//           titleSize: 8,
//           margin: 1.5,
//         },
//         large: { width: 70, height: 40, fontSize: 8, titleSize: 10, margin: 2 },
//         xlarge: {
//           width: 90,
//           height: 60,
//           fontSize: 10,
//           titleSize: 12,
//           margin: 2.5,
//         },
//       };

//       const dim = labelDimensions[labelSize];

//       // Calculate grid
//       const cols = Math.floor((pageWidth - 20) / (dim.width + labelSpacing));
//       const rows = Math.floor((pageHeight - 20) / (dim.height + labelSpacing));

//       let labelCount = 0;
//       const totalLabels = selected.length * copies;

//       for (const product of selected) {
//         for (let copy = 0; copy < copies; copy++) {
//           // Calculate position
//           const row = Math.floor(labelCount / cols) % rows;
//           const col = labelCount % cols;
//           const x = 10 + col * (dim.width + labelSpacing);
//           const y = 10 + row * (dim.height + labelSpacing);

//           // Add new page if needed
//           if (labelCount > 0 && labelCount % (cols * rows) === 0) {
//             pdf.addPage(paperSize.toLowerCase() as any);
//           }

//           // Draw label border
//           pdf.setDrawColor(200, 200, 200);
//           pdf.setLineWidth(0.1);
//           pdf.rect(x, y, dim.width, dim.height);

//           let currentY = y + dim.margin;

//           // Center name
//           const centerName = truncateText(center.centerName, 25);
//           pdf.setFontSize(dim.titleSize);
//           pdf.setFont("helvetica", "bold");
//           pdf.text(centerName, x + dim.width / 2, currentY, {
//             align: "center",
//             maxWidth: dim.width - 2,
//           });
//           currentY += 3;

//           pdf.setFontSize(dim.fontSize - 1);
//           pdf.setFont("helvetica", "normal");
//           pdf.text("Medical Center", x + dim.width / 2, currentY, {
//             align: "center",
//           });
//           currentY += 3;

//           // Product name (with line splitting)
//           pdf.setFontSize(dim.titleSize);
//           pdf.setFont("helvetica", "bold");
//           const productLines = pdf.splitTextToSize(product.name, dim.width - 4);
//           const maxLines = Math.min(2, productLines.length);
//           for (let i = 0; i < maxLines; i++) {
//             pdf.text(productLines[i], x + dim.width / 2, currentY, {
//               align: "center",
//             });
//             currentY += 3;
//           }

//           // SKU
//           pdf.setFontSize(dim.fontSize - 1);
//           pdf.setFont("helvetica", "normal");
//           pdf.text(`SKU: ${product.sku}`, x + dim.margin, currentY);
//           currentY += 3;

//           // Barcode
//           if (includeBarcode && product.barcode) {
//             const barcodeY = currentY;
//             const barcodeHeight = 8;
//             const barcodeWidth = dim.width - 6;
//             const barcodeX = x + 3;

//             // Create barcode canvas
//             const barcodeCanvas = document.createElement("canvas");
//             const ctx = barcodeCanvas.getContext("2d");
//             barcodeCanvas.width = barcodeWidth * 3;
//             barcodeCanvas.height = barcodeHeight * 3;

//             if (ctx) {
//               ctx.fillStyle = "#FFFFFF";
//               ctx.fillRect(0, 0, barcodeCanvas.width, barcodeCanvas.height);

//               // Simple barcode simulation
//               const code = product.barcode;
//               const barWidth = barcodeCanvas.width / (code.length * 2);
//               for (let i = 0; i < code.length; i++) {
//                 const digit = parseInt(code[i]) || 1;
//                 const barHeight =
//                   (barcodeCanvas.height - 10) * (0.3 + digit * 0.07);
//                 const barX = i * barWidth * 2;
//                 ctx.fillStyle = "#000000";
//                 ctx.fillRect(barX, 10, barWidth * 1.2, barHeight);
//               }

//               // Add barcode text
//               ctx.fillStyle = "#000000";
//               ctx.font = "12px monospace";
//               ctx.textAlign = "center";
//               ctx.fillText(
//                 code,
//                 barcodeCanvas.width / 2,
//                 barcodeCanvas.height - 2
//               );
//             }

//             pdf.addImage(
//               barcodeCanvas,
//               "PNG",
//               barcodeX,
//               barcodeY,
//               barcodeWidth,
//               barcodeHeight
//             );
//             currentY += barcodeHeight + 2;
//           }

//           // QR Code
//           if (includeQR) {
//             const qrSize = 12;
//             const qrX = x + dim.width - qrSize - dim.margin;
//             const qrY =
//               y + dim.height - qrSize - dim.margin - (includePrice ? 8 : 0);

//             try {
//               const qrData = `${product.id}|${product.sku}|${center.id}`;
//               const qrCanvas = document.createElement("canvas");
//               await QRCode.toCanvas(qrCanvas, qrData, {
//                 width: qrSize * 3,
//                 margin: 0,
//                 color: { dark: "#000000", light: "#FFFFFF" },
//               });
//               pdf.addImage(qrCanvas, "PNG", qrX, qrY, qrSize, qrSize);
//             } catch (error) {
//               console.warn("QR code generation failed, skipping...");
//             }
//           }

//           // Price
//           if (includePrice) {
//             const priceY = y + dim.height - 6;
//             pdf.setFontSize(dim.fontSize);
//             pdf.setFont("helvetica", "bold");
//             pdf.setTextColor(0, 100, 0);
//             pdf.text(
//               formatCurrency(product.sellingPrice),
//               x + dim.width / 2,
//               priceY,
//               { align: "center" }
//             );
//             pdf.setTextColor(0, 0, 0);
//           }

//           // Expiry
//           if (includeExpiry) {
//             const expiryY = y + dim.height - 3;
//             const expiryDate = formatDate(product.expiryDate);
//             pdf.setFontSize(dim.fontSize - 1);
//             pdf.setFont("helvetica", "bold");
//             pdf.setTextColor(200, 0, 0);
//             pdf.text(`Exp: ${expiryDate}`, x + dim.width / 2, expiryY, {
//               align: "center",
//             });
//             pdf.setTextColor(0, 0, 0);
//           }

//           // Footer
//           pdf.setFontSize(4);
//           pdf.setFont("helvetica", "normal");
//           pdf.setTextColor(100, 100, 100);
//           pdf.text(
//             "Doza Project • EBCom Technologies",
//             x + dim.width / 2,
//             y + dim.height - 1,
//             { align: "center" }
//           );

//           labelCount++;
//           setPdfProgress(Math.round((labelCount / totalLabels) * 100));
//         }
//       }

//       // Save PDF
//       pdf.save(`labels-${new Date().toISOString().split("T")[0]}.pdf`);
//     } catch (error) {
//       console.error("Error generating PDF:", error);
//       alert("Failed to generate PDF. Please try again.");
//     } finally {
//       setIsGeneratingPDF(false);
//       setPdfProgress(0);
//     }
//   };

//   // Get selected count and calculations
//   const selectedCount = selectedProducts.length;
//   const totalLabels = selectedCount * copies;
//   const labelsPerPage = sizeConfig.rowsPerPage * sizeConfig.colsPerPage;
//   const totalPages = Math.ceil(totalLabels / labelsPerPage);

//   // Compact Product List
//   const CompactProductList = () => (
//     <div className="bg-gray-50 rounded-lg p-4">
//       <div className="flex items-center justify-between mb-3">
//         <h3 className="font-medium text-gray-900">
//           Products ({selectedCount})
//         </h3>
//         <button
//           onClick={toggleAll}
//           className="text-sm text-blue-600 hover:text-blue-700"
//         >
//           {selectedProducts.length === products.length
//             ? "Deselect All"
//             : "Select All"}
//         </button>
//       </div>
//       <div className="space-y-2 max-h-60 overflow-y-auto">
//         {products.slice(0, 8).map((product) => (
//           <div
//             key={product.id}
//             className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
//               selectedProducts.includes(product.id)
//                 ? "bg-blue-50 border-blue-300"
//                 : "bg-white border-gray-200 hover:border-gray-300"
//             }`}
//             onClick={() => toggleProduct(product.id)}
//           >
//             <input
//               type="checkbox"
//               checked={selectedProducts.includes(product.id)}
//               readOnly
//               className="w-4 h-4 text-blue-600 rounded border-gray-300"
//             />
//             <div className="ml-3 flex-1 min-w-0">
//               <p className="text-sm font-medium text-gray-900 truncate">
//                 {product.name}
//               </p>
//               <div className="flex items-center justify-between text-xs text-gray-600">
//                 <span>SKU: {product.sku}</span>
//                 <span>
//                   {product.quantity} {product.unit}
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//         {products.length > 8 && (
//           <p className="text-xs text-gray-500 text-center py-2">
//             + {products.length - 8} more products
//           </p>
//         )}
//       </div>
//     </div>
//   );

//   // Content Options - Fixed version
//   const ContentOptions = () => (
//     <div className="bg-gray-50 rounded-lg p-4">
//       <h3 className="font-medium text-gray-900 mb-3">Label Content</h3>
//       <div className="grid grid-cols-2 gap-2">
//         {[
//           { key: "includeQR", label: "QR Code", Icon: QrCode },
//           { key: "includeBarcode", label: "Barcode", Icon: Barcode },
//           { key: "includePrice", label: "Price", Icon: DollarSign },
//           { key: "includeExpiry", label: "Expiry", Icon: Calendar },
//           { key: "includeBatch", label: "Batch", Icon: HashIcon },
//           { key: "includeBrand", label: "Brand", Icon: Tag },
//           { key: "includeLocation", label: "Location", emoji: "📍" },
//           { key: "includeManufacturer", label: "Manufacturer", Icon: Package },
//         ].map(({ key, label, Icon, emoji }) => (
//           <label
//             key={key}
//             className="flex items-center p-2 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
//           >
//             <input
//               type="checkbox"
//               checked={eval(key)}
//               onChange={(e) => {
//                 const setter = eval(
//                   `set${key.charAt(0).toUpperCase() + key.slice(1)}`
//                 );
//                 setter(e.target.checked);
//               }}
//               className="w-4 h-4 text-blue-600 rounded border-gray-300"
//             />
//             <span className="ml-2 text-sm text-gray-700 flex items-center gap-1.5">
//               {emoji ? emoji : Icon ? <Icon className="w-3.5 h-3.5" /> : null}
//               {label}
//             </span>
//           </label>
//         ))}
//       </div>
//     </div>
//   );
//   // Print Settings
//   const PrintSettings = () => (
//     <div className="bg-gray-50 rounded-lg p-4">
//       <h3 className="font-medium text-gray-900 mb-3">Print Settings</h3>
//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm text-gray-700 mb-2">Paper Size</label>
//           <div className="grid grid-cols-3 gap-2">
//             {(["A4", "Letter", "A5"] as const).map((size) => (
//               <button
//                 key={size}
//                 onClick={() => setPaperSize(size)}
//                 className={`px-3 py-2 text-sm rounded border ${
//                   paperSize === size
//                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                     : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
//                 }`}
//               >
//                 {size}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm text-gray-700 mb-2">Label Size</label>
//           <div className="grid grid-cols-4 gap-2">
//             {Object.entries(labelSizes).map(([key, config]) => (
//               <button
//                 key={key}
//                 onClick={() => setLabelSize(key as any)}
//                 className={`px-2 py-1.5 text-xs rounded border ${
//                   labelSize === key
//                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                     : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
//                 }`}
//               >
//                 {config.name.split(" ")[0]}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div>
//           <div className="flex items-center justify-between mb-2">
//             <label className="text-sm text-gray-700">Copies: {copies}</label>
//           </div>
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => setCopies(Math.max(1, copies - 1))}
//               className="w-8 h-8 rounded-full border text-gray-700 border-gray-300 flex items-center justify-center hover:bg-gray-50"
//             >
//               -
//             </button>
//             <input
//               type="range"
//               min="1"
//               max="10"
//               value={copies}
//               onChange={(e) => setCopies(parseInt(e.target.value))}
//               className="flex-1"
//             />
//             <button
//               onClick={() => setCopies(Math.min(10, copies + 1))}
//               className="w-8 h-8 rounded-full border text-gray-700 border-gray-300 flex items-center justify-center hover:bg-gray-50"
//             >
//               +
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-green-900 to-green-800 text-white p-6">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h2 className="text-xl font-bold flex items-center gap-2">
//                 <Printer className="w-5 h-5" />
//                 Print Product Labels
//               </h2>
//               <p className="text-gray-300 mt-1">
//                 {selectedCount} products selected • {totalLabels} labels •{" "}
//                 {totalPages} pages
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto p-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Left Panel - Settings */}
//             <div className="lg:col-span-1 space-y-6">
//               <PrintSettings />
//               <ContentOptions />
//               <CompactProductList />
//             </div>

//             {/* Right Panel - Preview */}
//             <div className="lg:col-span-2">
//               {/* Main Preview */}
//               <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="font-semibold text-gray-900">Label Preview</h3>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm text-gray-600">
//                       Size: {sizeConfig.name}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex flex-col items-center">
//                   <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
//                     {selectedProductForPreview && (
//                       <ProfessionalLabel
//                         product={selectedProductForPreview}
//                         isMain={true}
//                       />
//                     )}
//                   </div>

//                   {selectedProductForPreview && (
//                     <div className="text-center">
//                       <p className="font-medium text-gray-900 mb-1">
//                         {truncateText(
//                           selectedProductForPreview.name,
//                           40,
//                           "name"
//                         )}
//                       </p>
//                       <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
//                         <span>SKU: {selectedProductForPreview.sku}</span>
//                         <span>
//                           Price:{" "}
//                           {formatCurrency(
//                             selectedProductForPreview.sellingPrice
//                           )}
//                         </span>
//                         <span>
//                           Exp:{" "}
//                           {formatDate(selectedProductForPreview.expiryDate)}
//                         </span>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Quick Stats */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
//                   <p className="text-sm text-gray-600 mb-1">Total Labels</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {totalLabels}
//                   </p>
//                 </div>
//                 <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
//                   <p className="text-sm text-gray-600 mb-1">Pages Needed</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {totalPages}
//                   </p>
//                 </div>
//                 <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
//                   <p className="text-sm text-gray-600 mb-1">Labels/Page</p>
//                   <p className="text-2xl font-bold text-gray-900">
//                     {labelsPerPage}
//                   </p>
//                 </div>
//                 <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
//                   <p className="text-sm text-gray-600 mb-1">Paper</p>
//                   <p className="text-lg font-bold text-gray-900">{paperSize}</p>
//                 </div>
//               </div>

//               {/* PDF Progress */}
//               {isGeneratingPDF && (
//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-3">
//                       <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
//                       <div>
//                         <p className="font-medium text-blue-900">
//                           Generating PDF
//                         </p>
//                         <p className="text-sm text-blue-700">
//                           {pdfProgress}% complete
//                         </p>
//                       </div>
//                     </div>
//                     <span className="font-bold text-blue-900">
//                       {pdfProgress}%
//                     </span>
//                   </div>
//                   <div className="w-full bg-blue-200 rounded-full h-2">
//                     <div
//                       className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//                       style={{ width: `${pdfProgress}%` }}
//                     />
//                   </div>
//                 </div>
//               )}

//               {/* Action Buttons */}
//               <div className="flex flex-col sm:flex-row gap-3">
//                 <button
//                   onClick={onClose}
//                   className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDownloadPDF}
//                   disabled={selectedProducts.length === 0 || isGeneratingPDF}
//                   className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 >
//                   {isGeneratingPDF ? (
//                     <>
//                       <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                       Generating PDF...
//                     </>
//                   ) : (
//                     <>
//                       <Download className="w-5 h-5" />
//                       Download PDF
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={handlePrint}
//                   disabled={selectedProducts.length === 0 || isGeneratingPDF}
//                   className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 >
//                   <Printer className="w-5 h-5" />
//                   Print {totalLabels} Labels
//                 </button>
//               </div>

//               {/* Help Text */}
//               <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
//                 <p className="text-sm text-amber-800">
//                   💡 <strong>Printing Tip:</strong> For best results, use
//                   adhesive label paper and set your printer to "High Quality"
//                   mode.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// interface SupplierFormModalProps {
//   supplierForm: SupplierFormData;
//   selectedSupplier: Supplier | null;
//   onClose: () => void;
//   onSave: () => void;
//   onFormChange: (field: keyof SupplierFormData, value: string) => void;
// }

// export const SupplierFormModal = ({
//   supplierForm,
//   selectedSupplier,
//   onClose,
//   onSave,
//   onFormChange,
// }: SupplierFormModalProps) => {
//   return (
//     <ModalWrapper onClose={onClose}>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-2xl mx-auto shadow-2xl">
//         <div className="border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-base md:text-xl font-bold text-gray-900">
//                 {selectedSupplier ? "Edit Supplier" : "Add Supplier"}
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5">
//                 {selectedSupplier?.code || "Enter supplier details"}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Supplier Code <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.code}
//                 onChange={(e) => onFormChange("code", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 required
//                 placeholder="e.g., SUP001"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Supplier Name <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.name}
//                 onChange={(e) => onFormChange("name", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 required
//                 placeholder="Enter supplier name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Contact Person <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.contactPerson}
//                 onChange={(e) => onFormChange("contactPerson", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 required
//                 placeholder="Enter contact name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Phone <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="tel"
//                 value={supplierForm.phone}
//                 onChange={(e) => onFormChange("phone", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 required
//                 placeholder="+234 800 000 0000"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 value={supplierForm.email}
//                 onChange={(e) => onFormChange("email", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="supplier@example.com"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Address
//               </label>
//               <textarea
//                 value={supplierForm.address}
//                 onChange={(e) => onFormChange("address", e.target.value)}
//                 rows={2}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
//                 placeholder="Enter complete address"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 City
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.city}
//                 onChange={(e) => onFormChange("city", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="City"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 State
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.state}
//                 onChange={(e) => onFormChange("state", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="State"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Payment Terms
//               </label>
//               <input
//                 type="text"
//                 value={supplierForm.paymentTerms}
//                 onChange={(e) => onFormChange("paymentTerms", e.target.value)}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                 placeholder="e.g., Net 30, COD, 50% Advance"
//               />
//             </div>

//             <div className="md:col-span-2">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Notes
//               </label>
//               <textarea
//                 value={supplierForm.notes}
//                 onChange={(e) => onFormChange("notes", e.target.value)}
//                 rows={3}
//                 className="w-full px-3 md:px-4 py-2.5 text-gray-900 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
//                 placeholder="Additional notes about this supplier..."
//               />
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-gray-200 p-4 md:p-6">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={onClose}
//               className="flex-1 px-4 py-3.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={onSave}
//               className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all"
//             >
//               {selectedSupplier ? "Update Supplier" : "Add Supplier"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };

// // Enhanced Scanner Modal
// export const ScannerModal = ({
//   onClose,
//   onScan,
//   onManualEntry,
// }: {
//   onClose: () => void;
//   onScan: (barcode: string, type: string) => void;
//   onManualEntry: (barcode: string) => void;
// }) => {
//   const [scanMode, setScanMode] = useState<"barcode" | "qr" | "manual">(
//     "barcode"
//   );
//   const [manualBarcode, setManualBarcode] = useState("");
//   const [scannerInput, setScannerInput] = useState("");
//   const [scannerTimeout, setScannerTimeout] = useState<NodeJS.Timeout | null>(
//     null
//   );
//   const [isScanning, setIsScanning] = useState(false);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const manualInputRef = useRef<HTMLInputElement>(null);

//   // Handle barcode scanner input
//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       // Ignore if we're in manual mode and input is focused
//       if (
//         scanMode === "manual" &&
//         document.activeElement === manualInputRef.current
//       ) {
//         return;
//       }

//       // Barcode scanners typically send characters quickly
//       if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
//         setScannerInput((prev) => prev + e.key);
//         setIsScanning(true);

//         // Reset the timer
//         if (scannerTimeout) {
//           clearTimeout(scannerTimeout);
//         }

//         // Set a timeout to detect end of barcode input
//         const timeout = setTimeout(() => {
//           if (scannerInput.length >= 4) {
//             // Minimum barcode length
//             onScan(scannerInput, scanMode === "barcode" ? "EAN13" : "QR");
//             onClose();
//           }
//           setScannerInput("");
//           setIsScanning(false);
//         }, 100);
//         setScannerTimeout(timeout);
//       } else if (e.key === "Enter") {
//         // Many scanners send Enter after barcode
//         if (scannerInput.length >= 4) {
//           e.preventDefault();
//           onScan(scannerInput, scanMode === "barcode" ? "EAN13" : "QR");
//           onClose();
//         }
//         setScannerInput("");
//         setIsScanning(false);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);

//     return () => {
//       window.removeEventListener("keydown", handleKeyDown);
//       if (scannerTimeout) {
//         clearTimeout(scannerTimeout);
//       }
//     };
//   }, [scanMode, scannerInput, scannerTimeout, onScan, onClose]);

//   const handleManualSubmit = () => {
//     if (manualBarcode.trim()) {
//       onScan(manualBarcode, "CUSTOM");
//       onClose();
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter") {
//       handleManualSubmit();
//     }
//   };

//   return (
//     <ModalWrapper onClose={onClose}>
//       <div className="bg-white rounded-xl md:rounded-2xl w-full max-w-md mx-auto shadow-2xl">
//         <div className="border-b border-gray-200 p-4 md:p-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-base md:text-xl font-bold text-gray-900">
//                 Scan Product
//               </h2>
//               <p className="text-xs md:text-sm text-gray-600 mt-0.5">
//                 Scan barcode or QR code
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="ml-2 p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
//               aria-label="Close"
//             >
//               <X className="w-5 h-5 text-gray-700" />
//             </button>
//           </div>
//         </div>

//         <div className="p-4 md:p-6">
//           {/* Scan Mode Selection */}
//           <div className="flex gap-2 mb-6">
//             <button
//               onClick={() => setScanMode("barcode")}
//               className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
//                 scanMode === "barcode"
//                   ? "bg-blue-50 border-blue-400 text-blue-700"
//                   : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
//               }`}
//             >
//               <Barcode className="w-6 h-6 mb-2" />
//               <span className="text-sm font-medium">Barcode</span>
//             </button>
//             <button
//               onClick={() => setScanMode("qr")}
//               className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
//                 scanMode === "qr"
//                   ? "bg-purple-50 border-purple-400 text-purple-700"
//                   : "bg-white border-gray-300 text-gray-700 hover:border-purple-300"
//               }`}
//             >
//               <QrCode className="w-6 h-6 mb-2" />
//               <span className="text-sm font-medium">QR Code</span>
//             </button>
//             <button
//               onClick={() => setScanMode("manual")}
//               className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
//                 scanMode === "manual"
//                   ? "bg-emerald-50 border-emerald-400 text-emerald-700"
//                   : "bg-white border-gray-300 text-gray-700 hover:border-emerald-300"
//               }`}
//             >
//               <Camera className="w-6 h-6 mb-2" />
//               <span className="text-sm font-medium">Manual</span>
//             </button>
//           </div>

//           {/* Scanner Status */}
//           <div
//             className={`mb-4 p-3 rounded-lg ${
//               isScanning
//                 ? "bg-emerald-50 border border-emerald-200"
//                 : "bg-blue-50 border border-blue-200"
//             }`}
//           >
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-900">
//                   {scanMode === "manual"
//                     ? "Type barcode or scan with connected scanner"
//                     : isScanning
//                     ? "Scanning..."
//                     : "Ready to scan - use your barcode scanner"}
//                 </p>
//                 {scanMode !== "manual" && (
//                   <p className="text-xs text-gray-600 mt-1">
//                     Scanner input:{" "}
//                     <span className="font-mono font-bold">
//                       {scannerInput || "Waiting..."}
//                     </span>
//                   </p>
//                 )}
//               </div>
//               {isScanning && (
//                 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
//               )}
//             </div>
//           </div>

//           {/* Scanner Area */}
//           {scanMode === "manual" ? (
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Enter Barcode/QR Code
//                 </label>
//                 <input
//                   ref={manualInputRef}
//                   type="text"
//                   value={manualBarcode}
//                   onChange={(e) => setManualBarcode(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="Enter barcode manually or scan here"
//                   className="w-full px-4 py-3 text-lg text-gray-900 font-mono bg-white border-2 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
//                   autoFocus
//                 />
//               </div>
//               <button
//                 onClick={handleManualSubmit}
//                 disabled={!manualBarcode.trim()}
//                 className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 rounded-lg hover:from-emerald-700 hover:to-green-700 font-medium shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Submit Barcode
//               </button>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {/* Test barcodes for simulation */}
//               <div>
//                 <p className="text-sm font-medium text-gray-700 mb-3">
//                   Test with sample barcodes:
//                 </p>
//                 <div className="grid grid-cols-2 gap-2">
//                   {[
//                     { code: "123456789012", type: "EAN13" },
//                     { code: "9780545010221", type: "ISBN" },
//                     { code: "6922266446188", type: "EAN13" },
//                     { code: "5901234123457", type: "UPC" },
//                   ].map((barcode) => (
//                     <button
//                       key={barcode.code}
//                       onClick={() => {
//                         onScan(
//                           barcode.code,
//                           scanMode === "barcode" ? "EAN13" : "QR"
//                         );
//                         onClose();
//                       }}
//                       className="px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
//                     >
//                       <div className="font-mono font-bold">{barcode.code}</div>
//                       <div className="text-xs text-gray-600">
//                         {barcode.type}
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Quick Actions */}
//               <div className="flex gap-2">
//                 <button
//                   onClick={onClose}
//                   className="flex-1 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     setScanMode("manual");
//                     manualInputRef.current?.focus();
//                   }}
//                   className="flex-1 py-2.5 border-2 border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 font-medium transition-colors"
//                 >
//                   Switch to Manual
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="border-t border-gray-200 p-4">
//           <div className="text-xs text-gray-600">
//             <p className="font-medium mb-2 text-gray-700">Scanner Tips:</p>
//             <ul className="space-y-1">
//               <li className="flex items-start gap-2">
//                 <span className="text-emerald-600 mt-0.5">•</span>
//                 <span>USB/Bluetooth barcode scanners work automatically</span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-emerald-600 mt-0.5">•</span>
//                 <span>For manual mode, type or scan into the input field</span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-emerald-600 mt-0.5">•</span>
//                 <span>Test with sample barcodes above</span>
//               </li>
//               <li className="flex items-start gap-2">
//                 <span className="text-emerald-600 mt-0.5">•</span>
//                 <span>Press Enter to submit in manual mode</span>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </ModalWrapper>
//   );
// };
