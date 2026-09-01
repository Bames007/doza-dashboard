"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";

interface DozaOTPConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerId: string;
  patientId: string;
  requestId: string;
  patientName: string;
  medicId: string;
  medicRole: string;
  onSuccess: () => void;
  showPatientType?: boolean; // NEW: control patient type selection
}

export default function DozaOTPConfirmModal({
  isOpen,
  onClose,
  centerId,
  patientId,
  requestId,
  patientName,
  medicId,
  medicRole,
  onSuccess,
  showPatientType = true,
}: DozaOTPConfirmModalProps) {
  const [otp, setOtp] = useState("");
  const [patientType, setPatientType] = useState<"inpatient" | "outpatient">(
    "outpatient",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setOtp("");
      setPatientType("outpatient");
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6‑digit OTP.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/centers/${centerId}/patients/confirm-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": medicId,
          "x-user-role": medicRole,
        },
        body: JSON.stringify({
          userId: patientId,
          requestId,
          otp,
          patientType: showPatientType ? patientType : "outpatient", // always outpatient if hidden
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Confirmation failed");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-confirm-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3
              id="otp-confirm-title"
              className={cn(
                "text-lg font-bold text-slate-900",
                poppins.className,
              )}
            >
              Confirm OTP
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-700">
            Enter the 6‑digit OTP provided by{" "}
            <span className="font-semibold text-emerald-700">
              {patientName}
            </span>{" "}
            to start the session.
          </p>

          {/* Patient Type – only shown if showPatientType is true */}
          {showPatientType && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPatientType("outpatient")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                    patientType === "outpatient"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Outpatient</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPatientType("inpatient")}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all",
                    patientType === "inpatient"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Inpatient</span>
                </button>
              </div>
            </div>
          )}

          {/* OTP Input */}
          <div>
            <label
              htmlFor="otp-input"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              One‑Time Password
            </label>
            <input
              ref={inputRef}
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="e.g. 123456"
              className={cn(
                "w-full px-4 py-3 border rounded-xl text-center text-2xl font-mono tracking-[0.25em] focus:ring-2 outline-none transition",
                error
                  ? "border-rose-300 focus:ring-rose-500/40"
                  : "border-slate-300 focus:ring-emerald-500/40 focus:border-emerald-500",
              )}
              disabled={loading}
              aria-invalid={!!error}
              aria-describedby={error ? "otp-error" : undefined}
            />
            {error && (
              <motion.p
                id="otp-error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-600 flex items-center gap-1 mt-1.5"
                role="alert"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </motion.p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || otp.length !== 6}
              className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {loading ? "Verifying..." : "Start Session"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
