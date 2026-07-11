// app/center/dashboard/dashboards/components/patient_panel/VitalsModal.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

export interface VitalsField {
  id: string;
  label: string;
  unit: string;
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
}

interface VitalsModalProps {
  patient: any;
  vitalsForm: Record<string, string>;
  setVitalsForm: (form: Record<string, string>) => void;
  fields: VitalsField[];
  onSave: () => void;
  onClose: () => void;
}

export default function VitalsModal({
  patient,
  vitalsForm,
  setVitalsForm,
  fields,
  onSave,
  onClose,
}: VitalsModalProps) {
  const [loading, setLoading] = useState(false);

  // ─── Track previous weight/height to avoid infinite loops ──────
  const prevWeightRef = useRef<string>(vitalsForm.weight);
  const prevHeightRef = useRef<string>(vitalsForm.height);

  // ─── Auto-calculate BMI ──────────────────────────────────────────
  useEffect(() => {
    const weight = vitalsForm.weight;
    const height = vitalsForm.height;

    // Only recalc if weight or height actually changed
    if (weight === prevWeightRef.current && height === prevHeightRef.current) {
      return;
    }
    prevWeightRef.current = weight;
    prevHeightRef.current = height;

    const weightNum = parseFloat(weight);
    const heightCm = parseFloat(height);

    let bmiValue = "";
    if (
      !isNaN(weightNum) &&
      weightNum > 0 &&
      !isNaN(heightCm) &&
      heightCm > 0
    ) {
      const heightM = heightCm / 100;
      const bmi = weightNum / (heightM * heightM);
      if (bmi > 0 && bmi < 100) {
        bmiValue = bmi.toFixed(1);
      }
    }

    // Only update if the BMI field would change
    if (vitalsForm.bmi !== bmiValue) {
      setVitalsForm({
        ...vitalsForm,
        bmi: bmiValue,
      });
    }
  }, [vitalsForm.weight, vitalsForm.height, vitalsForm.bmi, setVitalsForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave();
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vitals-modal-title"
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            id="vitals-modal-title"
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Record Vitals – {patient.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field) => {
              // Make BMI field disabled (read-only)
              const isBmi = field.id === "bmi";
              return (
                <div key={field.id}>
                  <label
                    htmlFor={`vitals-${field.id}`}
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    {field.label}
                    {field.unit && (
                      <span className="text-slate-400 ml-1">
                        ({field.unit})
                      </span>
                    )}
                  </label>
                  <input
                    id={`vitals-${field.id}`}
                    type="number"
                    step={field.step || 1}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    value={vitalsForm[field.id] || ""}
                    onChange={(e) =>
                      setVitalsForm({
                        ...vitalsForm,
                        [field.id]: e.target.value,
                      })
                    }
                    disabled={isBmi}
                    className={cn(
                      "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-400 transition-all bg-white",
                      isBmi && "bg-slate-100 text-slate-600 cursor-not-allowed",
                    )}
                  />
                  {isBmi && vitalsForm.bmi && (
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Auto‑calculated from weight & height
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <p>
              BMI is automatically calculated when both <strong>Weight</strong>{" "}
              and <strong>Height</strong> are entered.
            </p>
            <p className="mt-1">Formula: BMI = weight (kg) / (height (m))²</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? "Saving..." : "Save Vitals"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
