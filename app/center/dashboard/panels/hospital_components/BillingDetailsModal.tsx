// app/center/dashboard/panels/hospital_components/BillingDetailsModal.tsx

"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Printer,
  FileText,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";

interface Bill {
  id: string;
  items: Array<{
    type: string;
    description: string;
    amount: number;
    quantity?: number;
  }>;
  total: number;
  status: "pending" | "approved" | "paid" | "discharged" | "hmo";
  paymentMethod?: "cash" | "card" | "hmo" | "bank_transfer" | "pending";
  hmoProvider?: string;
  hmoAuthorization?: string;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt?: number;
  updatedByName?: string;
  paymentDate?: string;
}

interface BillingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bills: Bill[];
  total: number;
  patientName: string;
  patientId: string;
  centerId: string;
  userId: string;
  userFullName: string;
  userRole: string;
  onUpdate: () => void;
  permissions: {
    canApproveBills: boolean;
    canApproveDischarge: boolean;
  };
  onDischargePatient?: () => void;
}

interface ReceiptModalData {
  title: string;
  isConsolidated: boolean;
  bills: Bill[];
}

export default function BillingDetailsModal({
  isOpen,
  onClose,
  bills,
  total,
  patientName,
  patientId,
  centerId,
  userId,
  userFullName,
  userRole,
  onUpdate,
  permissions,
  onDischargePatient,
}: BillingDetailsModalProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    status: "paid" as "paid" | "hmo" | "pending",
    paymentMethod: "cash" as
      | "cash"
      | "card"
      | "hmo"
      | "bank_transfer"
      | "pending",
    hmoProvider: "",
    hmoAuthorization: "",
    notes: "",
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptModalData | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const paidBills = bills.filter(
    (b) =>
      b.status === "paid" || b.status === "hmo" || b.status === "discharged",
  );

  // ✅ FIX: allPaid should be true only if there is at least one bill and all are settled
  const allPaid =
    bills.length > 0 &&
    bills.every(
      (b) =>
        b.status === "paid" || b.status === "hmo" || b.status === "discharged",
    );

  const handleUpdateBill = async (billId: string, data: any) => {
    setUpdating(billId);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/${patientId}/bills?billId=${billId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            "x-user-name": userFullName,
            "x-user-role": userRole,
          },
          body: JSON.stringify(data),
        },
      );
      const result = await res.json();
      if (result.success) {
        onUpdate(); // triggers refresh in parent
        setShowPaymentForm(false);
        setSelectedBill(null);
        // If the bill is now paid, show receipt option
        if (data.status === "paid" || data.status === "hmo") {
          const updatedBill = { ...selectedBill, ...data } as Bill;
          setReceiptData({
            title: "Payment Receipt",
            isConsolidated: false,
            bills: [updatedBill],
          });
        }
      } else {
        alert(result.error || "Failed to update bill");
      }
    } catch (err) {
      alert("Failed to update bill");
    } finally {
      setUpdating(null);
    }
  };

  const handlePaymentSubmit = () => {
    if (!selectedBill) return;
    const data: any = {
      status: paymentForm.status,
      paymentMethod: paymentForm.paymentMethod,
      notes: paymentForm.notes || undefined,
      paymentDate: new Date().toISOString(),
    };
    if (paymentForm.status === "hmo") {
      data.hmoProvider = paymentForm.hmoProvider;
      data.hmoAuthorization = paymentForm.hmoAuthorization;
    }
    handleUpdateBill(selectedBill.id, data);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "paid":
        return {
          label: "Paid",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
          icon: CheckCircle,
        };
      case "hmo":
        return {
          label: "HMO",
          color: "bg-blue-50 text-blue-700 border-blue-200/60",
          icon: Building,
        };
      case "approved":
        return {
          label: "Approved",
          color: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
          icon: CheckCircle,
        };
      case "discharged":
        return {
          label: "Discharged",
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: Clock,
        };
      default:
        return {
          label: "Pending",
          color: "bg-amber-50 text-amber-700 border-amber-200/60",
          icon: AlertCircle,
        };
    }
  };

  const handlePrintSingleReceipt = (bill: Bill) => {
    setReceiptData({
      title: "Payment Receipt",
      isConsolidated: false,
      bills: [bill],
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handlePrintAllReceipts = () => {
    const targetBills = paidBills.length > 0 ? paidBills : bills;
    setReceiptData({
      title: "Consolidated Billing Statement",
      isConsolidated: true,
      bills: targetBills,
    });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ─── MAIN MODAL ───────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4",
          receiptData && "print:hidden",
          poppins.className,
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden max-h-[90vh] flex flex-col border border-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                Billing Details
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {patientName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {bills.length > 0 && (
                <button
                  onClick={handlePrintAllReceipts}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-xs transition-all active:scale-95"
                  title="Print all paid receipts"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-600" />
                  Print All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {bills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">
                  No bills recorded for this patient.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bills.map((bill) => {
                  const status = getStatusDisplay(bill.status);
                  const StatusIcon = status.icon;
                  const isPending =
                    bill.status === "pending" || bill.status === "approved";
                  const canUpdate = permissions.canApproveBills && isPending;
                  const isPaid =
                    bill.status === "paid" || bill.status === "hmo";

                  return (
                    <div
                      key={bill.id}
                      className="bg-white border border-slate-200/70 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider border",
                              status.color,
                            )}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(bill.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          {bill.paymentMethod &&
                            bill.paymentMethod !== "pending" && (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                                {bill.paymentMethod.replace("_", " ")}
                              </span>
                            )}
                          {bill.hmoProvider && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
                              {bill.hmoProvider}
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">
                          ₦
                          {bill.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {bill.items.length > 0 && (
                        <div className="px-5 py-3 space-y-2.5 bg-slate-50/50">
                          {bill.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-sm"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">
                                  {item.description}
                                </span>
                                {item.quantity && item.quantity > 1 && (
                                  <span className="text-xs text-slate-400">
                                    Qty: {item.quantity} × ₦
                                    {item.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-slate-900">
                                ₦
                                {(
                                  item.amount * (item.quantity || 1)
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
                        <div className="text-[11px] font-medium text-slate-400 flex flex-col gap-0.5">
                          <span>
                            Created by{" "}
                            <span className="text-slate-600">
                              {bill.createdByName || "Unknown"}
                            </span>
                          </span>
                          {bill.updatedByName && (
                            <span>
                              Updated by{" "}
                              <span className="text-slate-600">
                                {bill.updatedByName}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {canUpdate && (
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentForm(true);
                                setPaymentForm({
                                  status: "paid",
                                  paymentMethod: "cash",
                                  hmoProvider: "",
                                  hmoAuthorization: "",
                                  notes: "",
                                });
                              }}
                              className="text-xs font-medium text-emerald-700 px-4 py-2 bg-emerald-50 border border-emerald-200/50 rounded-xl hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95"
                            >
                              Mark Payment
                            </button>
                          )}
                          {isPaid && (
                            <button
                              onClick={() => handlePrintSingleReceipt(bill)}
                              className="text-xs font-medium text-slate-700 px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer & Actions */}
          <div className="px-6 py-5 border-t border-slate-200 bg-white shrink-0 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Total Billed
                </span>
                {bills.length > 0 && (
                  <button
                    onClick={handlePrintAllReceipts}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print All
                  </button>
                )}
              </div>
              <span className="text-2xl font-bold text-emerald-600 tracking-tight">
                ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* ─── Discharge Button – only when all bills are settled ─── */}
            {permissions.canApproveDischarge &&
              allPaid &&
              onDischargePatient &&
              bills.length > 0 && (
                <button
                  onClick={onDischargePatient}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Confirm Payment & Discharge Patient
                </button>
              )}
          </div>
        </motion.div>
      </div>

      {/* ─── PAYMENT FORM ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentForm && selectedBill && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-100"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
                  Update Payment
                </h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Payment Status <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={paymentForm.status}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="paid">Paid Full</option>
                      <option value="hmo">Covered by HMO</option>
                      <option value="pending">Pending</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentMethod: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card (POS)</option>
                      <option value="hmo">HMO Authorization</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                  </div>
                </div>

                {/* HMO fields */}
                {paymentForm.status === "hmo" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        HMO Provider <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={paymentForm.hmoProvider}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            hmoProvider: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g., AXA Mansard, NHIS"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Authorization Code
                      </label>
                      <input
                        type="text"
                        value={paymentForm.hmoAuthorization}
                        onChange={(e) =>
                          setPaymentForm({
                            ...paymentForm,
                            hmoAuthorization: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="e.g., HMO-12345"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    placeholder="Reference IDs, comments..."
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handlePaymentSubmit}
                  disabled={updating === selectedBill.id}
                  className="w-full py-3.5 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {updating === selectedBill.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Confirm & Save"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── RECEIPT / PDF LAYOUT ──────────────────────────────────────── */}
      {receiptData && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 print:p-0 print:bg-white print:block overflow-y-auto"
          onClick={() => setReceiptData(null)}
        >
          <div
            ref={receiptRef}
            className="bg-white max-w-3xl w-full rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden print:shadow-none print:rounded-none print:max-w-full print:w-full print:p-8 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] print:opacity-[0.04]">
              <img
                src="/logo.png"
                alt="Watermark"
                className="w-2/3 max-w-md object-contain grayscale"
              />
            </div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                    <img
                      src="/logo.png"
                      alt="Logo"
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {receiptData.isConsolidated
                        ? "STATEMENT OF ACCOUNT"
                        : "OFFICIAL RECEIPT"}
                    </h1>
                    <p className="text-xs font-medium text-emerald-600 mt-0.5 tracking-wide">
                      {receiptData.isConsolidated
                        ? "CONSOLIDATED INVOICE STATEMENT"
                        : "PROOF OF PAYMENT"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Print / PDF
                  </button>
                  <button
                    onClick={() => setReceiptData(null)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    {receiptData.isConsolidated
                      ? "Total Invoices"
                      : "Invoice No."}
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {receiptData.isConsolidated
                      ? `${receiptData.bills.length} Invoice(s)`
                      : `#${receiptData.bills[0]?.id.slice(-8).toUpperCase()}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Date Generated
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date().toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-sm font-bold text-emerald-600 uppercase">
                    PAID / CLEARED
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Payment Method
                  </p>
                  <p className="text-sm font-medium text-slate-900 uppercase">
                    {!receiptData.isConsolidated
                      ? receiptData.bills[0]?.paymentMethod?.replace(
                          "_",
                          " ",
                        ) || "N/A"
                      : "Multiple / Mixed"}
                  </p>
                </div>
              </div>

              {/* Patient Info */}
              <div className="mb-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Patient Information
                </p>
                <h3 className="text-lg font-semibold text-slate-900">
                  {patientName}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Patient ID: {patientId.slice(-8).toUpperCase()}
                </p>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <div className="grid grid-cols-12 gap-4 pb-3 border-b-2 border-slate-900 mb-4 px-2">
                  <div className="col-span-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Item Description
                  </div>
                  <div className="col-span-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Qty
                  </div>
                  <div className="col-span-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Rate
                  </div>
                  <div className="col-span-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Amount
                  </div>
                </div>

                <div className="space-y-6 px-2">
                  {receiptData.bills.map((bill, billIdx) => (
                    <div key={bill.id} className="space-y-2">
                      {receiptData.isConsolidated && (
                        <div className="flex items-center justify-between pt-2 pb-1 border-b border-slate-200/80 text-xs font-medium text-slate-500">
                          <span>
                            Invoice #{bill.id.slice(-8).toUpperCase()} —{" "}
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </span>
                          <span className="uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {bill.paymentMethod || bill.status}
                          </span>
                        </div>
                      )}
                      {bill.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-4 text-sm items-center py-1"
                        >
                          <div className="col-span-6 font-medium text-slate-800">
                            {item.description}
                          </div>
                          <div className="col-span-2 text-right text-slate-600">
                            {item.quantity || 1}
                          </div>
                          <div className="col-span-2 text-right text-slate-600">
                            ₦
                            {item.amount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          <div className="col-span-2 text-right font-semibold text-slate-900">
                            ₦
                            {(
                              item.amount * (item.quantity || 1)
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              {(() => {
                const combinedTotal = receiptData.bills.reduce(
                  (sum, b) => sum + b.total,
                  0,
                );
                return (
                  <div className="flex justify-end mb-8">
                    <div className="w-full sm:w-1/2 lg:w-5/12 space-y-2">
                      <div className="flex justify-between text-sm py-2 px-2">
                        <span className="font-medium text-slate-500">
                          Subtotal
                        </span>
                        <span className="font-bold text-slate-900">
                          ₦
                          {combinedTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg py-3.5 px-3 border-t-2 border-slate-900 bg-slate-50 rounded-xl">
                        <span className="font-bold text-slate-900 uppercase tracking-tight">
                          Grand Total
                        </span>
                        <span className="font-bold text-emerald-600">
                          ₦
                          {combinedTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Footer */}
              <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Terms & Notes
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    This official statement serves as proof of payment for all
                    listed medical services and items.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Issued By
                  </p>
                  <p className="text-xs font-medium text-slate-800">
                    {userFullName || "Hospital Billing Dept"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
