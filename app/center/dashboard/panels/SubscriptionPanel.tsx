"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Banknote,
  Upload,
  AlertCircle,
  Phone,
  Send,
  RefreshCw,
  Package as PackageIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";
import { useCenterSubscriptions } from "../dashboards/hooks/useCenterSubsciptions";
import { usePackages, Package } from "../dashboards/hooks/usePackages";
import { format } from "date-fns";

// ─── Helpers ────────────────────────────────────────────────────────

const formatDate = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return "Invalid date";
  }
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "N/A";
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return "Invalid date";
  }
};

const getStatusColor = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending_payment: "bg-slate-100 text-slate-700 border-slate-200",
    pending_approval: "bg-slate-100 text-slate-700 border-slate-200",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
};

const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    active: CheckCircle,
    pending_payment: Clock,
    pending_approval: Clock,
    expired: XCircle,
    rejected: XCircle,
    inactive: AlertCircle,
  };
  return map[status] || AlertCircle;
};

const StatusBadge = ({ status }: { status: string }) => {
  const Icon = getStatusIcon(status);
  const label = status.replace("_", " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        getStatusColor(status),
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

// ─── Countdown Timer ─────────────────────────────────────────────

const CountdownTimer = ({ endDate }: { endDate?: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) {
      setTimeLeft("No expiry");
      return;
    }
    const update = () => {
      const now = Date.now();
      const target = new Date(endDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (isExpired)
    return <span className="text-rose-600 font-bold text-[11px]">Expired</span>;
  return (
    <span className="font-mono text-emerald-700 font-bold text-[11px] tabular-nums">
      {timeLeft}
    </span>
  );
};

// ─── Payment Modal ──────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Package | null;
  addons: Package[];
  selectedAddonIds: Set<string>;
  totalPrice: number;
  onSubmit: (data: { reference: string; proofFile: File }) => void;
  isLoading: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  addons,
  selectedAddonIds,
  totalPrice,
  onSubmit,
  isLoading,
}) => {
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setReference("");
      setProofFile(null);
      setPreviewUrl("");
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      alert("Please enter a transaction reference.");
      return;
    }
    if (!proofFile) {
      alert("Please upload a payment proof.");
      return;
    }
    onSubmit({ reference: reference.trim(), proofFile });
  };

  if (!isOpen || !plan) return null;

  const selectedAddonList = addons.filter((a) => selectedAddonIds.has(a.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3
              className={cn(
                "text-lg sm:text-xl font-bold tracking-wide text-slate-900 truncate",
                bebasNeue.className,
              )}
            >
              Complete Payment
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              Upload your transfer confirmation receipt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="bg-emerald-50/60 rounded-2xl p-3.5 sm:p-4 border border-emerald-200">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {plan.category}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 truncate">
                  {plan.name}
                </h4>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums shrink-0">
                ₦{plan.price.toLocaleString()}
              </span>
            </div>

            {selectedAddonList.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-1.5">
                <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  Add-ons
                </p>
                {selectedAddonList.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center text-[11px] sm:text-xs text-slate-700"
                  >
                    <span className="truncate">{addon.name}</span>
                    <span className="text-emerald-700 font-semibold tabular-nums shrink-0 ml-2">
                      +₦{addon.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Total
              </span>
              <span className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 sm:p-4 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-bold mb-2.5">
              <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-emerald-600">
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <span>Bank Transfer</span>
            </div>
            <div className="space-y-1.5 text-[11px] sm:text-xs bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Name</span>
                <span className="font-semibold text-slate-900 text-right">
                  EBCom Technologies
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Account Number</span>
                <span className="font-bold text-emerald-700 tracking-wider font-mono">
                  910029292093
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Bank</span>
                <span className="font-semibold text-slate-900">Moniepoint</span>
              </div>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText("910029292093")}
                className="flex-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Copy Number
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "tel:08127728084")}
                className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide bg-white border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3 h-3" /> Support
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="reference"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Transaction Reference *
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., DOZA-123456"
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none text-xs sm:text-sm text-slate-900 font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Upload Payment Proof *
              </label>
              <div
                className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="max-h-32 rounded-lg border border-slate-200 object-contain bg-white p-1"
                    />
                    <p className="text-[11px] text-emerald-700 font-bold truncate max-w-full px-2">
                      {proofFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setPreviewUrl("");
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2.5 py-1 rounded-lg transition-all"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="py-3 flex flex-col items-center gap-2">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">
                      Tap to upload receipt
                    </p>
                    <p className="text-[10px] text-slate-500">
                      JPG, PNG, or PDF
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Receipt Modal ──────────────────────────────────────────────

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: any;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  subscription,
}) => {
  if (!isOpen || !subscription) return null;

  const { packageName, packageCategory, paymentDetails, createdAt } =
    subscription;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={cn(
                "text-lg sm:text-xl font-bold tracking-wide text-slate-900",
                bebasNeue.className,
              )}
            >
              Payment Receipt
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 -m-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900">
              Payment Submitted
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
              Pending administrative approval
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2.5 border border-slate-200">
            <div className="flex justify-between items-center text-[11px] sm:text-xs">
              <span className="text-slate-500">Plan</span>
              <span className="font-semibold text-slate-900 truncate ml-2">
                {packageName}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Category</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {packageCategory}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Amount</span>
              <span className="text-sm font-bold text-emerald-700 tabular-nums">
                ₦{paymentDetails.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Reference</span>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 truncate ml-2">
                {paymentDetails.reference || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] sm:text-xs border-t border-slate-200 pt-2">
              <span className="text-slate-500">Submitted</span>
              <span className="text-slate-700 font-medium">
                {formatDateTime(createdAt)}
              </span>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] sm:text-[11px] text-slate-500 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
            <p>Confirmation email will be sent once approved.</p>
            <p className="mt-1">
              Support:{" "}
              <a
                href="tel:08127728084"
                className="text-emerald-700 font-bold hover:underline"
              >
                08127728084
              </a>
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
          >
            Close Receipt
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Plan Detail Modal (NEW — full info view) ──────────────────

interface PlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Package | null;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: () => void;
}

const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  isOpen,
  onClose,
  plan,
  isSelected,
  isCurrent,
  onSelect,
}) => {
  if (!isOpen || !plan) return null;

  const Icon =
    plan.icon && (LucideIcons as any)[plan.icon]
      ? (LucideIcons as any)[plan.icon]
      : PackageIcon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Handle bar */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {plan.name}
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                {plan.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Price block */}
          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Price
              </p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums leading-none mt-1">
                ₦{plan.price.toLocaleString()}
              </p>
            </div>
            {(isCurrent || isSelected) && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-600 text-white px-2.5 py-1 rounded-full">
                {isCurrent ? "Current Plan" : "Selected"}
              </span>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Description
              </p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {plan.description}
              </p>
            </div>
          )}

          {/* All benefits */}
          {plan.benefits && plan.benefits.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  What's included
                </p>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  {plan.benefits.length}
                </span>
              </div>
              <ul className="space-y-2.5">
                {plan.benefits.map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {benefit.name}
                      </p>
                      {benefit.description && (
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {benefit.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 sm:px-5 py-3 sm:py-4 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Close
          </button>
          {!isCurrent && (
            <button
              onClick={() => {
                onSelect();
                onClose();
              }}
              className={cn(
                "w-full sm:flex-1 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors",
                isSelected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
            >
              {isSelected ? "Deselect Plan" : "Select This Plan"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Core Plan Card ──────────────────────────────────────────────

interface CoreCardProps {
  plan: Package;
  isSelected: boolean;
  onSelect: () => void;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onViewDetails: () => void;
}

const CoreCard: React.FC<CoreCardProps> = ({
  plan,
  isSelected,
  onSelect,
  isCurrent,
  isExpanded,
  onToggleExpand,
  onViewDetails,
}) => {
  const Icon =
    plan.icon && (LucideIcons as any)[plan.icon]
      ? (LucideIcons as any)[plan.icon]
      : PackageIcon;

  const benefits = plan.benefits || [];
  const visibleBenefits = isExpanded ? benefits : benefits.slice(0, 3);
  const hasMore = benefits.length > 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-2xl border p-3.5 sm:p-4 transition-all flex flex-col",
        isCurrent
          ? "border-emerald-500 ring-1 ring-emerald-200 bg-emerald-50/20"
          : isSelected
            ? "border-emerald-500 ring-1 ring-emerald-200"
            : "border-slate-200 hover:border-emerald-300 hover:shadow-sm",
      )}
    >
      {/* Header — clickable to select */}
      <div
        onClick={onSelect}
        className="cursor-pointer"
        role="radio"
        aria-checked={isSelected}
        tabIndex={0}
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") &&
          (e.preventDefault(), onSelect())
        }
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {plan.name}
              </h4>
              <span className="text-[9px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                {plan.category}
              </span>
            </div>
          </div>
          {isCurrent && (
            <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
              Current
            </span>
          )}
          {isSelected && !isCurrent && (
            <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
              Selected
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
            ₦{plan.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500">/ package</span>
        </div>

        {plan.description && (
          <p
            className={cn(
              "text-[11px] sm:text-xs text-slate-600 leading-relaxed mb-3",
              !isExpanded && "line-clamp-2",
            )}
          >
            {plan.description}
          </p>
        )}
      </div>

      {/* Benefits */}
      {benefits.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
              Includes
            </p>
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full tabular-nums">
              {benefits.length}
            </span>
          </div>

          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {visibleBenefits.map((benefit, i) => (
                <motion.li
                  key={`${benefit.name}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 text-[11px] text-slate-700"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-medium">{benefit.name}</span>
                    {isExpanded && benefit.description && (
                      <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                        {benefit.description}
                      </span>
                    )}
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Expand toggle — clickable */}
          {hasMore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show {benefits.length - 3} more
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
        {!isCurrent ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={cn(
                "w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all",
                isSelected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {isSelected ? "Selected" : "Select Plan"}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              View Full Details
            </button>
          </>
        ) : (
          <>
            <div className="text-center py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
              Active
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              View Full Details
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─── Add-on Item ────────────────────────────────────────────────

interface AddonItemProps {
  addon: Package;
  isChecked: boolean;
  onToggle: () => void;
}

const AddonItem: React.FC<AddonItemProps> = ({
  addon,
  isChecked,
  onToggle,
}) => {
  const [showAllBenefits, setShowAllBenefits] = useState(false);
  const Icon =
    addon.icon && (LucideIcons as any)[addon.icon]
      ? (LucideIcons as any)[addon.icon]
      : PackageIcon;

  const benefits = addon.benefits || [];
  const visibleBenefits = showAllBenefits ? benefits : benefits.slice(0, 2);
  const hasMore = benefits.length > 2;

  return (
    <div
      className={cn(
        "rounded-xl border transition-all p-3",
        isChecked
          ? "border-emerald-300 bg-emerald-50/60"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "p-1.5 rounded-lg shrink-0",
            isChecked
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">
            {addon.name}
          </p>
          {addon.description && (
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              {addon.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold text-emerald-700 tabular-nums">
            +₦{addon.price.toLocaleString()}
          </span>
          <button
            onClick={onToggle}
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative",
              isChecked ? "bg-emerald-600" : "bg-slate-300",
            )}
            aria-checked={isChecked}
            role="switch"
            aria-label={isChecked ? "Remove add-on" : "Add add-on"}
          >
            <span
              className={cn(
                "block w-3.5 h-3.5 rounded-full bg-white shadow-sm transform transition-transform absolute top-0.5",
                isChecked ? "translate-x-[18px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>

      {benefits.length > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60">
          <ul className="space-y-1">
            {visibleBenefits.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[10px] text-slate-600"
              >
                <CheckCircle className="w-2.5 h-2.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-medium">{b.name}</span>
                  {showAllBenefits && b.description && (
                    <span className="block text-[9px] text-slate-500 mt-0.5">
                      {b.description}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setShowAllBenefits(!showAllBenefits)}
              className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-emerald-700 hover:text-emerald-800"
            >
              {showAllBenefits ? (
                <>
                  <ChevronUp className="w-2.5 h-2.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-2.5 h-2.5" />
                  {benefits.length - 2} more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────

export default function SubscriptionCenterPanel() {
  const { center, user } = useDashboard();

  // ─── Sync localStorage for api.ts ────────────────────────────
  if (typeof window !== "undefined") {
    const sessionRaw = localStorage.getItem("userSession");
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        const userId = session?.user?.id;
        const userName = session?.user?.fullName;
        const userRole = session?.user?.role;
        if (userId) localStorage.setItem("userId", userId);
        if (userName) localStorage.setItem("userName", userName);
        if (userRole) localStorage.setItem("userRole", userRole);
      } catch {}
    }
    if (user?.id) {
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userName", user.fullName || "");
      localStorage.setItem("userRole", user.role || "center_owner");
    }
  }

  // ─── Get centerId ──────────────────────────────────────────────
  let centerId = center?.id;
  if (!centerId && typeof window !== "undefined") {
    try {
      const sessionRaw = localStorage.getItem("userSession");
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        centerId = session?.center?.id || session?.center?.centerId;
      }
    } catch {}
  }

  if (!centerId) {
    return (
      <div className="p-6 text-center text-slate-600 text-sm">
        No center selected. Please log in again or contact support.
      </div>
    );
  }

  // ─── Hooks ────────────────────────────────────────────────────
  const {
    data: subscriptionData,
    loading: subLoading,
    error: subError,
    refetch: refetchSub,
    createSubscription,
  } = useCenterSubscriptions(centerId);

  const {
    packages: availablePlans,
    loading: pkgLoading,
    error: pkgError,
    refetch: refetchPackages,
  } = usePackages({ entityType: "center" });

  // ─── State ────────────────────────────────────────────────────
  const [selectedCore, setSelectedCore] = useState<Package | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(
    new Set(),
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSubscription, setLastSubscription] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ NEW: expanded plan cards (multiple can be expanded for comparison)
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(
    new Set(),
  );

  // ✅ NEW: detail modal state
  const [detailPlan, setDetailPlan] = useState<Package | null>(null);

  // ─── Derived ────────────────────────────────────────────────
  const { corePackages, addOnPackages } = useMemo(() => {
    const cores: Package[] = [];
    const addons: Package[] = [];

    (availablePlans || []).forEach((pkg) => {
      const isCore =
        pkg.category?.toLowerCase().includes("core") ||
        pkg.name?.toLowerCase().includes("core");
      if (isCore) cores.push(pkg);
      else addons.push(pkg);
    });

    return { corePackages: cores, addOnPackages: addons };
  }, [availablePlans]);

  const totalPrice = useMemo(() => {
    if (!selectedCore) return 0;
    let total = selectedCore.price;
    addOnPackages.forEach((addon) => {
      if (selectedAddonIds.has(addon.id)) total += addon.price;
    });
    return total;
  }, [selectedCore, selectedAddonIds, addOnPackages]);

  const { current, pending, history } = subscriptionData;
  const hasActiveOrPending = !!current || !!pending;

  useEffect(() => {
    if (hasActiveOrPending) {
      setSelectedCore(null);
      setSelectedAddonIds(new Set());
      return;
    }
    if (corePackages.length === 1 && !selectedCore) {
      setSelectedCore(corePackages[0]);
    }
  }, [corePackages, hasActiveOrPending, selectedCore]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSelectCore = (plan: Package) => {
    if (plan.id === selectedCore?.id) {
      setSelectedCore(null);
      setSelectedAddonIds(new Set());
    } else {
      setSelectedCore(plan);
      setSelectedAddonIds(new Set());
    }
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  // ✅ NEW: toggle a card's expanded state
  const togglePlanExpanded = (planId: string) => {
    setExpandedPlanIds((prev) => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId);
      else next.add(planId);
      return next;
    });
  };

  const handleProceedToPayment = () => {
    if (!selectedCore) {
      alert("Please select a core plan first.");
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (data: {
    reference: string;
    proofFile: File;
  }) => {
    if (!selectedCore || !centerId) return;
    setIsSubmitting(true);
    try {
      let proofImageUrl = null;
      if (data.proofFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(data.proofFile);
        });
        proofImageUrl = base64;
      }

      const payload = {
        packageId: selectedCore.id,
        packageName: selectedCore.name,
        packageCategory: selectedCore.category,
        price: totalPrice,
        addonIds: Array.from(selectedAddonIds),
        paymentMethod: "bank_transfer",
        reference: data.reference,
        proofImage: proofImageUrl,
      };

      const result = await createSubscription(payload);
      setLastSubscription(result.data);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      await refetchSub();
    } catch (error) {
      alert("Payment submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Early returns ─────────────────────────────────────────────
  if (pkgError || subError) {
    return (
      <div className="p-4 text-rose-600 bg-rose-50 rounded-xl border border-rose-200 text-xs">
        Error: {pkgError || subError}
      </div>
    );
  }

  if (subLoading || pkgLoading) {
    return (
      <div
        className={cn(
          "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
          poppins.className,
        )}
      >
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-7 w-56 bg-slate-200 rounded" />
          <div className="h-4 w-64 bg-slate-100 rounded" />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="mb-4 md:mb-6">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Subscription Center
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {totalPrice > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                  Total
                </span>
                <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                  ₦{totalPrice.toLocaleString()}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                refetchSub();
                refetchPackages();
              }}
              className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Manage Your Subscription
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Choose a plan, add optional features, and complete your payment.
        </p>
      </header>

      {/* ─── Active / Pending ────────────────────────────────── */}
      {(current || pending) && (
        <div className="bg-white rounded-2xl p-3.5 md:p-5 border border-emerald-100 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
              <LucideIcons.ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              {current ? "Active Subscription" : "Pending Approval"}
            </span>
          </div>

          {current ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 truncate">
                    {current.packageName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <StatusBadge status={current.status} />
                    <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(current.startDate)} –{" "}
                      {formatDate(current.endDate)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      <CountdownTimer endDate={current.endDate} />
                    </span>
                  </div>
                </div>
              </div>

              {current.addons && current.addons.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Active Add-ons
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {current.addons.map((addon: any) => (
                      <span
                        key={addon.id}
                        className="text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full"
                      >
                        {addon.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : pending ? (
            <div className="space-y-2">
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Request for{" "}
                <span className="text-emerald-700">{pending.packageName}</span>{" "}
                is under review
              </h3>
              <StatusBadge status={pending.status} />
            </div>
          ) : null}
        </div>
      )}

      {/* ─── Plan Selection ─────────────────────────────────── */}
      {!current && !pending && (
        <div id="plans-section" className="space-y-5 md:space-y-7">
          {/* Step 1 */}
          <section>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Step 1
                </p>
                <h2
                  className={cn(
                    "text-lg md:text-2xl text-slate-900 tracking-tight",
                    bebasNeue.className,
                  )}
                >
                  Choose Your Core Plan
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
                  Select a plan. Expand cards to compare features side by side.
                </p>
              </div>
            </div>

            {corePackages.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">
                  No Core Plans Available
                </h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 px-4">
                  Your center has no core plans configured. Contact your
                  administrator to set one up.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3 items-start">
                {corePackages.map((plan) => (
                  <CoreCard
                    key={plan.id}
                    plan={plan}
                    isSelected={selectedCore?.id === plan.id}
                    onSelect={() => handleSelectCore(plan)}
                    isCurrent={current?.packageId === plan.id}
                    isExpanded={expandedPlanIds.has(plan.id)}
                    onToggleExpand={() => togglePlanExpanded(plan.id)}
                    onViewDetails={() => setDetailPlan(plan)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Step 2 */}
          {selectedCore && corePackages.length > 0 && (
            <section className="pt-5 border-t border-slate-200">
              <div className="mb-3">
                <p className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Step 2 (Optional)
                </p>
                <h2
                  className={cn(
                    "text-lg md:text-2xl text-slate-900 tracking-tight",
                    bebasNeue.className,
                  )}
                >
                  Enhance with Add-ons
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">
                  Optional features to boost your plan.
                </p>
              </div>

              {addOnPackages.length === 0 ? (
                <div className="text-center py-6 bg-white rounded-2xl border border-slate-200 text-[11px] text-slate-500">
                  No add-ons available at the moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
                  {addOnPackages.map((addon) => (
                    <AddonItem
                      key={addon.id}
                      addon={addon}
                      isChecked={selectedAddonIds.has(addon.id)}
                      onToggle={() => toggleAddon(addon.id)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleProceedToPayment}
                  className="w-full sm:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  Proceed to Payment
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─── History ────────────────────────────────────────── */}
      {history && history.length > 0 && (
        <section className="mt-6 md:mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3
              className={cn(
                "text-base md:text-xl text-slate-900 tracking-tight",
                bebasNeue.className,
              )}
            >
              Subscription History
            </h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {history.length} record{history.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Billing Period
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {item.packageName}
                      {item.addons && item.addons.length > 0 && (
                        <span className="block text-[10px] text-slate-500 mt-0.5 font-normal">
                          + {item.addons.map((a: any) => a.name).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {item.startDate ? (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(item.startDate)} –{" "}
                          {formatDate(item.endDate)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700 text-right tabular-nums">
                      ₦{item.paymentDetails?.amount?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {history.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {item.packageName}
                    </p>
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                        + {item.addons.map((a: any) => a.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.startDate
                      ? `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`
                      : "—"}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 tabular-nums">
                    ₦{item.paymentDetails?.amount?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Modals ────────────────────────────────────────── */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedCore}
        addons={addOnPackages}
        selectedAddonIds={selectedAddonIds}
        totalPrice={totalPrice}
        onSubmit={handlePaymentSubmit}
        isLoading={isSubmitting}
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        subscription={lastSubscription}
      />

      {/* ✅ NEW: Plan detail modal */}
      <AnimatePresence>
        {detailPlan && (
          <PlanDetailModal
            isOpen={!!detailPlan}
            onClose={() => setDetailPlan(null)}
            plan={detailPlan}
            isSelected={selectedCore?.id === detailPlan.id}
            isCurrent={current?.packageId === detailPlan.id}
            onSelect={() => handleSelectCore(detailPlan)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
