// app/center/dashboard/components/patient_panel/DispenseModal.tsx
"use client";

import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useState } from "react";

interface DispenseModalProps {
  patientName: string;
  medication: string;
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
  onClose,
  onDispense,
}: DispenseModalProps) {
  const [status, setStatus] = useState<
    "full" | "partial" | "out_of_stock" | "cancelled"
  >("full");
  const [quantity, setQuantity] = useState<number | "">("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (status === "partial" && !quantity) {
      alert("Please enter the quantity dispensed.");
      return;
    }
    setLoading(true);
    await onDispense({
      status,
      quantity: status === "partial" ? Number(quantity) : undefined,
      notes: notes.trim() || undefined,
    });
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispense-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col"
      >
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
          <h3
            id="dispense-modal-title"
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Dispense Medication – {patientName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Medication
            </label>
            <p className="text-slate-900 font-semibold">{medication}</p>
          </div>

          <div>
            <label
              htmlFor="dispense-status"
              className="block text-sm font-medium text-slate-700"
            >
              Dispense Status *
            </label>
            <select
              id="dispense-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="full">Full Dispense</option>
              <option value="partial">Partial Dispense</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {status === "partial" && (
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-slate-700"
              >
                Quantity Dispensed *
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g., 10"
                required
              />
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
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="e.g., Patient advised to take with food, partial due to stock shortage"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (status === "partial" && !quantity)}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Confirm Dispense"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
