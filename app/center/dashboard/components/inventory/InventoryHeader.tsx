import { Package, Truck, Scan, Upload, Plus, QrCode } from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface InventoryHeaderProps {
  onOpenSuppliers: () => void;
  onOpenScanner: () => void;
  onOpenBulkUpload: () => void;
  onAddProduct: () => void;
  onGenerateBarcode: () => void;
}

export const InventoryHeader = ({
  onOpenSuppliers,
  onOpenScanner,
  onOpenBulkUpload,
  onAddProduct,
  onGenerateBarcode,
}: InventoryHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
      {/* Title Section */}
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl shadow-sm">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight ${bebasNeue.className}`}
            >
              Medical Inventory
            </h1>
            <p className={`text-sm text-gray-600 ${poppins.className} mt-1`}>
              Manage products, equipment & suppliers
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons - Desktop */}
      <div className="hidden lg:flex items-center gap-3">
        <button
          onClick={onOpenSuppliers}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Truck className="w-4 h-4" />
          <span className="text-sm font-medium">Suppliers</span>
        </button>

        <button
          onClick={onOpenScanner}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Scan className="w-4 h-4" />
          <span className="text-sm font-medium">Scan</span>
        </button>

        <button
          onClick={onGenerateBarcode}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">Barcode</span>
        </button>

        <button
          onClick={onOpenBulkUpload}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Bulk Upload</span>
        </button>

        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-colors shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-semibold">Add Product</span>
        </button>
      </div>

      {/* Action Buttons - Mobile */}
      <div className="lg:hidden w-full">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddProduct}
            className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-semibold">Add Product</span>
          </button>

          <div className="col-span-2 grid grid-cols-4 gap-2">
            <button
              onClick={onOpenSuppliers}
              className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Suppliers"
            >
              <Truck className="w-5 h-5" />
              <span className="text-xs font-medium">Suppliers</span>
            </button>

            <button
              onClick={onOpenScanner}
              className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Scan"
            >
              <Scan className="w-5 h-5" />
              <span className="text-xs font-medium">Scan</span>
            </button>

            <button
              onClick={onGenerateBarcode}
              className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Barcode"
            >
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-medium">Barcode</span>
            </button>

            <button
              onClick={onOpenBulkUpload}
              className="flex flex-col items-center gap-1.5 px-2 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs font-medium">Upload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
