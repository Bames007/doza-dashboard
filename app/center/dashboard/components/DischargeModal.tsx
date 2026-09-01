// app/center/dashboard/components/DischargeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, AlertCircle, DollarSign, FileCheck } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";

interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  centerId: string;
  user: any; // current user
  onSuccess: () => void;
}

export default function DischargeModal({
  isOpen,
  onClose,
  patient,
  centerId,
  user,
  onSuccess,
}: DischargeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bill, setBill] = useState<any>(null);
  const [step, setStep] = useState<
    "initiate" | "review" | "approve" | "finalize"
  >("initiate");
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notes, setNotes] = useState("");

  const role = user?.role || "staff";
  const isDoctor = role === "doctor" || role === "nurse";
  const isAccountant = role === "billing" || role === "accountant";
  const isAdmin =
    role === "admin" || role === "center_owner" || role === "super_admin";

  // ─── Fetch or create bill on open ──────────────────────────────
  useEffect(() => {
    if (!isOpen || !patient) return;
    fetchBill();
  }, [isOpen, patient]);

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/${patient.id}/bills`,
        { headers: { "x-user-id": user.id } },
      );
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        const pending = data.data.find((b: any) => b.status === "pending");
        if (pending) {
          setBill(pending);
          setStep(
            pending.status === "pending"
              ? isAccountant
                ? "approve"
                : "review"
              : "finalize",
          );
          return;
        }
      }
      await createBill();
    } catch (err) {
      setError("Failed to load bill");
    } finally {
      setLoading(false);
    }
  };

  const createBill = async () => {
    setLoading(true);
    try {
      const items: any[] = [];

      // ✅ Prescriptions – use dispensedQuantity if available, otherwise 1
      if (patient.prescriptions) {
        patient.prescriptions.forEach((rx: any) => {
          const qty = rx.dispensedQuantity || 1; // fallback to 1 if not dispensed
          items.push({
            type: "prescription",
            description: `${rx.medication} ${rx.dosage}`,
            amount: rx.price || 0,
            quantity: qty,
          });
        });
      }

      // ✅ Lab tests – only completed tests with price
      if (patient.tests) {
        patient.tests.forEach((test: any) => {
          if (test.status === "completed") {
            items.push({
              type: "lab_test",
              description: test.testType,
              amount: test.price || 0,
              quantity: 1,
            });
          }
        });
      }

      // Consultation fee (always add)
      items.push({
        type: "consultation",
        description: "Consultation fee",
        amount: 5000,
        quantity: 1,
      });

      // ✅ Inpatient bed fee (if applicable)
      if (patient.patientType === "inpatient") {
        // Calculate bed fee based on admission duration (example: ₦5000/day)
        const admissionDate = patient.admissionDate
          ? new Date(patient.admissionDate)
          : new Date(patient.registeredAt);
        const days = Math.max(
          1,
          Math.ceil(
            (Date.now() - admissionDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );
        items.push({
          type: "bed",
          description: `Bed fee (${days} days)`,
          amount: 5000,
          quantity: days,
        });
      }

      const res = await fetch(
        `/api/centers/${centerId}/patients/${patient.id}/bills`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({
            items,
            notes: "Auto-generated from patient records",
          }),
        },
      );
      const data = await res.json();
      if (data.success) setBill(data.data);
      else setError("Failed to create bill");
    } catch (err) {
      setError("Error creating bill");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/${patient.id}/bills?billId=${bill.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({
            status: "approved",
            notes: notes || "Approved by accountant",
            approvedBy: user.id,
            paymentAmount,
          }),
        },
      );
      if (!res.ok) throw new Error("Approval failed");
      setBill({ ...bill, status: "approved" });
      setStep("finalize");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      await fetch(
        `/api/centers/${centerId}/patients/${patient.id}/bills?billId=${bill.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-user-id": user.id },
          body: JSON.stringify({
            status: "discharged",
            notes: notes || "Discharged by admin",
            dischargedBy: user.id,
          }),
        },
      );
      await fetch(`/api/centers/${centerId}/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify({
          status: "discharged",
          dischargeDate: new Date().toISOString(),
          dischargeSummary: dischargeSummary || "Patient discharged",
        }),
      });
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 to-teal-50">
          <h3
            className={cn(
              "text-lg font-bold text-slate-900",
              poppins.className,
            )}
          >
            Discharge & Billing
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {bill && (
            <>
              {/* Bill Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Bill Total
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    ₦{bill.total.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Status: <span className="font-bold">{bill.status}</span>
                </div>
                {bill.items && (
                  <div className="mt-3 space-y-1">
                    {bill.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>
                          ₦
                          {(
                            item.amount * (item.quantity || 1)
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role-specific actions */}
              {(isDoctor || isAccountant) && bill.status === "pending" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Discharge Summary (optional)
                  </label>
                  <textarea
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Reason for discharge, follow-up instructions..."
                  />
                  {isAccountant && (
                    <>
                      <label className="block text-sm font-medium text-slate-700">
                        Payment Amount
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmount(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                      <label className="block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="Payment details, discrepancies..."
                      />
                      <button
                        onClick={handleApprove}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <DollarSign className="w-4 h-4" />
                        )}
                        Approve Payment
                      </button>
                    </>
                  )}
                </div>
              )}

              {isAdmin && bill.status === "approved" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Final Discharge Summary
                  </label>
                  <textarea
                    value={dischargeSummary}
                    onChange={(e) => setDischargeSummary(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Final summary, notes..."
                  />
                  <button
                    onClick={handleFinalize}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck className="w-4 h-4" />
                    )}
                    Finalize Discharge
                  </button>
                </div>
              )}

              {bill.status === "discharged" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800">
                  <p className="font-bold">Patient discharged</p>
                  <p className="text-sm mt-1">Bill status: Paid & discharged</p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
