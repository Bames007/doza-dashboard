// app/center/dashboard/components/patient_panel/DispenseModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";
import Calculator from "../Calculator";

interface PrescriptionInfo {
  medication?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  instructions?: string;
}

interface DispenseModalProps {
  patientName: string;
  medication: string;
  prescription: PrescriptionInfo;
  prescriptionIndex: number;
  patientId: string;
  centerId: string;
  user: any;
  onClose: () => void;
  onDispense: (data: {
    status: "full" | "partial" | "out_of_stock" | "cancelled";
    quantity?: number;
    notes?: string;
  }) => Promise<void>;
}

export default function DispenseModal({
  patientName,
  medication,
  prescription,
  patientId,
  centerId,
  user,
  onClose,
  onDispense,
}: DispenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    "full" | "partial" | "out_of_stock" | "cancelled"
  >("full");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [stockInfo, setStockInfo] = useState<{
    available: number;
    unit: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  // Focus on first input
  useEffect(() => {
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, []);

  // Fetch current stock
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch(
          `/api/centers/${centerId}/hospital_pharmacy/inventory`,
          { headers: { "x-user-id": user.id } },
        );
        const data = await res.json();
        if (data.success) {
          const drug = data.data.find(
            (d: any) => d.name.toLowerCase() === medication.toLowerCase(),
          );
          if (drug) {
            setStockInfo({
              available: drug.quantity,
              unit: drug.unit || "units",
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch stock", err);
      }
    };
    fetchStock();
  }, [centerId, medication, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status !== "cancelled" && status !== "out_of_stock") {
      if (!quantity || quantity <= 0) {
        setError("Please enter a valid quantity to dispense.");
        return;
      }
      if (stockInfo && quantity > stockInfo.available) {
        setError(`Only ${stockInfo.available} ${stockInfo.unit} available.`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      await onDispense({
        status,
        quantity:
          status === "cancelled" || status === "out_of_stock"
            ? undefined
            : quantity,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Dispense failed.");
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

  // Suggested quantity: frequency * duration (rough estimate)
  const suggestedQuantity = (() => {
    const freqMatch = (prescription.frequency || "").match(/(\d+)/);
    const freq = freqMatch ? parseInt(freqMatch[0], 10) : 1;
    const durMatch = (prescription.duration || "").match(/(\d+)/);
    const dur = durMatch ? parseInt(durMatch[0], 10) : 1;
    return freq * dur;
  })();

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispense-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200/80 p-6 max-h-[95vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id="dispense-modal-title"
            className={cn(
              "text-xl font-bold text-slate-900",
              poppins.className,
            )}
          >
            Dispense – {medication}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            aria-label="Close dispense modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-700 mb-2">
          Patient: <strong>{patientName}</strong>
        </p>

        {/* ─── Prescription Regimen ──────────────────────────────── */}
        {prescription.dosage ||
        prescription.frequency ||
        prescription.duration ? (
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 mb-4">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Prescription
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
              {prescription.dosage && (
                <div>
                  <span className="text-slate-500">Dosage:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {prescription.dosage}
                  </span>
                </div>
              )}
              {prescription.frequency && (
                <div>
                  <span className="text-slate-500">Frequency:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {prescription.frequency}
                  </span>
                </div>
              )}
              {prescription.duration && (
                <div>
                  <span className="text-slate-500">Duration:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {prescription.duration}
                  </span>
                </div>
              )}
              {prescription.route && (
                <div>
                  <span className="text-slate-500">Route:</span>{" "}
                  <span className="font-medium text-slate-800">
                    {prescription.route}
                  </span>
                </div>
              )}
              {prescription.instructions && (
                <div className="col-span-2">
                  <span className="text-slate-500">Instructions:</span>{" "}
                  <span className="font-medium text-slate-800 italic">
                    {prescription.instructions}
                  </span>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-slate-500">
                  Suggested total quantity:
                </span>{" "}
                <span className="font-bold text-emerald-700">
                  {suggestedQuantity} {stockInfo?.unit || "units"}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (based on frequency × duration)
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 text-sm text-slate-500">
            Prescription details not available.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ─── Left: Form ────────────────────────────────────────── */}
          <div>
            {stockInfo && (
              <div
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-sm mb-4"
                aria-live="polite"
              >
                <span className="font-medium text-slate-600">
                  Available stock:
                </span>{" "}
                <span className="font-bold text-slate-800">
                  {stockInfo.available}
                </span>{" "}
                <span className="text-slate-600">{stockInfo.unit}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="dispense-status"
                  className="block text-sm font-medium text-slate-700"
                >
                  Dispense Status
                </label>
                <select
                  id="dispense-status"
                  ref={firstInputRef}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {status !== "cancelled" && status !== "out_of_stock" && (
                <div>
                  <label
                    htmlFor="dispense-quantity"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Quantity to dispense{" "}
                    <span className="text-xs text-slate-500">
                      (total units)
                    </span>
                  </label>
                  <input
                    id="dispense-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use the calculator on the right to compute the total, then
                    enter it here.
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="pharmacist-notes"
                  className="block text-sm font-medium text-slate-700"
                >
                  Pharmacist Notes
                </label>
                <textarea
                  id="pharmacist-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              {error && (
                <div
                  className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4" aria-hidden="true" />
                  {error}
                </div>
              )}

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
                    <span>Processing...</span>
                  </>
                ) : (
                  "Confirm Dispense"
                )}
              </button>
            </form>
          </div>

          {/* ─── Right: Calculator ────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Calculator
            </p>
            <Calculator
              onResult={(result: number) => {
                // The pharmacist uses this as a helper – no auto‑fill
                // Optional: show a toast or tooltip with the result
              }}
            />
            <p className="text-xs text-slate-500 mt-2">
              Use the buttons or your keyboard (0-9, +, -, *, /, Enter, Escape).
              <br />
              <span className="text-emerald-600 font-medium">Tip:</span> Compute
              the total, then enter it in the field above.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
