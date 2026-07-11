import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  Stethoscope,
  Scan,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Pill,
  Syringe,
  Heart,
  Brain,
  ShoppingBag,
  Package,
} from "lucide-react";
import {
  getAllCategories,
  groupedCategories,
  isMedicalEquipmentCategory,
  getCategoryGroup,
} from "../../utils/categories";

interface InventoryFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  showLowStock: boolean;
  setShowLowStock: (show: boolean) => void;
  showEquipment: boolean;
  setShowEquipment: (show: boolean) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (order: "asc" | "desc") => void;
  categories: string[]; // Keep for dynamic categories from products
  onRefresh: () => void;
  onOpenScanner: () => void;
}

export const InventoryFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  showLowStock,
  setShowLowStock,
  showEquipment,
  setShowEquipment,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  categories: dynamicCategories,
  onRefresh,
  onOpenScanner,
}: InventoryFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const staticCategories = getAllCategories();

  const allCategories = Array.from(
    new Set([...staticCategories, ...dynamicCategories])
  ).sort();

  const filteredCategories = categorySearch
    ? allCategories.filter(
        (cat) =>
          cat.toLowerCase().includes(categorySearch.toLowerCase()) ||
          getCategoryGroup(cat)
            .toLowerCase()
            .includes(categorySearch.toLowerCase())
      )
    : allCategories;

  useEffect(() => {
    let count = 0;
    if (showLowStock) count++;
    if (showEquipment) count++;
    if (selectedCategory !== "all") count++;
    if (sortBy !== "name") count++;
    setActiveFilters(count);
  }, [showLowStock, showEquipment, selectedCategory, sortBy]);

  const clearFilters = () => {
    setShowLowStock(false);
    setShowEquipment(false);
    setSelectedCategory("all");
    setSortBy("name");
    setSortOrder("asc");
    setSearchTerm("");
    setCategorySearch("");
  };

  const getCategoryIcon = (category: string) => {
    const group = getCategoryGroup(category);

    if (group.includes("Medications")) return <Pill className="w-4 h-4" />;
    if (group.includes("Equipment")) return <Stethoscope className="w-4 h-4" />;
    if (group.includes("Health & Wellness"))
      return <Heart className="w-4 h-4" />;
    if (group.includes("Personal Care")) return <Syringe className="w-4 h-4" />;
    if (group.includes("Provision")) return <ShoppingBag className="w-4 h-4" />;
    if (group.includes("Specialized")) return <Brain className="w-4 h-4" />;
    return <Package className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const group = getCategoryGroup(category);

    switch (group) {
      case "Medications":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Medical Equipment & Supplies":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Health & Wellness":
        return "bg-green-50 text-green-700 border-green-200";
      case "Personal Care":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "Provision Store Items":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Specialized Pharmacy":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-3">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Filter className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Filters</h3>
            <p className="text-xs text-gray-500">
              {activeFilters > 0
                ? `${activeFilters} active`
                : "No filters applied"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Filters Container */}
      <div className={`${isExpanded ? "block" : "hidden lg:block"} space-y-4`}>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                showLowStock
                  ? "bg-amber-50 border-amber-300 text-amber-700 shadow-sm"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Low Stock
              {showLowStock && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  ✓
                </span>
              )}
            </button>

            <button
              onClick={() => setShowEquipment(!showEquipment)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                showEquipment
                  ? "bg-purple-50 border-purple-300 text-purple-700 shadow-sm"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Equipment Only
              {showEquipment && (
                <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  ✓
                </span>
              )}
            </button>

            <button
              onClick={onOpenScanner}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md min-w-[120px]"
            >
              <Scan className="w-4 h-4" />
              <span className="font-medium">Scan</span>
            </button>

            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* Enhanced Category Filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowCategoryDropdown(!showCategoryDropdown)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  >
                    <div className="flex items-center gap-2">
                      {selectedCategory === "all" ? (
                        <>
                          <Package className="w-4 h-4" />
                          <span>All Categories</span>
                        </>
                      ) : (
                        <>
                          {getCategoryIcon(selectedCategory)}
                          <span className="truncate">{selectedCategory}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                              selectedCategory
                            )}`}
                          >
                            {getCategoryGroup(selectedCategory)}
                          </span>
                        </>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="py-2">
                        <button
                          onClick={() => {
                            setSelectedCategory("all");
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                            selectedCategory === "all"
                              ? "bg-emerald-50 text-emerald-700"
                              : ""
                          }`}
                        >
                          <Package className="w-4 h-4 text-green-600" />
                          <div>
                            <div className="font-medium text-green-600">
                              All Categories
                            </div>
                            <div className="text-xs text-gray-500">
                              Show all {allCategories.length} categories
                            </div>
                          </div>
                        </button>

                        {groupedCategories.map((group) => (
                          <div
                            key={group.group}
                            className="border-t border-gray-100"
                          >
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                              {group.group}
                            </div>
                            {group.categories
                              .filter((cat) => filteredCategories.includes(cat))
                              .map((category) => (
                                <button
                                  key={category}
                                  onClick={() => {
                                    setSelectedCategory(category);
                                    setShowCategoryDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                                    selectedCategory === category
                                      ? "bg-emerald-50 text-emerald-700"
                                      : ""
                                  }`}
                                >
                                  <div className="text-green-600">
                                    {getCategoryIcon(category)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-500">
                                      {category}
                                    </div>
                                    <div
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                        dynamicCategories.includes(category)
                                          ? "bg-green-50 text-green-700 border border-green-200"
                                          : "bg-red-50 text-red-700 border border-red-200"
                                      }`}
                                    >
                                      <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          dynamicCategories.includes(category)
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                        }`}
                                      ></span>
                                      {dynamicCategories.includes(category)
                                        ? "Available"
                                        : "Not available"}
                                    </div>
                                  </div>
                                  {selectedCategory === category && (
                                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                                  )}
                                </button>
                              ))}
                          </div>
                        ))}

                        {filteredCategories.length === 0 && (
                          <div className="px-4 py-8 text-center text-gray-500">
                            No categories found matching "{categorySearch}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sort Options */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="name">Name</option>
                    <option value="quantity">Quantity</option>
                    <option value="sellingPrice">Price</option>
                    <option value="expiryDate">Expiry Date</option>
                    <option value="createdAt">Date Added</option>
                    <option value="category">Category</option>
                  </select>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-4 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    title={`Sort ${
                      sortOrder === "asc" ? "Ascending" : "Descending"
                    }`}
                    aria-label={`Sort ${
                      sortOrder === "asc" ? "Ascending" : "Descending"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <ChevronUp
                        className={`w-4 h-4 ${
                          sortOrder === "asc"
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      />
                      <ChevronDown
                        className={`w-4 h-4 ${
                          sortOrder === "desc"
                            ? "text-emerald-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilters > 0 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>
                {showLowStock && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                    <button
                      onClick={() => setShowLowStock(false)}
                      className="ml-1 text-amber-600 hover:text-amber-800"
                      aria-label="Remove low stock filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {showEquipment && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm">
                    <Stethoscope className="w-3 h-3" />
                    Equipment
                    <button
                      onClick={() => setShowEquipment(false)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                      aria-label="Remove equipment filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${getCategoryColor(
                      selectedCategory
                    )}`}
                  >
                    {getCategoryIcon(selectedCategory)}
                    {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className="ml-1 opacity-70 hover:opacity-100"
                      aria-label="Remove category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-auto text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 px-2">
          <div>
            <span className="font-semibold text-gray-900">
              {allCategories.length} categories
            </span>{" "}
            available
            {activeFilters > 0 && (
              <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                {activeFilters} filter{activeFilters !== 1 ? "s" : ""} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Sorted by:</span>
            <span className="font-medium text-gray-900">
              {sortBy === "name" && "Name"}
              {sortBy === "quantity" && "Quantity"}
              {sortBy === "sellingPrice" && "Price"}
              {sortBy === "expiryDate" && "Expiry Date"}
              {sortBy === "createdAt" && "Date Added"}
              {sortBy === "category" && "Category"}
            </span>
            <span className="text-gray-500">
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
