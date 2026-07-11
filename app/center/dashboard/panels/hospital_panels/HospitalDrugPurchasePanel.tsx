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
  ChevronRight,
  Send,
  User,
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

// ─── Main Component ──────────────────────────────────────────────────

export default function HospitalDrugPurchasePanel() {
  const { center, user } = useDashboard();
  const { logAction } = useAuditLog();

  const normalizedRole = normalizeRole(user?.role);
  const canManage =
    normalizedRole === "pharmacist" || normalizedRole === "admin";

  // ─── Hooks ────────────────────────────────────────────────────────
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

  // ─── State ────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState<Partial<PurchaseOrder>>({});
  const [items, setItems] = useState<PurchaseOrder["items"]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Computed ────────────────────────────────────────────────────
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

  // ─── Handlers ────────────────────────────────────────────────────
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
    // Recalculate totalCost
    newItems[index].totalCost =
      newItems[index].quantity * newItems[index].costPerUnit;
    setItems(newItems);
    // Recalculate total amount
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return {
          label: "Draft",
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: AlertCircle,
        };
      case "pending":
        return {
          label: "Pending",
          bg: "bg-amber-100",
          text: "text-amber-800",
          border: "border-amber-200",
          icon: Clock,
        };
      case "approved":
        return {
          label: "Approved",
          bg: "bg-blue-100",
          text: "text-blue-800",
          border: "border-blue-200",
          icon: CheckCircle,
        };
      case "received":
        return {
          label: "Received",
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          border: "border-emerald-200",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-rose-100",
          text: "text-rose-800",
          border: "border-rose-200",
          icon: X,
        };
      default:
        return {
          label: status,
          bg: "bg-slate-100",
          text: "text-slate-700",
          border: "border-slate-200",
          icon: AlertCircle,
        };
    }
  };

  const formatCurrency = (amount: number) =>
    `₦${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ─── Render ──────────────────────────────────────────────────────
  if (loading) return <PurchaseSkeleton />;

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Drug Purchases
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {orders.length} orders
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Purchases
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-md">
              Manage drug purchase orders from suppliers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-slate-700" />
            </button>
            {canManage && (
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <Plus className="w-4 h-4" /> New Order
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={ShoppingBag}
            color="emerald"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            color="blue"
          />
          <StatCard
            label="Received"
            value={stats.received}
            icon={CheckCircle}
            color="emerald"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelled}
            icon={X}
            color="rose"
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by order #, supplier, requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 outline-none"
              aria-label="Search orders"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterButton
              label="All"
              value="all"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("all")}
            />
            <FilterButton
              label="Draft"
              value="draft"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("draft")}
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
            <FilterButton
              label="Received"
              value="received"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("received")}
            />
            <FilterButton
              label="Cancelled"
              value="cancelled"
              currentFilter={statusFilter}
              onClick={() => setStatusFilter("cancelled")}
            />
          </div>
        </div>

        {/* Order List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">
                No purchase orders found
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first purchase order."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const config = getStatusConfig(order.status);
                const Icon = config.icon;
                const canApprove = order.status === "pending" && canManage;
                const canReceive = order.status === "approved" && canManage;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border",
                            config.bg,
                            config.border,
                            config.text,
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">
                            {order.orderNumber}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5" />
                              {order.supplier}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {order.requestedBy}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(order.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {order.items.length} item(s) · Total:{" "}
                            {formatCurrency(order.totalAmount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-12 sm:ml-0">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border",
                            config.bg,
                            config.text,
                            config.border,
                          )}
                        >
                          {config.label}
                        </span>
                        {canApprove && (
                          <button
                            onClick={() => handleApprove(order.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Approve
                          </button>
                        )}
                        {canReceive && (
                          <button
                            onClick={() => handleReceive(order.id)}
                            className="px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                          >
                            Receive
                          </button>
                        )}
                        {canManage &&
                          order.status !== "received" &&
                          order.status !== "cancelled" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingOrder(order);
                                  setFormData({ ...order });
                                  setItems(order.items);
                                  setModalOpen(true);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 rounded focus:ring-2 focus:ring-emerald-500"
                                title="Edit"
                                aria-label={`Edit order ${order.orderNumber}`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(order.id, order.orderNumber)
                                }
                                className="p-1 text-rose-600 hover:text-rose-800 rounded focus:ring-2 focus:ring-emerald-500"
                                title="Delete"
                                aria-label={`Delete order ${order.orderNumber}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
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

// ─── Subcomponents ──────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          <p
            className={cn(
              "text-2xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            {value}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-xl", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function FilterButton({ label, value, currentFilter, onClick }: any) {
  const isActive = currentFilter === value;
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
        isActive
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
    </button>
  );
}

function PurchaseOrderModal({
  editing,
  formData,
  setFormData,
  items,
  setItems,
  onAddItem,
  onItemChange,
  onRemoveItem,
  onSave,
  onClose,
  isSubmitting,
  formatCurrency,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2
            className={cn(
              "text-xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            {editing ? "Edit Purchase Order" : "New Purchase Order"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier *
              </label>
              <input
                name="supplier"
                value={formData.supplier || ""}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
                aria-label="Supplier name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Requested By
              </label>
              <input
                name="requestedBy"
                value={formData.requestedBy || ""}
                onChange={(e) =>
                  setFormData({ ...formData, requestedBy: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Any additional notes..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">Items</h4>
              <button
                type="button"
                onClick={onAddItem}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                + Add Item
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-slate-500 mt-2">No items added yet.</p>
            ) : (
              <div className="space-y-2 mt-2">
                {items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
                          Drug Name
                        </label>
                        <input
                          value={item.drugName}
                          onChange={(e) =>
                            onItemChange(index, "drugName", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="e.g., Paracetamol"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
                          Strength
                        </label>
                        <input
                          value={item.strength || ""}
                          onChange={(e) =>
                            onItemChange(index, "strength", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="500mg"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
                          Form
                        </label>
                        <select
                          value={item.form}
                          onChange={(e) =>
                            onItemChange(index, "form", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
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
                        <label className="block text-[10px] font-medium text-slate-500">
                          Unit
                        </label>
                        <input
                          value={item.unit}
                          onChange={(e) =>
                            onItemChange(index, "unit", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="tablet"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
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
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
                          Cost/Unit (₦)
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
                          className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500">
                          Total
                        </label>
                        <p className="text-sm font-semibold text-slate-800 mt-1">
                          {formatCurrency(item.totalCost)}
                        </p>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="text-rose-600 hover:text-rose-800 text-sm focus:ring-2 focus:ring-emerald-500"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="text-right font-semibold text-slate-800">
                  Total: {formatCurrency(formData.totalAmount || 0)}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={
                isSubmitting || !formData.supplier || items.length === 0
              }
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {editing ? "Update" : "Create"} Order
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────

function PurchaseSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-5 w-64 bg-slate-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                  <div className="h-8 w-10 bg-slate-200 rounded mt-1" />
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-md h-11 bg-slate-200 rounded-xl animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                    <div className="h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
