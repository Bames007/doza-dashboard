// app/center/dashboard/panels/BillingPanel.tsx

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Download,
  Eye,
  Calendar,
  User,
  RefreshCw,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Printer,
  Search,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

// ─── Types ────────────────────────────────────────────────────────────

interface Bill {
  id: string;
  patientId: string;
  patientName: string;
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
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  updatedAt?: number;
}

// ─── Subcomponents ───────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<
    string,
    { label: string; bg: string; text: string; icon: any }
  > = {
    paid: {
      label: "Paid",
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      icon: CheckCircle,
    },
    hmo: {
      label: "HMO",
      bg: "bg-blue-100",
      text: "text-blue-800",
      icon: CheckCircle,
    },
    pending: {
      label: "Pending",
      bg: "bg-amber-100",
      text: "text-amber-800",
      icon: Clock,
    },
    approved: {
      label: "Approved",
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      icon: Clock,
    },
    discharged: {
      label: "Discharged",
      bg: "bg-slate-100",
      text: "text-slate-700",
      icon: CheckCircle,
    },
  };
  const config = configs[status] || configs.pending;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.bg,
        config.text,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────

export default function BillingPanel() {
  const { center, user } = useDashboard();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchBills = async () => {
    if (!center?.id || !user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/centers/${center.id}/bills`, {
        headers: { "x-user-id": user.id },
      });
      const result = await res.json();
      if (result.success) {
        setBills(result.data || []);
      } else {
        console.error("Failed to fetch bills:", result.error);
      }
    } catch (err) {
      console.error("Error fetching bills:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [center?.id, user?.id]);

  const filteredBills = bills
    .filter((bill) => {
      if (statusFilter !== "all") return bill.status === statusFilter;
      return true;
    })
    .filter((bill) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        bill.patientName.toLowerCase().includes(term) ||
        bill.id.toLowerCase().includes(term)
      );
    });

  const stats = {
    total: bills.length,
    paid: bills.filter((b) => b.status === "paid" || b.status === "hmo").length,
    pending: bills.filter(
      (b) => b.status === "pending" || b.status === "approved",
    ).length,
    overdue: bills.filter((b) => b.status === "discharged").length,
    totalRevenue: bills
      .filter((b) => b.status === "paid" || b.status === "hmo")
      .reduce((sum, b) => sum + b.total, 0),
  };

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  const handleViewDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* ─── Header ────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-600 to-teal-700" />
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-[0.25em]">
              Billing Management
            </span>
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {bills.length} invoices
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
              bebasNeue.className,
            )}
          >
            Billing
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Manage patient invoices, payments, and financial records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBills}
            className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition flex items-center justify-center focus:ring-2 focus:ring-emerald-500"
          >
            <RefreshCw className="w-5 h-5 text-slate-700" />
          </button>
          <button className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition shadow-sm flex items-center gap-2">
            <Printer className="w-4 h-4" /> Export All
          </button>
        </div>
      </header>

      {/* ─── Stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoices"
          value={stats.total}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          label="Paid / HMO"
          value={stats.paid}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          label="Pending / Approved"
          value={stats.pending}
          icon={Clock}
          color="amber"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="emerald"
        />
      </div>

      {/* ─── Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by patient or invoice ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterButton
            label="All"
            value="all"
            currentFilter={statusFilter}
            onClick={() => setStatusFilter("all")}
          />
          <FilterButton
            label="Paid"
            value="paid"
            currentFilter={statusFilter}
            onClick={() => setStatusFilter("paid")}
          />
          <FilterButton
            label="HMO"
            value="hmo"
            currentFilter={statusFilter}
            onClick={() => setStatusFilter("hmo")}
          />
          <FilterButton
            label="Pending"
            value="pending"
            currentFilter={statusFilter}
            onClick={() => setStatusFilter("pending")}
          />
          <FilterButton
            label="Approved"
            value="approved"
            currentFilter={statusFilter}
            onClick={() => setStatusFilter("approved")}
          />
        </div>
      </div>

      {/* ─── Bills List ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-700">No invoices found</p>
            <p className="text-sm mt-1">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Invoices will appear here once generated."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Invoice</th>
                  <th className="px-4 py-3 text-left font-medium">Patient</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => (
                  <motion.tr
                    key={bill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      #{bill.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {bill.patientName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(bill.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {formatCurrency(bill.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewDetails(bill)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 rounded focus:ring-2 focus:ring-emerald-500"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Bill Detail Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showDetailModal && selectedBill && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">
                  Invoice Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Invoice #
                    </p>
                    <p className="font-medium text-slate-900">
                      #{selectedBill.id.slice(-8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Patient
                    </p>
                    <p className="font-medium text-slate-900">
                      {selectedBill.patientName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Date
                    </p>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedBill.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Status
                    </p>
                    <StatusBadge status={selectedBill.status} />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Items
                  </p>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    {selectedBill.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">
                          {item.description}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(item.amount * (item.quantity || 1))}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-emerald-600">
                        {formatCurrency(selectedBill.total)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedBill.notes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                      {selectedBill.notes}
                    </p>
                  </div>
                )}

                {selectedBill.paymentMethod &&
                  selectedBill.paymentMethod !== "pending" && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Payment Method
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {selectedBill.paymentMethod.toUpperCase()}
                      </p>
                    </div>
                  )}
              </div>
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition"
                >
                  <Printer className="w-4 h-4 inline mr-2" />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Filter Button Component ──────────────────────────────────────

function FilterButton({ label, value, currentFilter, onClick }: any) {
  const isActive = currentFilter === value;
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border focus:ring-2 focus:ring-emerald-500",
        isActive
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}
