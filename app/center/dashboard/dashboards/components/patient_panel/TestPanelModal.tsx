"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import type { Patient } from "../../hooks/usePatients";

interface TestPanelModalProps {
  patient: Patient;
  onClose: () => void;
  onCreate: (
    patientId: string,
    patientName: string,
    testId: string,
    testName: string,
    sampleType: string,
  ) => Promise<void>;
  testCatalog: any[];
  catalogLoading: boolean;
}

export default function TestPanelModal({
  patient,
  onClose,
  onCreate,
  testCatalog,
  catalogLoading,
}: TestPanelModalProps) {
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTestId) return;
    const test = testCatalog.find((t: any) => t.id === selectedTestId);
    if (!test) return;
    setLoading(true);
    await onCreate(
      patient.id,
      patient.fullName,
      test.id,
      test.name,
      test.sampleType || "",
    );
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Order Lab Test
          </h3>
          <button
            onClick={onClose}
            className="p-2 -m-1 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Select a test from the center's catalog for{" "}
            <span className="font-semibold text-slate-800">
              {patient.fullName}
            </span>
          </p>
          {catalogLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto" />
              <p className="text-xs text-slate-400 mt-2">Loading tests...</p>
            </div>
          ) : testCatalog.length === 0 ? (
            <p className="text-sm text-amber-600">
              No tests available in the center catalog. Please add tests first.
            </p>
          ) : (
            <select
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              required
            >
              <option value="">Choose a test...</option>
              {testCatalog.map((test: any) => (
                <option key={test.id} value={test.id}>
                  {test.name} {test.price ? `(₦${test.price})` : ""}
                  {test.sampleType ? ` - ${test.sampleType}` : ""}
                </option>
              ))}
            </select>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedTestId || testCatalog.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Ordering..." : "Order Test"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
