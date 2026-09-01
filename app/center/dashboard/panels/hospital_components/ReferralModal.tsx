// app/center/dashboard/components/patient_panel/ReferralModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Send } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue } from "@/app/utils/constants";

interface ReferralModalProps {
  patient: any;
  onClose: () => void;
  centers: any[];
  form: { toCenterId: string; reason: string };
  setForm: (form: { toCenterId: string; reason: string }) => void;
  onSubmit: (patientId: string) => Promise<void>;
}

export default function ReferralModal({
  patient,
  onClose,
  centers,
  form,
  setForm,
  onSubmit,
}: ReferralModalProps) {
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    setTimeout(() => firstInputRef.current?.focus(), 100);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(patient.id);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-modal-title"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            id="referral-modal-title"
            className={cn(
              "text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Refer Patient – {patient.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="refer-center"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Receiving Center *
            </label>
            <select
              id="refer-center"
              ref={firstInputRef}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 transition-all bg-white"
              value={form.toCenterId}
              onChange={(e) => setForm({ ...form, toCenterId: e.target.value })}
              aria-describedby="refer-center-help"
            >
              <option value="">Select a center</option>
              {centers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.centerName} ({c.centerType})
                </option>
              ))}
            </select>
            <p id="refer-center-help" className="text-xs text-slate-500 mt-1">
              Choose the destination facility for this referral
            </p>
          </div>

          <div>
            <label
              htmlFor="refer-reason"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Reason for Referral *
            </label>
            <textarea
              id="refer-reason"
              required
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 transition-all resize-none bg-white"
              placeholder="e.g., Specialist consultation, advanced imaging, etc."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              aria-describedby="refer-reason-help"
            />
            <p id="refer-reason-help" className="text-xs text-slate-500 mt-1">
              Provide a clear clinical justification
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Sending..." : "Refer Patient"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
