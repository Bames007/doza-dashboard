// app/center/dashboard/components/patient_panel/PrescriptionModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import type { Patient } from "../../hooks/usePatients";

const FREQUENCY_OPTIONS = [
  "BID (twice daily)",
  "TID (three times daily)",
  "QID (four times daily)",
  "QD (once daily)",
  "Q6H (every 6 hours)",
  "Q8H (every 8 hours)",
  "Q12H (every 12 hours)",
  "PRN (as needed)",
  "Custom",
];

const ROUTE_OPTIONS = [
  "Oral",
  "IV",
  "IM",
  "Subcutaneous",
  "Topical",
  "Inhalation",
  "Rectal",
  "Other",
];

const DURATION_OPTIONS = [
  "1 day",
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "30 days",
  "Custom",
];

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
    drugId: string;
    sellingPrice: number;
  }) => Promise<void>;
  centerId: string;
  user: any;
}

export default function PrescriptionModal({
  patient,
  onClose,
  onSave,
  centerId,
  user,
}: PrescriptionModalProps) {
  const [form, setForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "",
    duration: "",
    instructions: "",
    drugId: "",
    sellingPrice: 0,
  });
  const [loading, setLoading] = useState(false);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!catalogLoading) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [catalogLoading]);

  // Fetch drug catalog
  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await fetch(
          `/api/centers/${centerId}/hospital_pharmacy/inventory`,
          { headers: { "x-user-id": user.id } },
        );
        const data = await res.json();
        if (data.success) setDrugs(data.data);
      } catch (err) {
        console.error("Failed to fetch drug catalog", err);
      } finally {
        setCatalogLoading(false);
      }
    };
    if (centerId && user) fetchDrugs();
  }, [centerId, user]);

  const handleDrugSelect = (drugId: string) => {
    const selected = drugs.find((d) => d.id === drugId);
    if (selected) {
      setForm({
        ...form,
        drugId: selected.id,
        medication: selected.name,
        dosage: selected.strength || "",
        sellingPrice: selected.sellingPrice || 0,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.drugId || !form.frequency) {
      alert("Please select a drug and specify frequency.");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        drugId: form.drugId,
        medication: form.medication,
        dosage: form.dosage,
        frequency: form.frequency,
        route: form.route,
        duration: form.duration,
        instructions: form.instructions,
        sellingPrice: form.sellingPrice,
      });
      onClose();
    } catch (err) {
      alert("Failed to save prescription.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <h3
              id="prescription-modal-title"
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Prescribe – {patient.fullName}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500"
              aria-label="Close prescription modal"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
          noValidate
        >
          {catalogLoading ? (
            <div className="flex justify-center py-8">
              <Loader2
                className="w-6 h-6 text-emerald-600 animate-spin"
                aria-hidden="true"
              />
              <span className="sr-only">Loading drug catalog</span>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="drug-select"
                  className="block text-sm font-medium text-slate-700"
                >
                  Drug *
                </label>
                <select
                  id="drug-select"
                  ref={firstInputRef}
                  value={form.drugId}
                  onChange={(e) => handleDrugSelect(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select a drug</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.strength || ""} – {d.form} (Stock:{" "}
                      {d.quantity} {d.unit}) – ₦
                      {d.sellingPrice?.toLocaleString() || 0}/unit
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="medication"
                  className="block text-sm font-medium text-slate-700"
                >
                  Medication
                </label>
                <input
                  id="medication"
                  type="text"
                  name="medication"
                  value={form.medication}
                  readOnly
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 bg-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-default"
                />
              </div>

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
                  name="dosage"
                  value={form.dosage}
                  onChange={handleChange}
                  placeholder="e.g., 500mg"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="frequency"
                  className="block text-sm font-medium text-slate-700"
                >
                  Frequency *
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select frequency</option>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
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
                  name="route"
                  value={form.route}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select route</option>
                  {ROUTE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-slate-700"
                >
                  Duration
                </label>
                <select
                  id="duration"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Select duration</option>
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="instructions"
                  className="block text-sm font-medium text-slate-700"
                >
                  Instructions
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={form.instructions}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  placeholder="Take with food, etc."
                />
              </div>

              <div
                className="text-sm text-slate-600 font-medium"
                aria-live="polite"
              >
                Selling Price:{" "}
                <span className="font-bold text-emerald-700">
                  ₦{form.sellingPrice.toLocaleString()}
                </span>{" "}
                / unit
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Prescribe"
                )}
              </button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
