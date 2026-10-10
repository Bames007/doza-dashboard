// app/center/dashboard/panels/HospitalDrugPurchasePanel.tsx

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  User,
  Package,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import {
  useDrugPurchase,
  PurchaseOrder,
} from "../../dashboards/hooks/useHospitalPharmacyDrugPurchase";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAuditLog } from "../../dashboards/hooks/useAuditLog";

// ─── Role Check ──────────────────────────────────────────────────────

const normalizeRole = (role: string | undefined): string => {
  if (!role) return "support";
  const r = role.toLowerCase().trim();
  if (r.includes("pharmacist") || r.includes("pharmacy")) return "pharmacist";
  if (r.includes("admin") || r.includes("owner") || r.includes("manager"))
    return "admin";
  return "support";
};

// ─── Status styling — emerald/slate/amber/rose ─────────────────────
const getStatusStyle = (status: string) => {
  const map: Record<string, { bg: string; icon: any; label: string }> = {
    draft: {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      icon: AlertCircle,
      label: "Draft",
    },
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
      label: "Pending",
    },
    approved: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Approved",
    },
    received: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Received",
    },
    cancelled: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: X,
      label: "Cancelled",
    },
  };
  return (
    map[status] || {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertCircle,
      label: status,
    }
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const style = getStatusStyle(status);
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        style.bg,
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {style.label}
    </span>
  );
};

// ─── Main Component ──────────────────────────────────────────────────

export default function HospitalDrugPurchasePanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const canManage =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  const {
    orders,
    loading,
    refetch,
    createOrder,
    updateOrder,
    deleteOrder,
    approveOrder,
    receiveOrder,
  } = useDrugPurchase(center?.id, user?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({});
  const [items, setItems] = useState<PurchaseOrder["items"]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(term) ||
          o.supplier.toLowerCase().includes(term) ||
          o.requestedBy.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    return filtered;
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const approved = orders.filter((o) => o.status === "approved").length;
    const received = orders.filter((o) => o.status === "received").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    return { total, pending, approved, received, cancelled };
  }, [orders]);

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormData({
      supplier: "",
      requestedBy: user?.fullName || "",
      status: "draft",
      totalAmount: 0,
      notes: "",
    });
    setItems([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingOrder(null);
    setFormData({});
    setItems([]);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        drugName: "",
        strength: "",
        form: "Tablet",
        quantity: 1,
        unit: "tablet",
        costPerUnit: 0,
        totalCost: 0,
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index].totalCost =
      newItems[index].quantity * newItems[index].costPerUnit;
    setItems(newItems);
    const total = newItems.reduce((sum, item) => sum + item.totalCost, 0);
    setFormData({ ...formData, totalAmount: total });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    const total = newItems.reduce((sum, item) => sum + item.totalCost, 0);
    setFormData({ ...formData, totalAmount: total });
  };

  const handleSave = async () => {
    if (!formData.supplier || items.length === 0) {
      alert("Please fill in supplier and at least one item.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        supplier: formData.supplier,
        requestedBy: formData.requestedBy || user?.fullName || "",
        items,
        totalAmount: formData.totalAmount || 0,
        notes: formData.notes,
        status: "pending" as const,
      };
      if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
        logAction(
          "update",
          "purchase-order",
          editingOrder.id,
          `Updated order from ${payload.supplier}`,
        );
      } else {
        await createOrder(payload);
        logAction(
          "create",
          "purchase-order",
          "new",
          `Created order from ${payload.supplier}`,
        );
      }
      closeModal();
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (!confirm(`Delete order ${orderNumber}?`)) return;
    try {
      await deleteOrder(id);
      logAction("delete", "purchase-order", id, `Deleted order ${orderNumber}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveOrder(id);
      logAction("update", "purchase-order", id, "Approved order");
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve order");
    }
  };

  const handleReceive = async (id: string) => {
    if (
      !confirm(
        "Confirm receiving this order? Stock will be added to inventory.",
      )
    )
      return;
    try {
      await receiveOrder(id);
      logAction("update", "purchase-order", id, "Received order");
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to receive order");
    }
  };

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) return <PurchaseSkeleton />;

  const statusTabs = [
    { value: "all", label: "All", count: stats.total },
    {
      value: "draft",
      label: "Draft",
      count: orders.filter((o) => o.status === "draft").length,
    },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "approved", label: "Approved", count: stats.approved },
    { value: "received", label: "Received", count: stats.received },
    { value: "cancelled", label: "Cancelled", count: stats.cancelled },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + count + refresh + add */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Drug Purchases
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {orders.length}
            </span>
            {stats.pending > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {stats.pending} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRefresh}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">New</span>
                <span className="hidden md:inline"> Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Purchases
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Manage drug purchase orders from suppliers
        </p>
      </header>

      {/* ─── Stat pills ─────────────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 flex md:grid md:grid-cols-5 gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0 mb-3 md:mb-5">
        <StatPill
          label="Total"
          value={stats.total}
          tone="slate"
          icon={ShoppingBag}
        />
        <StatPill
          label="Pending"
          value={stats.pending}
          tone="amber"
          icon={Clock}
        />
        <StatPill
          label="Approved"
          value={stats.approved}
          tone="emerald"
          icon={CheckCircle}
        />
        <StatPill
          label="Received"
          value={stats.received}
          tone="emerald"
          icon={CheckCircle}
        />
        <StatPill
          label="Cancelled"
          value={stats.cancelled}
          tone="rose"
          icon={X}
        />
      </div>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by order #, supplier, requester…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
          aria-label="Search orders"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── Status filter chips ────────────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "shrink-0 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 text-[9px] md:text-[10px] font-semibold tabular-nums",
                  isActive ? "text-emerald-100" : "text-slate-400",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Orders list ──────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 text-slate-300" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No purchase orders
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Create your first purchase order to get started."}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const style = getStatusStyle(order.status);
            const Icon = style.icon;
            const canApprove = order.status === "pending" && canManage;
            const canReceive = order.status === "approved" && canManage;
            const canEdit =
              canManage &&
              order.status !== "received" &&
              order.status !== "cancelled";

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 hover:border-emerald-200 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={cn("p-2 rounded-lg border shrink-0", style.bg)}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900 font-mono truncate">
                        {order.orderNumber}
                      </h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] md:text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 min-w-0">
                        <Package className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{order.supplier}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        <span className="truncate max-w-[100px]">
                          {order.requestedBy}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total line */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 mb-2.5">
                  <span className="text-[10px] md:text-[11px] text-slate-500 tabular-nums">
                    {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                  </span>
                  <span className="text-xs md:text-sm font-bold text-slate-900 tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>

                {/* Actions */}
                {(canApprove || canReceive || canEdit) && (
                  <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                    {canApprove && (
                      <button
                        onClick={() => handleApprove(order.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                    )}
                    {canReceive && (
                      <button
                        onClick={() => handleReceive(order.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors shadow-sm"
                      >
                        Receive
                      </button>
                    )}
                    {canEdit && (
                      <>
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setFormData({ ...order });
                            setItems(order.items);
                            setModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(order.id, order.orderNumber)
                          }
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors shrink-0"
                          aria-label="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Add/Edit Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <PurchaseOrderModal
            editing={editingOrder}
            formData={formData}
            setFormData={setFormData}
            items={items}
            setItems={setItems}
            onAddItem={handleAddItem}
            onItemChange={handleItemChange}
            onRemoveItem={handleRemoveItem}
            onSave={handleSave}
            onClose={closeModal}
            isSubmitting={isSubmitting}
            formatCurrency={formatCurrency}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat Pill ──────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate" | "amber" | "rose";
  icon: any;
}) {
  const toneStyles: Record<string, { bg: string; iconBg: string }> = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    slate: {
      bg: "bg-slate-50 border-slate-200 text-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
    },
    amber: {
      bg: "bg-amber-50 border-amber-200 text-amber-700",
      iconBg: "bg-amber-100 text-amber-700",
    },
    rose: {
      bg: "bg-rose-50 border-rose-200 text-rose-700",
      iconBg: "bg-rose-100 text-rose-700",
    },
  };
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        "shrink-0 w-32 sm:w-40 md:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
        style.bg,
      )}
    >
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-lg md:text-xl font-bold tabular-nums leading-none mt-0.5",
            bebasNeue.className,
          )}
        >
          {value}
        </p>
      </div>
      <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

// ─── Purchase Order Modal (bottom sheet on mobile) ───────────────────

function PurchaseOrderModal({
  editing,
  formData,
  setFormData,
  items,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onSave,
  onClose,
  isSubmitting,
  formatCurrency,
}: any) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h2
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {editing ? "Edit Purchase Order" : "New Purchase Order"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Supplier + Requested By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <input
                name="supplier"
                value={formData.supplier || ""}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                placeholder="e.g., Emzor Pharmaceuticals"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Requested By
              </label>
              <input
                name="requestedBy"
                value={formData.requestedBy || ""}
                onChange={(e) =>
                  setFormData({ ...formData, requestedBy: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition resize-none"
              placeholder="Any additional notes…"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Items{" "}
                <span className="text-slate-400 font-semibold">
                  ({items.length})
                </span>
              </h4>
              <button
                type="button"
                onClick={onAddItem}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Package className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-500">
                  No items added yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-xl p-2.5 border border-slate-200"
                  >
                    {/* Item header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        Item {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="p-1 -m-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Fields */}
                    <div className="space-y-2">
                      {/* Drug name — full width */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Drug Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          value={item.drugName}
                          onChange={(e) =>
                            onItemChange(index, "drugName", e.target.value)
                          }
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                          placeholder="e.g., Paracetamol"
                        />
                      </div>

                      {/* Strength + Form + Unit */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Strength
                          </label>
                          <input
                            value={item.strength || ""}
                            onChange={(e) =>
                              onItemChange(index, "strength", e.target.value)
                            }
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                            placeholder="500mg"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Form
                          </label>
                          <select
                            value={item.form}
                            onChange={(e) =>
                              onItemChange(index, "form", e.target.value)
                            }
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition truncate"
                          >
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Injection">Injection</option>
                            <option value="Cream">Cream</option>
                            <option value="Drops">Drops</option>
                            <option value="Inhaler">Inhaler</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Unit
                          </label>
                          <input
                            value={item.unit}
                            onChange={(e) =>
                              onItemChange(index, "unit", e.target.value)
                            }
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                            placeholder="tablet"
                          />
                        </div>
                      </div>

                      {/* Qty + Cost + Total */}
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              onItemChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            ₦/unit
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.costPerUnit}
                            onChange={(e) =>
                              onItemChange(
                                index,
                                "costPerUnit",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Total
                          </label>
                          <div className="px-2.5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs sm:text-sm font-bold text-slate-800 tabular-nums truncate">
                            {formatCurrency(item.totalCost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order total */}
            {items.length > 0 && (
              <div className="mt-3 flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                  Order Total
                </span>
                <span className="text-sm md:text-base font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(formData.totalAmount || 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSubmitting || !formData.supplier || items.length === 0}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editing ? "Update Order" : "Create Order"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function PurchaseSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-40 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-56 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2.5 mb-3 md:mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-32 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
          />
        ))}
      </div>
      <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
      <div className="flex gap-1.5 mb-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-28"
          />
        ))}
      </div>
    </div>
  );
}
