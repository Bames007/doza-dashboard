import {
  Camera,
  Barcode,
  Printer,
  AlertTriangle,
  Package,
  Search,
  Smartphone,
  ClipboardCheck,
  Settings,
  TrendingDown,
} from "lucide-react";

interface QuickActionsProps {
  onScanProduct: () => void;
  onGenerateBarcode: () => void;
  onPrintLabels: () => void;
  onLowStockReport: () => void;
  onCheckInventory?: () => void;
  onManageProducts?: () => void;
  onStockAdjustment?: () => void;
}

export const QuickActions = ({
  onScanProduct,
  onGenerateBarcode,
  onPrintLabels,
  onLowStockReport,
  onCheckInventory,
  onManageProducts,
  onStockAdjustment,
}: QuickActionsProps) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      {/* Header with context */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Inventory Actions
            </h3>
            <p className="text-sm text-gray-500">
              Quick access to essential inventory tasks
            </p>
          </div>
          <div className="hidden sm:block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            Medical/Retail
          </div>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
        {/* Scan Product - Primary Action */}
        <button
          onClick={onScanProduct}
          className="group flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all active:scale-95 border border-blue-100"
        >
          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-800 text-center">
            Scan Product
          </span>
          <span className="text-xs text-gray-500 text-center">Barcode/QR</span>
        </button>

        {/* Generate Barcode */}
        <button
          onClick={onGenerateBarcode}
          className="group flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all active:scale-95 border border-purple-100"
        >
          <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
            <Barcode className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-800 text-center">
            Generate Code
          </span>
          <span className="text-xs text-gray-500 text-center">
            Barcode/Label
          </span>
        </button>

        {/* Print Labels */}
        <button
          onClick={onPrintLabels}
          className="group flex flex-col items-center justify-center gap-2 p-4 bg-cyan-50 hover:bg-cyan-100 rounded-xl transition-all active:scale-95 border border-cyan-100"
        >
          <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
            <Printer className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-sm font-medium text-gray-800 text-center">
            Print Labels
          </span>
          <span className="text-xs text-gray-500 text-center">
            Batch printing
          </span>
        </button>

        {/* Low Stock Report */}
        <button
          onClick={onLowStockReport}
          className="group flex flex-col items-center justify-center gap-2 p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all active:scale-95 border border-amber-100"
        >
          <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-gray-800 text-center">
            Low Stock
          </span>
          <span className="text-xs text-gray-500 text-center">
            Reorder alert
          </span>
        </button>
      </div>

      {/* Secondary Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {onCheckInventory && (
          <button
            onClick={onCheckInventory}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200"
          >
            <Search className="w-4 h-4" />
            <span>Check Stock</span>
          </button>
        )}

        {onManageProducts && (
          <button
            onClick={onManageProducts}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200"
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
          </button>
        )}

        {onStockAdjustment && (
          <button
            onClick={onStockAdjustment}
            className="flex items-center gap-2 px-3 py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200"
          >
            <TrendingDown className="w-4 h-4" />
            <span>Adjust Stock</span>
          </button>
        )}

        {/* Mobile Scan Action - Fixed to bottom on mobile */}
        <button
          onClick={onScanProduct}
          className="flex sm:hidden items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:bg-blue-700 transition-colors"
        >
          <Smartphone className="w-4 h-4" />
          <span>Mobile Scan</span>
        </button>
      </div>

      {/* Mobile-optimized floating action button for scanning */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={onScanProduct}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors active:scale-95"
          aria-label="Quick Scan"
        >
          <Camera className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

// Optional: Simplified version for mobile-only contexts
export const MobileQuickActions = ({
  onScanProduct,
  onGenerateBarcode,
  onPrintLabels,
  onLowStockReport,
}: QuickActionsProps) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
      </div>

      {/* Mobile-optimized vertical list */}
      <div className="space-y-2">
        <button
          onClick={onScanProduct}
          className="flex items-center justify-between w-full p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Scan Product</div>
              <div className="text-xs text-gray-500">
                Use camera to scan barcode
              </div>
            </div>
          </div>
          <div className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
            Quick
          </div>
        </button>

        <button
          onClick={onGenerateBarcode}
          className="flex items-center justify-between w-full p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Barcode className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Generate Barcode</div>
              <div className="text-xs text-gray-500">Create product labels</div>
            </div>
          </div>
        </button>

        <button
          onClick={onPrintLabels}
          className="flex items-center justify-between w-full p-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Printer className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-left">
              <div className="font-medium">Print Labels</div>
              <div className="text-xs text-gray-500">Batch printing</div>
            </div>
          </div>
        </button>

        <button
          onClick={onLowStockReport}
          className="flex items-center justify-between w-full p-3 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium">Low Stock Report</div>
              <div className="text-xs text-amber-600">
                Items need reordering
              </div>
            </div>
          </div>
          <div className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
            Alert
          </div>
        </button>
      </div>

      {/* Quick scan shortcut */}
      <button
        onClick={onScanProduct}
        className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-colors"
      >
        <Smartphone className="w-5 h-5" />
        Quick Scan with Mobile Camera
      </button>
    </div>
  );
};
