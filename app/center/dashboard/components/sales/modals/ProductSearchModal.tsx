// app/center/components/sales/modals/ProductSearchModal.tsx
"use client";

import { FC, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Search, AlertTriangle } from "lucide-react";
import { Product } from "../../../types/pharmacy";

interface ProductSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddProduct: (product: Product) => void;
  getAvailableProductCount: (productId: string) => number;
  formatCurrency: (amount: number) => string;
}

const ProductSearchModal: FC<ProductSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  searchTerm,
  onSearchChange,
  onAddProduct,
  getAvailableProductCount,
  formatCurrency,
}) => {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

  useEffect(() => {
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.barcode?.includes(searchTerm)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handleAddProduct = (product: Product) => {
    const availableStock = getAvailableProductCount(product.id);
    if (availableStock <= 0) {
      alert(`❌ ${product.name} is out of stock!`);
      return;
    }
    onAddProduct(product);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Search Products
            </h2>
            <p className="text-gray-600 mt-1">
              {products.length} total products • {filteredProducts.length}{" "}
              filtered
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 text-gray-600 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-green-500 outline-none transition"
              autoFocus
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No products found</p>
              <p className="text-gray-400 mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const availableStock = getAvailableProductCount(product.id);
                const isOutOfStock = availableStock <= 0;
                const isLowStock = availableStock <= 5 && availableStock > 0;

                return (
                  <div
                    key={product.id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      isOutOfStock
                        ? "opacity-60 bg-gray-50 border-gray-200"
                        : "hover:shadow-md hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          SKU: {product.sku || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isOutOfStock
                            ? "bg-red-100 text-red-700"
                            : isLowStock
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : `Stock: ${availableStock}`}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(product.sellingPrice || 0)}
                      </p>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddProduct(product)}
                      disabled={isOutOfStock}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                        isOutOfStock
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Tips:</span> Use SKU or barcode for
              faster search
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductSearchModal;
