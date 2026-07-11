"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import type { Patient } from "../../hooks/usePatients";
import { useEffect, useRef, useState } from "react";

interface PrescriptionModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (data: {
    medication: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
  }) => Promise<void>;
}

const FREQUENCY_OPTIONS = [
  "BID",
  "TID",
  "QID",
  "QD",
  "Q6H",
  "Q8H",
  "Q12H",
  "PRN",
  "Custom",
];

export default function PrescriptionModal({
  patient,
  onClose,
  onSave,
}: PrescriptionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "",
    duration: "",
    instructions: "",
  });
  const [isCustomFrequency, setIsCustomFrequency] = useState(false);
  const [customFrequencyValue, setCustomFrequencyValue] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Custom") {
      setIsCustomFrequency(true);
      setCustomFrequencyValue("");
      setForm((prev) => ({ ...prev, frequency: "" }));
    } else {
      setIsCustomFrequency(false);
      setCustomFrequencyValue("");
      setForm((prev) => ({ ...prev, frequency: val }));
    }
  };

  const handleCustomFrequencyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.value;
    setCustomFrequencyValue(val);
    setForm((prev) => ({ ...prev, frequency: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medication.trim() || !form.frequency.trim()) {
      alert("Medication and Frequency are required.");
      return;
    }
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert("Failed to save prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-modal-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[95vh] shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <h3
            id="prescription-modal-title"
            className={cn(
              "text-lg sm:text-xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Prescribe Medication – {patient.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 -m-1 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-4"
        >
          {/* Medication */}
          <div>
            <label
              htmlFor="medication"
              className="block text-sm font-medium text-slate-700"
            >
              Medication *
            </label>
            <input
              id="medication"
              type="text"
              value={form.medication}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, medication: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., Amoxicillin"
              required
              aria-describedby="medication-help"
            />
            <p id="medication-help" className="text-xs text-slate-500 mt-1">
              Enter the medication name
            </p>
          </div>

          {/* Dosage & Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="dosage"
                className="block text-sm font-medium text-slate-700"
              >
                Dosage
              </label>
              <input
                id="dosage"
                type="text"
                value={form.dosage}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dosage: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="500mg"
              />
            </div>
            <div>
              <label
                htmlFor="route"
                className="block text-sm font-medium text-slate-700"
              >
                Route
              </label>
              <select
                id="route"
                value={form.route}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, route: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select</option>
                <option value="Oral">Oral</option>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
                <option value="Topical">Topical</option>
                <option value="Inhalation">Inhalation</option>
              </select>
            </div>
          </div>

          {/* Frequency (dropdown + custom) */}
          <div>
            <label
              htmlFor="frequency"
              className="block text-sm font-medium text-slate-700"
            >
              Frequency *
            </label>
            <select
              id="frequency"
              value={
                isCustomFrequency
                  ? "Custom"
                  : FREQUENCY_OPTIONS.includes(form.frequency)
                    ? form.frequency
                    : ""
              }
              onChange={handleFrequencyChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            >
              <option value="">Select frequency</option>
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {isCustomFrequency && (
              <div className="mt-2">
                <label htmlFor="custom-frequency" className="sr-only">
                  Custom frequency
                </label>
                <input
                  id="custom-frequency"
                  type="text"
                  value={customFrequencyValue}
                  onChange={handleCustomFrequencyChange}
                  placeholder="e.g., Every 4 hours"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  aria-describedby="custom-frequency-help"
                />
                <p
                  id="custom-frequency-help"
                  className="text-xs text-slate-500 mt-1"
                >
                  Type your custom frequency
                </p>
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration"
              className="block text-sm font-medium text-slate-700"
            >
              Duration
            </label>
            <input
              id="duration"
              type="text"
              value={form.duration}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, duration: e.target.value }))
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="e.g., 7 days"
            />
          </div>

          {/* Instructions */}
          <div>
            <label
              htmlFor="instructions"
              className="block text-sm font-medium text-slate-700"
            >
              Instructions
            </label>
            <textarea
              id="instructions"
              value={form.instructions}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, instructions: e.target.value }))
              }
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Take with food, etc."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all text-sm font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              {loading ? "Saving..." : "Prescribe"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
