import { useState } from "react";
import {
  Package,
  Edit3,
  RefreshCw,
  Eye,
  Scan,
  Stethoscope,
  Hash,
  Barcode,
  ChevronDown,
  ChevronUp,
  Pill,
  Clock,
  Tag,
  TrendingDown,
  TrendingUp,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { Product } from "../../types/pharmacy";
import Image from "next/image";

interface ProductTableProps {
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
  onViewAuditLogs: (productId: string) => void;
  onOpenScanner: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getStockStatusColor: (product: Product) => string;
  getExpiryStatus: (expiryDate: string) => { color: string; text: string };
}

export const ProductTable = ({
  products,
  filteredProducts,
  loading,
  onEditProduct,
  onAdjustStock,
  onViewAuditLogs,
  onOpenScanner,
  formatCurrency,
  formatDate,
  getStockStatusColor,
  getExpiryStatus,
}: ProductTableProps) => {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const toggleExpand = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-[3px] border-emerald-200 border-t-emerald-600"></div>
            {/* <Package className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" /> */}
            <Image
              alt="Doza Logo"
              src={"/logo.png"}
              height={30}
              width={30}
              className="w-8 h-8 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            />
          </div>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Loading Inventory...</p>
            <p className="text-sm text-gray-500 mt-1">Fetching your products</p>
          </div>
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any products matching your search or filters
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                // Clear search and filters
                window.location.reload();
              }}
              className="px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
            >
              Clear Filters
            </button>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm"
            >
              <Scan className="w-4 h-4 inline mr-2" />
              Scan New Product
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Header - Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Inventory Products
            </h3>
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-gray-600">In Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-gray-600">Low Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Out of Stock</span>
              </div>
            </div>
            <button
              onClick={onOpenScanner}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm flex items-center gap-2"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <th className="py-4 px-6 text-left">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Product Details
                    {sortField === "name" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 text-left">
                  <button
                    onClick={() => handleSort("sku")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    SKU / Barcode
                    {sortField === "sku" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 text-left">
                  <button
                    onClick={() => handleSort("quantity")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Stock Status
                    {sortField === "quantity" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 text-left">
                  <button
                    onClick={() => handleSort("sellingPrice")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Pricing
                    {sortField === "sellingPrice" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 text-left">
                  <button
                    onClick={() => handleSort("expiryDate")}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                  >
                    Expiry
                    {sortField === "expiryDate" && (
                      <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const expiryStatus = getExpiryStatus(product.expiryDate);
                const isLowStock = product.quantity <= product.reorderLevel;
                const isOutOfStock = product.quantity === 0;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Product Details */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`relative p-3 rounded-xl ${
                            product.isMedicalEquipment
                              ? "bg-gradient-to-br from-purple-100 to-purple-50"
                              : "bg-gradient-to-br from-emerald-100 to-emerald-50"
                          }`}
                        >
                          {product.isMedicalEquipment ? (
                            <Stethoscope className="w-6 h-6 text-purple-600" />
                          ) : (
                            <Package className="w-6 h-6 text-emerald-600" />
                          )}
                          {product.prescriptionRequired && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <Pill className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                  {product.category}
                                </span>
                                {product.isMedicalEquipment && (
                                  <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                                    Equipment
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* {product.lastRestocked && (
                              <div className="text-right hidden xl:block">
                                <p className="text-xs text-gray-500">
                                  Last Restocked
                                </p>
                                <p className="text-sm font-medium text-gray-700">
                                  {formatDate(product.lastRestocked)}
                                </p>
                              </div>
                            )} */}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SKU/Barcode */}
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Hash className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                          <code className="text-sm font-mono text-gray-800 bg-gray-50 px-2 py-1 rounded">
                            {product.sku}
                          </code>
                        </div>
                        {product.barcode && (
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-50 rounded-lg">
                              <Barcode className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {product.barcode}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Stock Status */}
                    <td className="py-4 px-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {product.quantity}
                            </span>
                            <span className="text-sm text-gray-500">
                              {product.unit}
                            </span>
                          </div>
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStockStatusColor(
                              product
                            )}`}
                          >
                            {isOutOfStock
                              ? "Out of Stock"
                              : isLowStock
                              ? "Low Stock"
                              : "In Stock"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Reorder Level: {product.reorderLevel}</span>
                            <span>Stock Level</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isOutOfStock
                                  ? "bg-red-500"
                                  : isLowStock
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (product.quantity /
                                    (product.reorderLevel * 4)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(product.sellingPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1 bg-gray-100 rounded">
                            <TrendingUp className="w-3 h-3 text-gray-600" />
                          </div>
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium text-gray-700">
                            {formatCurrency(product.unitPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1 bg-emerald-100 rounded">
                            <TrendingDown className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="text-gray-600">Margin:</span>
                          <span className="font-medium text-emerald-700">
                            {Math.round(
                              ((product.sellingPrice - product.unitPrice) /
                                product.unitPrice) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Expiry */}
                    <td className="py-4 px-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span
                            className={`font-medium ${
                              expiryStatus.text === "Expired"
                                ? "text-red-600"
                                : expiryStatus.text === "Expiring Soon"
                                ? "text-amber-600"
                                : "text-gray-900"
                            }`}
                          >
                            {formatDate(product.expiryDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${expiryStatus.color}`}
                          >
                            {expiryStatus.text}
                          </span>
                          {expiryStatus.text === "Expired" && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onViewAuditLogs(product.id)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Audit Logs"
                          aria-label="View audit logs"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Edit Product"
                          aria-label="Edit product"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onAdjustStock(product)}
                          className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Adjust Stock"
                          aria-label="Adjust stock"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                        <div className="relative group">
                          <button
                            className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            title="More Actions"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                            <button
                              onClick={onOpenScanner}
                              className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Scan className="w-4 h-4" />
                              Scan
                            </button>
                            <button
                              onClick={() => {
                                // Add to quick order
                              }}
                              className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Package className="w-4 h-4" />
                              Quick Order
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile & Tablet Cards */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((product) => {
          const expiryStatus = getExpiryStatus(product.expiryDate);
          const isExpanded = expandedProduct === product.id;
          const isLowStock = product.quantity <= product.reorderLevel;
          const isOutOfStock = product.quantity === 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Card Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpand(product.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Side: Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <div
                        className={`relative p-3 rounded-xl ${
                          product.isMedicalEquipment
                            ? "bg-gradient-to-br from-purple-100 to-purple-50"
                            : "bg-gradient-to-br from-emerald-100 to-emerald-50"
                        }`}
                      >
                        {product.isMedicalEquipment ? (
                          <Stethoscope className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Package className="w-5 h-5 text-emerald-600" />
                        )}
                        {product.prescriptionRequired && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <Pill className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {product.category}
                          </span>
                          {product.isMedicalEquipment && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                              Equipment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Stock</p>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {product.quantity}
                          </span>
                          <span className="text-sm text-gray-500">
                            {product.unit}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(
                              product
                            )}`}
                          >
                            {isOutOfStock ? "Out" : isLowStock ? "Low" : "Good"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Expand Button */}
                  <div className="flex flex-col items-end gap-3">
                    <button
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(product.id);
                      }}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4">
                  <div className="space-y-4">
                    {/* Product Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          SKU
                        </p>
                        <p className="font-mono text-sm font-medium text-gray-900">
                          {product.sku}
                        </p>
                      </div>
                      {product.barcode && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            Barcode
                          </p>
                          <p className="font-mono text-sm font-medium text-gray-900">
                            {product.barcode}
                          </p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expiry
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              expiryStatus.text === "Expired"
                                ? "text-red-600"
                                : expiryStatus.text === "Expiring Soon"
                                ? "text-amber-600"
                                : "text-gray-900"
                            }`}
                          >
                            {formatDate(product.expiryDate)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${expiryStatus.color}`}
                          >
                            {expiryStatus.text}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Cost Price</p>
                        <p className="font-medium text-gray-700">
                          {formatCurrency(product.unitPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Stock Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Stock Level</span>
                        <span>Reorder at {product.reorderLevel}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            isOutOfStock
                              ? "bg-red-500"
                              : isLowStock
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              (product.quantity / (product.reorderLevel * 4)) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button
                        onClick={() => onViewAuditLogs(product.id)}
                        className="py-2.5 px-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">Logs</span>
                      </button>
                      <button
                        onClick={() => onEditProduct(product)}
                        className="py-2.5 px-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors flex flex-col items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="text-xs font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => onAdjustStock(product)}
                        className="py-2.5 px-3 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors flex flex-col items-center gap-1"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-xs font-medium">Stock</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Helper component for search icon (used in loading state)
const Search = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);
