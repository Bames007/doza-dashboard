"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { motion } from "framer-motion";
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
  Plus,
  Minus,
  ChevronRight,
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
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
    pending_approval: "bg-blue-100 text-blue-700 border-blue-200",
    expired: "bg-rose-100 text-rose-700 border-rose-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    inactive: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
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
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        getStatusColor(status),
      )}
    >
      <Icon className="w-3 h-3" />
      {status.replace("_", " ").charAt(0).toUpperCase() +
        status.replace("_", " ").slice(1)}
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
      const now = new Date().getTime();
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
    return <span className="text-rose-600 font-semibold">Expired</span>;
  return (
    <span className="font-mono text-emerald-600 font-bold">{timeLeft}</span>
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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3
              id="payment-modal-title"
              className={cn(
                "text-2xl font-bold tracking-wide text-slate-900",
                bebasNeue.className,
              )}
            >
              Complete Payment
            </h3>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              Review details and upload your transfer confirmation receipt.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:ring-2 focus:ring-emerald-600 outline-none"
            aria-label="Close payment modal"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Plan summary */}
          <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  {plan.category}
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-1.5">
                  {plan.name}
                </h4>
              </div>
              <span className="text-sm font-bold text-slate-700">
                ₦{plan.price.toLocaleString()}
              </span>
            </div>

            {selectedAddonList.length > 0 && (
              <div className="mt-3.5 pt-3.5 border-t border-emerald-200/60 space-y-2">
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Selected Add-ons
                </p>
                {selectedAddonList.map((addon) => (
                  <div
                    key={addon.id}
                    className="flex justify-between items-center text-sm text-slate-700 font-medium"
                  >
                    <span>{addon.name}</span>
                    <span className="text-emerald-800 font-semibold">
                      +₦{addon.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3.5 border-t border-emerald-200/80 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total Amount
              </span>
              <span className="text-2xl font-black text-emerald-700 tracking-tight">
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Bank details */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-3">
              <div className="p-2 bg-white border border-slate-200 rounded-xl text-emerald-600 shadow-xs">
                <Banknote className="w-4 h-4" />
              </div>
              <span>Bank Transfer Details</span>
            </div>
            <div className="space-y-1.5 text-sm bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">
                  Account Name:
                </span>
                <span className="font-semibold text-slate-900">
                  EBCom Technologies
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">
                  Account Number:
                </span>
                <span className="font-bold text-emerald-700 tracking-wide font-mono">
                  910029292093
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Bank:</span>
                <span className="font-semibold text-slate-900">Moniepoint</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText("910029292093")}
                className="flex-1 text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                Copy Account Number
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "tel:08127728084")}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3.5 py-2 hover:bg-slate-50 text-slate-700 transition-colors shadow-xs focus:ring-2 focus:ring-emerald-600 outline-none flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Contact Support
              </button>
            </div>
          </div>

          {/* Payment form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reference"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
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
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none text-sm text-slate-900 font-medium shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Upload Payment Proof *
              </label>
              <div
                className="border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-5 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group"
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
                  <div className="flex flex-col items-center gap-2.5">
                    <img
                      src={previewUrl}
                      alt="Payment receipt preview"
                      className="max-h-36 rounded-xl shadow-md border border-slate-200 object-contain bg-white p-1"
                    />
                    <p className="text-xs text-emerald-800 font-bold">
                      {proofFile?.name}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProofFile(null);
                        setPreviewUrl("");
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-3 py-1 rounded-lg shadow-xs transition-all"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                      Click or drag to upload receipt
                    </p>
                    <p className="text-xs font-medium text-slate-600">
                      Supports JPG, PNG, or PDF format
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors focus:ring-2 focus:ring-slate-400 outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Payment</span>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <h3
            id="receipt-title"
            className={cn(
              "text-2xl font-bold tracking-wide text-slate-900",
              bebasNeue.className,
            )}
          >
            Payment Receipt
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:ring-2 focus:ring-emerald-600 outline-none"
            aria-label="Close receipt modal"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-xs">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">
            Payment Submitted
          </h4>
          <p className="text-xs font-medium text-slate-600 mt-1">
            Your subscription request is currently pending administrative
            approval.
          </p>
        </div>

        <div className="bg-slate-50/70 rounded-2xl p-4.5 space-y-3 border border-slate-200/80 shadow-xs">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600 font-medium">Plan</span>
            <span className="font-semibold text-slate-900">{packageName}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-600 font-medium">Category</span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              {packageCategory}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-600 font-medium">Amount Paid</span>
            <span className="text-base font-black text-emerald-700">
              ₦{paymentDetails.amount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-600 font-medium">Reference</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              {paymentDetails.reference || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-600 font-medium">Submitted On</span>
            <span className="font-medium text-slate-900">
              {formatDateTime(createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-5 text-center text-xs font-medium text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <p>You will receive a confirmation email once approved.</p>
          <p className="mt-1">
            For inquiries:{" "}
            <a
              href="tel:08127728084"
              className="text-emerald-600 font-bold hover:underline"
            >
              08127728084
            </a>
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-600/20 focus:ring-2 focus:ring-emerald-600 outline-none"
        >
          Close Receipt
        </button>
      </motion.div>
    </div>
  );
};

// ─── Core Plan Card ────────────────────────────────────────────────

interface CoreCardProps {
  plan: Package;
  isSelected: boolean;
  onSelect: () => void;
  isCurrent: boolean;
}

const CoreCard: React.FC<CoreCardProps> = ({
  plan,
  isSelected,
  onSelect,
  isCurrent,
}) => {
  const Icon =
    plan.icon && (LucideIcons as any)[plan.icon]
      ? (LucideIcons as any)[plan.icon]
      : PackageIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "bg-white rounded-3xl border p-6 shadow-xs transition-all cursor-pointer relative flex flex-col justify-between group",
        isCurrent
          ? "border-emerald-500 ring-2 ring-emerald-400/50 bg-emerald-50/10"
          : isSelected
            ? "border-emerald-500 ring-2 ring-emerald-400/50 shadow-md"
            : "border-slate-200/80 hover:border-emerald-300 hover:shadow-md",
      )}
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())
      }
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shadow-xs">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">
                {plan.name}
              </h4>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {plan.category}
              </span>
            </div>
          </div>
          {isCurrent && (
            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
              Current Plan
            </span>
          )}
          {isSelected && !isCurrent && (
            <span className="text-[11px] font-bold bg-emerald-600 text-white px-3 py-1 rounded-full shadow-xs shadow-emerald-600/20">
              Selected
            </span>
          )}
        </div>

        <div className="mt-5">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              ₦{plan.price.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / package
            </span>
          </div>

          {plan.description && (
            <p className="text-sm text-slate-600 mt-2.5 font-medium">
              {plan.description}
            </p>
          )}

          {plan.benefits && plan.benefits.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                Key Benefits
              </p>
              <ul className="space-y-2">
                {plan.benefits.slice(0, 4).map((benefit, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-900">
                        {benefit.name}
                      </span>
                      {benefit.description && (
                        <span className="text-xs text-slate-500 block">
                          {benefit.description}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {plan.benefits.length > 4 && (
                  <li className="text-xs font-semibold text-emerald-700 pt-1">
                    +{plan.benefits.length - 4} more included benefits
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100">
        {!isCurrent ? (
          <button
            type="button"
            className={cn(
              "w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-xs outline-none focus:ring-2 focus:ring-emerald-600",
              isSelected
                ? "bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            {isSelected ? "Selected Plan" : "Select Plan"}
          </button>
        ) : (
          <div className="text-center py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-100">
            Active Subscription
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Add‑on Toggle ────────────────────────────────────────────────

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
  const Icon =
    addon.icon && (LucideIcons as any)[addon.icon]
      ? (LucideIcons as any)[addon.icon]
      : PackageIcon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        isChecked
          ? "border-emerald-400 bg-emerald-50/70 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className={cn(
            "p-2 rounded-xl",
            isChecked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-slate-800">{addon.name}</p>
          {addon.description && (
            <p className="text-sm text-slate-500">{addon.description}</p>
          )}
          {addon.benefits && addon.benefits.length > 0 && (
            <ul className="mt-1 text-xs text-slate-600 space-y-0.5">
              {addon.benefits.slice(0, 2).map((b, i) => (
                <li key={i} className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  {b.name}
                </li>
              ))}
              {addon.benefits.length > 2 && (
                <li>+{addon.benefits.length - 2} more</li>
              )}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-emerald-600">
          +₦{addon.price.toLocaleString()}
        </span>
        <button
          onClick={onToggle}
          className={cn(
            "w-10 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-emerald-500",
            isChecked ? "bg-emerald-600" : "bg-slate-300",
          )}
          aria-checked={isChecked}
          role="switch"
        >
          <span
            className={cn(
              "block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform absolute top-1",
              isChecked ? "translate-x-5" : "translate-x-1",
            )}
          />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────

export default function SubscriptionCenterPanel() {
  const { center, user } = useDashboard();

  // ─── Ensure localStorage has user data for api.ts ────────────
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
      <div className="p-8 text-center text-slate-600">
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

  // ─── Derived Data – Improved logic ───────────────────────────

  const { corePackages, addOnPackages } = useMemo(() => {
    const cores: Package[] = [];
    const addons: Package[] = [];

    (availablePlans || []).forEach((pkg) => {
      // 🔍 Check both category and name for "core"
      const isCore =
        pkg.category?.toLowerCase().includes("core") ||
        pkg.name?.toLowerCase().includes("core");

      if (isCore) {
        cores.push(pkg);
      } else {
        addons.push(pkg);
      }
    });

    // ❌ NO FALLBACK – if no core plans exist, corePackages remains empty
    return { corePackages: cores, addOnPackages: addons };
  }, [availablePlans]);

  // Compute total price
  const totalPrice = useMemo(() => {
    if (!selectedCore) return 0;
    let total = selectedCore.price;
    addOnPackages.forEach((addon) => {
      if (selectedAddonIds.has(addon.id)) total += addon.price;
    });
    return total;
  }, [selectedCore, selectedAddonIds, addOnPackages]);

  // ─── Auto‑select first core if only one exists ──────────────

  const { current, pending, history } = subscriptionData;
  const hasActiveOrPending = !!current || !!pending;

  useEffect(() => {
    if (hasActiveOrPending) {
      setSelectedCore(null);
      setSelectedAddonIds(new Set());
      return;
    }
    // Only auto‑select if there is exactly one core plan
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
      const newSet = new Set(prev);
      if (newSet.has(addonId)) newSet.delete(addonId);
      else newSet.add(addonId);
      return newSet;
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

  // ─── Render ──────────────────────────────────────────────────

  if (pkgError) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-200">
        Error loading packages: {pkgError}
      </div>
    );
  }
  if (subError) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl border border-red-200">
        Error loading subscriptions: {subError}
      </div>
    );
  }

  if (subLoading || pkgLoading) {
    return (
      <div
        className={cn(
          "space-y-8 pb-20 px-4 sm:px-0 max-w-7xl mx-auto",
          poppins.className,
        )}
      >
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-slate-200 rounded-xl" />
            <div className="h-4 w-40 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 bg-slate-100 rounded-3xl border border-slate-200/60"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-10 pb-24 px-4 sm:px-0 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Header with Total Price ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <h1
            className={cn(
              "text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900",
              bebasNeue.className,
            )}
          >
            Subscription Center
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage your center's core plans, billing history, and active
            add-ons.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-2.5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total
              </span>
              <span className="text-xl font-black text-emerald-700">
                ₦{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              refetchSub();
              refetchPackages();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Current Subscription Status */}
      {(current || pending) && (
        <div className="bg-gradient-to-br from-white via-white to-emerald-50/20 rounded-3xl p-6 sm:p-8 border border-emerald-100/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold tracking-wider uppercase">
                <LucideIcons.ShieldCheck className="w-3.5 h-3.5" /> Active
                Status
              </div>
              {current ? (
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {current.packageName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 text-sm text-slate-600">
                    <StatusBadge status={current.status} />
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      {formatDate(current.startDate)} –{" "}
                      {formatDate(current.endDate)}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                      <Clock className="w-4 h-4" />
                      <CountdownTimer endDate={current.endDate} />
                    </span>
                  </div>
                  {current.addons && current.addons.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Active Add‑ons:
                      </span>
                      {current.addons.map((addon: any) => (
                        <span
                          key={addon.id}
                          className="text-xs font-semibold bg-white border border-slate-200/80 text-slate-700 px-3 py-1 rounded-xl shadow-xs"
                        >
                          {addon.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : pending ? (
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-amber-600 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Pending Approval
                  </h3>
                  <p className="text-sm font-medium text-slate-600">
                    Your request for{" "}
                    <strong className="text-slate-900 font-semibold">
                      {pending.packageName}
                    </strong>{" "}
                    is being reviewed.
                  </p>
                  <div className="pt-2">
                    <StatusBadge status={pending.status} />
                  </div>
                </div>
              ) : null}
            </div>
            {!current && !pending && (
              <button
                onClick={() =>
                  document
                    .getElementById("plans-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all self-start"
              >
                Choose Your Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* No active subscription? Show selection */}
      {!current && !pending && (
        <div id="plans-section" className="space-y-12">
          {/* Core Plans */}
          <div className="space-y-4">
            <div>
              <h2
                className={cn(
                  "text-2xl font-bold text-slate-900 tracking-tight",
                  bebasNeue.className,
                )}
              >
                Step 1: Choose Your Core Plan
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                Select the foundational package that fits your center's tier.
              </p>
            </div>
            {corePackages.length === 0 ? (
              <div className="text-center py-12 bg-amber-50 border border-amber-200 rounded-3xl shadow-xs">
                <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                <h4 className="font-bold text-amber-800 text-base">
                  No Core Plans Available
                </h4>
                <p className="text-sm font-medium text-amber-700 max-w-md mx-auto mt-1">
                  Your center does not have any core plans configured. Please
                  contact your administrator or support to set up a core plan
                  before you can subscribe.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {corePackages.map((plan) => {
                  const isCurrent = current?.packageId === plan.id;
                  return (
                    <CoreCard
                      key={plan.id}
                      plan={plan}
                      isSelected={selectedCore?.id === plan.id}
                      onSelect={() => handleSelectCore(plan)}
                      isCurrent={isCurrent}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Add‑ons (only if core selected AND corePackages exist) */}
          {selectedCore && corePackages.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                <div>
                  <h2
                    className={cn(
                      "text-2xl font-bold text-slate-900 tracking-tight",
                      bebasNeue.className,
                    )}
                  >
                    Step 2: Enhance with Add‑ons
                  </h2>
                  <p className="text-sm font-medium text-slate-600 mt-0.5">
                    Optional enhancements to boost your feature set.
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total:
                  </span>
                  <span className="text-lg font-black text-emerald-700">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {addOnPackages.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
                  <p className="text-sm font-medium text-slate-500">
                    No add‑ons available at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleProceedToPayment}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Proceed to Secure Payment <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Table */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3
              className={cn(
                "text-xl font-bold text-slate-900 tracking-tight",
                bebasNeue.className,
              )}
            >
              Subscription History
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              {history.length} Record{history.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Plan Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Billing Period</th>
                  <th className="px-6 py-4">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-emerald-50/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {item.packageName}
                      {item.addons && item.addons.length > 0 && (
                        <span className="block text-xs font-medium text-slate-500 mt-0.5">
                          + {item.addons.map((a: any) => a.name).join(", ")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {item.startDate ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(item.startDate)} –{" "}
                          {formatDate(item.endDate)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">
                      ₦{item.paymentDetails?.amount?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
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
    </div>
  );
}
