"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Barcode,
  Building,
  Hash,
  X,
  CheckCircle,
  AlertTriangle,
  Pill,
  Package,
  Shield,
} from "lucide-react";

interface DrugAuthenticityTabProps {
  user: any;
  center: any;
}

const DrugAuthenticityTab: React.FC<DrugAuthenticityTabProps> = ({}) => {
  const [searchType, setSearchType] = useState<
    "name" | "manufacturer" | "nafdac" | "barcode"
  >("name");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  // Update the searchDrugs function in your component
  const searchDrugs = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/drugs?search=${encodeURIComponent(
          searchTerm
        )}&field=${searchType}`
      );

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the response text first to debug
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON:", responseText);
        throw new Error("Invalid response from server");
      }

      if (data.success) {
        setSearchResults(data.data.drugs || []);
      } else {
        console.error("API error:", data.error);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error("Search error:", error);
      // Set empty results on error
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderSearchField = () => {
    const fields = {
      name: { icon: Hash, placeholder: "Enter drug name" },
      manufacturer: { icon: Building, placeholder: "Enter manufacturer name" },
      nafdac: { icon: Shield, placeholder: "Enter NAFDAC number" },
      barcode: { icon: Barcode, placeholder: "Enter barcode" },
    };

    const field = fields[searchType];

    return (
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <field.icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchDrugs()}
          className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Search */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-xl p-4 md:p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Drug Authenticity
            </h3>

            {/* Search Type Selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { id: "name", label: "Name", icon: Hash },
                { id: "manufacturer", label: "Manufacturer", icon: Building },
                { id: "nafdac", label: "NAFDAC", icon: Shield },
                { id: "barcode", label: "Barcode", icon: Barcode },
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSearchType(type.id as any)}
                  className={`
                    flex flex-col items-center justify-center gap-1 p-2 md:p-3 rounded-lg border text-xs md:text-sm font-medium transition-colors
                    ${
                      searchType === type.id
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }
                  `}
                >
                  <type.icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span>{type.label}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            {renderSearchField()}

            {/* Search Button */}
            <button
              onClick={searchDrugs}
              disabled={loading || !searchTerm.trim()}
              className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </button>

            {/* Quick Tips */}
            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Quick Tips
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Check NAFDAC registration status</li>
                <li>• Verify manufacturer details</li>
                <li>• Look for proper packaging</li>
                <li>• Check expiry dates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {selectedDrug ? (
            <DrugDetailsView
              drug={selectedDrug}
              onBack={() => setSelectedDrug(null)}
            />
          ) : (
            <SearchResultsView
              results={searchResults}
              loading={loading}
              onSelectDrug={setSelectedDrug}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Search Results Component
const SearchResultsView: React.FC<{
  results: any[];
  loading: boolean;
  onSelectDrug: (drug: any) => void;
}> = ({ results, loading, onSelectDrug }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching database...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No drugs found
        </h3>
        <p className="text-gray-600">
          Try searching with different terms or verify the drug information
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h3 className="font-semibold text-gray-900">
          Found {results.length} drug{results.length !== 1 ? "s" : ""}
        </h3>
        <div className="text-sm text-gray-500">Sorted by confidence score</div>
      </div>

      <div className="space-y-3">
        {results.map((drug, index) => (
          <motion.div
            key={drug.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelectDrug(drug)}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm cursor-pointer transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Pill className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">
                    {drug.genericName}
                  </h4>
                </div>
                {drug.brandNames && drug.brandNames.length > 0 && (
                  <p className="text-sm text-gray-600 mb-2">
                    Brand: {drug.brandNames.join(", ")}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-sm text-gray-500">
                    {drug.strength} • {drug.dosageForm}
                  </span>
                  <span className="text-sm text-gray-500">
                    {drug.manufacturer}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${
                    drug.status === "verified"
                      ? "bg-green-100 text-green-800"
                      : drug.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }
                `}
                >
                  {drug.status.charAt(0).toUpperCase() + drug.status.slice(1)}
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {drug.confidenceScore}%
                </div>
              </div>
            </div>

            {drug.tags && drug.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {drug.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Drug Details Component
const DrugDetailsView: React.FC<{ drug: any; onBack: () => void }> = ({
  drug,
  onBack,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit"
        >
          <X className="w-4 h-4" />
          Back to results
        </button>
        <div className="flex items-center gap-2">
          <div
            className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${
              drug.status === "verified"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          `}
          >
            {drug.status === "verified"
              ? "Verified Authentic"
              : "Pending Verification"}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Drug Information
            </h3>
            <div className="space-y-4">
              <InfoRow label="Generic Name" value={drug.genericName} />
              <InfoRow
                label="Brand Names"
                value={drug.brandNames?.join(", ")}
              />
              <InfoRow label="Strength" value={drug.strength} />
              <InfoRow label="Dosage Form" value={drug.dosageForm} />
              <InfoRow label="Manufacturer" value={drug.manufacturer} />
              {drug.nafdacNumber && (
                <InfoRow label="NAFDAC Number" value={drug.nafdacNumber} />
              )}
              {drug.barcode && <InfoRow label="Barcode" value={drug.barcode} />}

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Drug Class</h4>
                <div className="flex flex-wrap gap-2">
                  {drug.drugClass?.map((cls: string) => (
                    <span
                      key={cls}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Verification Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verification Details
            </h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Verified By</h4>
                </div>
                <InfoRow label="Pharmacist" value={drug.verifiedBy?.userName} />
                <InfoRow label="Center" value={drug.verifiedBy?.centerName} />
                <InfoRow
                  label="Date"
                  value={new Date(
                    drug.verifiedBy?.verificationDate
                  ).toLocaleDateString()}
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Confidence Metrics
                </h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Completeness Score</span>
                      <span>{drug.confidenceScore}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${drug.confidenceScore}%` }}
                        transition={{ duration: 1 }}
                        className={`h-full ${
                          drug.confidenceScore >= 80
                            ? "bg-green-500"
                            : drug.confidenceScore >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {drug.indications && drug.indications.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Approved Indications
                  </h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                    {drug.indications
                      .slice(0, 3)
                      .map((ind: string, i: number) => (
                        <li key={i}>{ind}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning if drug needs review */}
        {drug.status === "pending" && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900">Needs Review</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  This drug information is pending review by our medical team.
                  Please verify the information before clinical use.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// InfoRow Component
const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-medium text-gray-900 text-right max-w-[60%] break-words">
      {value || "Not specified"}
    </span>
  </div>
);

export default DrugAuthenticityTab;
