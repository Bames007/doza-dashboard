"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";

interface AdministerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  prescription: {
    id: string;
    medication: string;
    dosage: string;
    route: string;
    instructions?: string;
  };
  centerId: string;
  user: any;
  onSuccess: () => void;
}

export default function AdministerModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  prescription,
  centerId,
  user,
  onSuccess,
}: AdministerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dose, setDose] = useState(prescription.dosage || "");
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setDose(prescription.dosage || "");
      setTime(new Date().toISOString().slice(0, 16));
      setNotes("");
      setError(null);
    }
  }, [isOpen, prescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/${patientId}/medications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            prescriptionId: prescription.id,
            medication: prescription.medication,
            dose,
            administeredAt: new Date(time).toISOString(),
            notes,
            administeredBy: user.fullName || user.id,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to log administration");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="administer-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id="administer-modal-title"
            className={cn(
              "text-xl font-bold text-slate-900",
              poppins.className,
            )}
          >
            Administer – {prescription.medication}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            aria-label="Close administration modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Patient: <strong>{patientName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="dose"
              className="block text-sm font-medium text-slate-700"
            >
              Dose administered
            </label>
            <input
              id="dose"
              ref={inputRef}
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-time"
              className="block text-sm font-medium text-slate-700"
            >
              Time given
            </label>
            <input
              id="admin-time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-notes"
              className="block text-sm font-medium text-slate-700"
            >
              Notes (e.g., patient response)
            </label>
            <textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Any observations..."
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
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Processing...</span>
              </>
            ) : (
              "Log Administration"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
