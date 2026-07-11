import { Pill, UserPlus, Search, Filter, X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface PrescriptionsHeaderProps {
  onNewPrescription: () => void;
  onSearch: (searchTerm: string) => void;
  filterCount: number;
  onFilterClick?: () => void;
  searchPlaceholder?: string;
}

export const PrescriptionsHeader = ({
  onNewPrescription,
  onSearch,
  filterCount,
  onFilterClick,
  searchPlaceholder = "Search patients, medications, or prescriptions...",
}: PrescriptionsHeaderProps) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      setSearchTerm("");
      onSearch("");
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onSearch("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4">
      {/* Title Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl shadow-sm">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Prescriptions Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create, manage, and track patient prescriptions with medical
              history
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Section */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search Section - Adapts between mobile and desktop */}
        <div className="flex-1 min-w-[200px] lg:min-w-[300px]">
          <div
            className={`
              relative transition-all duration-200
              ${isSearchExpanded ? "w-full" : "w-auto"}
            `}
          >
            {/* Desktop Search Bar */}
            <div className="hidden md:block">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400 group-focus-within:text-green-600" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-10 py-2.5 bg-white text-gray-900 rounded-lg border border-gray-300 
                           focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none
                           transition-all duration-200 placeholder:text-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2
                             text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Search */}
            <div className="md:hidden">
              {isSearchExpanded ? (
                <div className="relative animate-in slide-in-from-right-2 duration-200">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Search className="w-4 h-4 text-green-600" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-20 py-2.5 bg-white text-gray-900 rounded-lg border-2 border-green-500 
                             focus:ring-2 focus:ring-green-200 focus:outline-none"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSearchToggle}
                      className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 
                               hover:bg-green-50 rounded-md transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSearchToggle}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-white text-gray-700 
                           rounded-lg border border-gray-300 hover:border-green-300 hover:bg-green-50
                           transition-all duration-200"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm font-medium flex-1 text-left text-gray-500">
                    Search...
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Button */}
        {onFilterClick && (
          <button
            onClick={onFilterClick}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 
                     rounded-lg border border-gray-300 hover:border-green-300 hover:bg-green-50
                     transition-all duration-200 group"
          >
            <Filter className="w-4 h-4 group-hover:text-green-600" />
            <span className="text-sm font-medium hidden sm:inline">Filter</span>
            {filterCount > 0 && (
              <span
                className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold 
                             rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
              >
                {filterCount}
              </span>
            )}
          </button>
        )}

        {/* New Prescription Button */}
        <button
          onClick={onNewPrescription}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 
                   text-white rounded-lg hover:from-green-700 hover:to-emerald-800 
                   shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">New Prescription</span>
          <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline" />
        </button>
      </div>

      {/* Search Suggestions - Appears when typing */}
      {searchTerm && (
        <div className="lg:col-span-2 animate-in fade-in-50 duration-200">
          <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">
              Searching for:{" "}
              <span className="font-semibold text-green-700">{searchTerm}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setSearchTerm(searchTerm + " medication")}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full 
                         hover:bg-green-100 transition-colors border border-green-200"
              >
                {searchTerm} medication
              </button>
              <button
                onClick={() => setSearchTerm(searchTerm + " prescription")}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full 
                         hover:bg-green-100 transition-colors border border-green-200"
              >
                {searchTerm} prescription
              </button>
              <button
                onClick={() => setSearchTerm("patient: " + searchTerm)}
                className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-full 
                         hover:bg-green-100 transition-colors border border-green-200"
              >
                Patient: {searchTerm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
