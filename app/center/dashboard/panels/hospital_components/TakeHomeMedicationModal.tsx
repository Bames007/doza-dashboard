// app/center/dashboard/components/patient_panel/TakeHomeMedicationModal.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Pill, Plus, Trash2, Building, Store, Loader2 } from "lucide-react";
import { bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";

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

interface TakeHomeMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSubmit: (data: {
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      quantity: number;
      instructions: string;
      source: "hospital" | "external";
      // price is NOT included – pharmacy will handle
    }>;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  centerId: string;
  user: any;
}

interface MedicationItem {
  id: string;
  source: "hospital" | "external";
  name: string;
  dosage: string;
  frequencyPreset: string;
  customFrequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  price: number; // only used for display (hospital)
}

export default function TakeHomeMedicationModal({
  isOpen,
  onClose,
  patientName,
  onSubmit,
  isSubmitting,
  centerId,
  user,
}: TakeHomeMedicationModalProps) {
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: crypto.randomUUID(),
      source: "hospital",
      name: "",
      dosage: "",
      frequencyPreset: "",
      customFrequency: "",
      duration: "",
      quantity: 1,
      instructions: "",
      price: 0,
    },
  ]);
  const [notes, setNotes] = useState("");
  const [drugs, setDrugs] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedDrugIds, setSelectedDrugIds] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const fetchDrugs = async () => {
      if (!centerId || !user?.id) return;
      setCatalogLoading(true);
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
    if (isOpen) fetchDrugs();
  }, [centerId, user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMedications([
        {
          id: crypto.randomUUID(),
          source: "hospital",
          name: "",
          dosage: "",
          frequencyPreset: "",
          customFrequency: "",
          duration: "",
          quantity: 1,
          instructions: "",
          price: 0,
        },
      ]);
      setNotes("");
      setSelectedDrugIds({});
    }
  }, [isOpen]);

  const addMedication = () => {
    setMedications([
      ...medications,
      {
        id: crypto.randomUUID(),
        source: "hospital",
        name: "",
        dosage: "",
        frequencyPreset: "",
        customFrequency: "",
        duration: "",
        quantity: 1,
        instructions: "",
        price: 0,
      },
    ]);
  };

  const removeMedication = (id: string) => {
    if (medications.length === 1) return;
    setMedications(medications.filter((m) => m.id !== id));
    const newSelected = { ...selectedDrugIds };
    delete newSelected[id];
    setSelectedDrugIds(newSelected);
  };

  const updateMedication = (
    id: string,
    field: keyof MedicationItem,
    value: any,
  ) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  };

  const handleDrugSelect = (medId: string, drugId: string) => {
    const selected = drugs.find((d) => d.id === drugId);
    if (!selected) return;
    setMedications((prev) =>
      prev.map((m) =>
        m.id === medId
          ? {
              ...m,
              name: selected.name || "",
              dosage: selected.strength || "",
              price: selected.sellingPrice || 0, // show price for reference
            }
          : m,
      ),
    );
    setSelectedDrugIds((prev) => ({ ...prev, [medId]: drugId }));
  };

  const handleFrequencyChange = (id: string, value: string) => {
    setMedications((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          frequencyPreset: value,
          customFrequency: value === "Custom" ? m.customFrequency : "",
        };
      }),
    );
  };

  const handleCustomFrequencyChange = (id: string, value: string) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, customFrequency: value } : m)),
    );
  };

  const getFinalFrequency = (med: MedicationItem): string => {
    if (med.frequencyPreset === "Custom") {
      return med.customFrequency.trim() || "Custom";
    }
    return med.frequencyPreset;
  };

  const handleSubmit = async () => {
    const hasEmpty = medications.some(
      (m) => !m.name.trim() || !m.dosage.trim() || !getFinalFrequency(m).trim(),
    );
    if (hasEmpty) {
      alert("Please fill in all required fields for each medication.");
      return;
    }

    // Build payload WITHOUT price
    const payload = {
      medications: medications.map(
        ({ id, frequencyPreset, customFrequency, price, ...rest }) => ({
          ...rest,
          frequency: getFinalFrequency({
            frequencyPreset,
            customFrequency,
            ...rest,
          } as MedicationItem),
        }),
      ),
      notes,
    };

    await onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Take‑Home Medication
            </h2>
            <p className="text-sm text-slate-500">
              Prescribe for {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body – Info box removed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {medications.map((med) => {
            const isHospital = med.source === "hospital";
            const showCustomInput = med.frequencyPreset === "Custom";

            return (
              <div
                key={med.id}
                className="border border-slate-200 rounded-xl p-4 space-y-3 relative bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-slate-700">
                      Medication {medications.indexOf(med) + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMedication(med.id)}
                    className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Source selector */}
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-xs font-medium text-slate-600">
                    Source:
                  </span>
                  <button
                    onClick={() =>
                      updateMedication(med.id, "source", "hospital")
                    }
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition",
                      isHospital
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    <Building className="w-3.5 h-3.5" />
                    Hospital
                  </button>
                  <button
                    onClick={() =>
                      updateMedication(med.id, "source", "external")
                    }
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition",
                      !isHospital
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100",
                    )}
                  >
                    <Store className="w-3.5 h-3.5" />
                    External
                  </button>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isHospital ? (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Select Drug <span className="text-rose-500">*</span>
                        </label>
                        {catalogLoading ? (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading drugs...
                          </div>
                        ) : (
                          <select
                            value={selectedDrugIds[med.id] || ""}
                            onChange={(e) =>
                              handleDrugSelect(med.id, e.target.value)
                            }
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          >
                            <option value="">Select a drug...</option>
                            {drugs.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name} {d.strength || ""} – {d.form} (Stock:{" "}
                                {d.quantity} {d.unit})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Medication
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-slate-100 cursor-default"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-slate-100 cursor-default"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Medication Name{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) =>
                            updateMedication(med.id, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., Paracetamol"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Dosage <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) =>
                            updateMedication(med.id, "dosage", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., 500mg"
                        />
                      </div>
                    </>
                  )}

                  {/* Frequency – shared */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Frequency <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={med.frequencyPreset || ""}
                      onChange={(e) =>
                        handleFrequencyChange(med.id, e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select frequency</option>
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {showCustomInput && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={med.customFrequency}
                          onChange={(e) =>
                            handleCustomFrequencyChange(med.id, e.target.value)
                          }
                          placeholder="Enter custom frequency (e.g., Every 4 hours)"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    )}
                    {!showCustomInput && med.frequencyPreset && (
                      <p className="text-xs text-slate-500 mt-1">
                        Selected: {med.frequencyPreset}
                      </p>
                    )}
                    {showCustomInput && med.customFrequency && (
                      <p className="text-xs text-slate-500 mt-1">
                        Custom: {med.customFrequency}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) =>
                        updateMedication(med.id, "duration", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., 7 days"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={med.quantity}
                      onChange={(e) =>
                        updateMedication(
                          med.id,
                          "quantity",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {/* Price – only displayed for hospital, read-only */}
                  {isHospital && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Price (₦) – for reference
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={med.price ? `₦${med.price.toFixed(2)}` : "—"}
                          readOnly
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-slate-100 cursor-default"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Price will be confirmed by pharmacy at dispense
                      </p>
                    </div>
                  )}

                  <div
                    className={cn(
                      isHospital ? "sm:col-span-2" : "sm:col-span-2",
                    )}
                  >
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) =>
                        updateMedication(med.id, "instructions", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="e.g., Take with food"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={addMedication}
            className="w-full py-3 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:bg-emerald-50 transition font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Medication
          </button>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Any additional instructions or notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-emerald-200/50 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? "Prescribing..." : "Prescribe Take‑Home Meds"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
