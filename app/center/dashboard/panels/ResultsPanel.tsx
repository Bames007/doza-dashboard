"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Printer,
  CheckSquare,
  Square,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins } from "@/app/utils/constants";
import type { LabTest } from "../types/lab";
import { generateLabReport } from "../utils/pdfGenerator";

export default function ResultsPanel() {
  const { center, user } = useDashboard();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [testTypeFilter, setTestTypeFilter] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  useEffect(() => {
    if (center?.id) fetchTests();
  }, [center?.id]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/centers/${center?.id}/lab-tests`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      if (data.success) {
        setTests(data.data.filter((t: LabTest) => t.status === "completed"));
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTests.size === filteredTests.length) {
      setSelectedTests(new Set());
    } else {
      setSelectedTests(new Set(filteredTests.map((t) => t.id)));
    }
  };

  const handlePrintSelected = () => {
    const testsToPrint = tests.filter((t) => selectedTests.has(t.id));
    if (testsToPrint.length === 0) return;

    const doc = generateLabReport({
      tests: testsToPrint,
      centerName: center?.centerName || "Lab Center",
      centerAddress: center?.location?.address,
      centerPhone: center?.ownerInfo?.phone,
      centerEmail: center?.ownerInfo?.email,
      technicianName: user?.fullName,
    });
    doc.save(`Lab_Reports_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handlePrintSingle = (test: LabTest) => {
    const doc = generateLabReport({
      tests: [test],
      centerName: center?.centerName || "Lab Center",
      centerAddress: center?.location?.address,
      centerPhone: center?.ownerInfo?.phone,
      centerEmail: center?.ownerInfo?.email,
      technicianName: user?.fullName, // <-- added
    });
    doc.save(`Lab_Report_${test.patientName}_${test.testType}.pdf`);
  };

  const testTypes = Array.from(new Set(tests.map((t) => t.testType)));

  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.patientName.toLowerCase().includes(search.toLowerCase()) ||
      t.testType.toLowerCase().includes(search.toLowerCase());
    const matchesTestType = testTypeFilter
      ? t.testType === testTypeFilter
      : true;
    const testDate = new Date(t.collectionDate);
    const matchesFrom = dateFrom ? testDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? testDate <= new Date(dateTo) : true;
    return matchesSearch && matchesTestType && matchesFrom && matchesTo;
  });

  if (loading)
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        <p className={`mt-2 text-gray-500 ${poppins.className}`}>
          Loading results...
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Results</h1>
          <p className={`text-gray-600 ${poppins.className}`}>
            View completed test results
          </p>
        </div>
        {selectedTests.size > 0 && (
          <button
            onClick={handlePrintSelected}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span className={poppins.className}>
              Print Selected ({selectedTests.size})
            </span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient or test..."
              className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-500 ${poppins.className}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 ${poppins.className}`}
            value={testTypeFilter}
            onChange={(e) => setTestTypeFilter(e.target.value)}
          >
            <option value="">All Test Types</option>
            {testTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="date"
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 ${poppins.className}`}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
          />
          <input
            type="date"
            className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700 ${poppins.className}`}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
          />
        </div>
      </div>

      {/* Results List */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <FileText className="w-16 h-16 mx-auto text-gray-300" />
          <h3
            className={`mt-4 text-lg font-semibold text-gray-800 ${poppins.className}`}
          >
            No results found
          </h3>
          <p className={`text-gray-600 ${poppins.className}`}>
            {search || testTypeFilter || dateFrom || dateTo
              ? "Try different filters"
              : "Completed tests will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Select All Row */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900"
            >
              {selectedTests.size === filteredTests.length ? (
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              <span className={poppins.className}>
                {selectedTests.size === filteredTests.length
                  ? "Deselect All"
                  : "Select All"}
              </span>
            </button>
            <span className="text-xs text-gray-500">
              {selectedTests.size} of {filteredTests.length} selected
            </span>
          </div>

          {filteredTests.map((test) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Summary row */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleSelect(test.id)}
                    className="focus:outline-none"
                  >
                    {selectedTests.has(test.id) ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === test.id ? null : test.id)
                    }
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold text-gray-900 ${poppins.className}`}
                      >
                        {test.patientName}
                      </h3>
                      <p className="text-sm text-gray-500">{test.testType}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4 ml-8 sm:ml-0">
                  <span className="text-sm text-gray-500">
                    {new Date(test.collectionDate).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handlePrintSingle(test)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                    title="Print single report"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === test.id ? null : test.id)
                    }
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    {expandedId === test.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === test.id && test.result && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100 bg-gray-50 p-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p
                        className={`text-xs text-gray-500 ${poppins.className}`}
                      >
                        Value
                      </p>
                      <p
                        className={`font-medium text-gray-900 ${poppins.className}`}
                      >
                        {test.result.value}{" "}
                        {test.result.unit && (
                          <span className="text-sm text-gray-500">
                            {test.result.unit}
                          </span>
                        )}
                      </p>
                    </div>
                    {test.result.referenceRange && (
                      <div>
                        <p
                          className={`text-xs text-gray-500 ${poppins.className}`}
                        >
                          Reference Range
                        </p>
                        <p
                          className={`font-medium text-gray-900 ${poppins.className}`}
                        >
                          {test.result.referenceRange}
                        </p>
                      </div>
                    )}
                    {test.result.notes && (
                      <div className="md:col-span-2">
                        <p
                          className={`text-xs text-gray-500 ${poppins.className}`}
                        >
                          Notes
                        </p>
                        <p
                          className={`text-sm text-gray-700 ${poppins.className}`}
                        >
                          {test.result.notes}
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-2 flex justify-between text-xs text-gray-500 mt-2">
                      <span>Concluded by: {user?.fullName || "Unknown"}</span>
                      <span>
                        {test.result.concludedAt
                          ? new Date(test.result.concludedAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
