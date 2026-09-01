"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Package,
  Syringe,
  FlaskConical,
  RefreshCw,
  Search,
  Eye,
  BadgeCheck,
  Printer,
  X,
  Calendar,
  MessageSquare,
  UserCheck,
  Loader2,
  ArrowUp,
  Check,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useRequisitions } from "../../dashboards/hooks/useRequisitions";
import { getAvatarColor } from "@/app/utils/utils"; // Ensure this exists, or define locally

// ─── Types ──────────────────────────────────────────────────────────
interface ApprovalHistoryEntry {
  role: string;
  userId: string;
  userName?: string;
  action: "approve" | "reject" | "submitted" | "escalate" | "assigned";
  timestamp: string;
  comment?: string;
}

interface Requisition {
  id: string;
  requesterName: string;
  requesterId: string;
  type: string;
  priority: string;
  items: any[];
  clinicalNotes?: string;
  status: string;
  createdAt: string;
  approvalHistory?: ApprovalHistoryEntry[];
  approverRole: string;
  assignedToUserId?: string | null;
  assignedToName?: string | null;
  [key: string]: any;
}

// ─── RequisitionDetailModal (displays assignment & full history) ──
function RequisitionDetailModal({
  requisition,
  onClose,
}: {
  requisition: Requisition;
  onClose: () => void;
}) {
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "stat")
      return (
        <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full border border-rose-200">
          STAT
        </span>
      );
    if (priority === "urgent")
      return (
        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200">
          Urgent
        </span>
      );
    return null;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: "Pending", color: "bg-amber-100 text-amber-800" },
      approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800" },
      rejected: { label: "Rejected", color: "bg-rose-100 text-rose-800" },
      fulfilled: { label: "Fulfilled", color: "bg-blue-100 text-blue-800" },
      draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
    };
    const config = map[status] || {
      label: status,
      color: "bg-slate-100 text-slate-700",
    };
    return (
      <span
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium",
          config.color,
        )}
      >
        {config.label}
      </span>
    );
  };

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      submitted: "Submitted",
      approve: "Approved",
      reject: "Rejected",
      escalate: "Escalated",
      assigned: "Assigned",
    };
    return map[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex justify-between items-center rounded-t-2xl z-10 print:bg-white">
          <div>
            <h2
              className={cn(
                "text-xl font-bold text-slate-900",
                bebasNeue.className,
              )}
            >
              Requisition Details
            </h2>
            <p className="text-sm text-slate-500">
              Full approval chain and details
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
              aria-label="Print"
            >
              <Printer className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Requisition Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Requester</p>
              <p className="font-medium text-slate-900">
                {requisition.requesterName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <p className="font-medium text-slate-900 capitalize">
                {requisition.type.replace("-", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Priority</p>
              <div>{getPriorityBadge(requisition.priority)}</div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              {getStatusBadge(requisition.status)}
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm text-slate-700">
                {formatDate(requisition.createdAt)}
              </p>
            </div>
            {/* Assigned To */}
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Assigned To</p>
              <p className="font-medium text-slate-900">
                {requisition.assignedToName || "Not assigned"}
              </p>
            </div>
            {requisition.clinicalNotes && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Clinical Notes</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {requisition.clinicalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {requisition.items && requisition.items.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Items</p>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {requisition.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {item.strength} · {item.form} · {item.unit}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      ×{item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Chain */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Approval Chain
            </h3>
            <div className="relative pl-6 border-l-2 border-emerald-200 space-y-4">
              {requisition.approvalHistory &&
              requisition.approvalHistory.length > 0 ? (
                requisition.approvalHistory.map((entry, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white" />
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-900">
                            {getActionLabel(entry.action)}
                          </p>
                          <p className="text-sm text-slate-600">
                            by{" "}
                            <span className="font-medium">
                              {entry.userName || entry.userId}
                            </span>{" "}
                            ({entry.role})
                          </p>
                          {entry.comment && (
                            <p className="text-sm text-slate-700 mt-1 flex items-start gap-1">
                              <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span>"{entry.comment}"</span>
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No approval history yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer (print only) */}
        <div className="hidden print:block text-xs text-slate-400 text-center py-4 border-t border-slate-200">
          Printed from Doza Center Dashboard
        </div>
      </motion.div>
    </div>
  );
}

// ─── Action Modal (reusable, accepts children) ─────────────────────
function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmColor = "emerald",
  showComment = false,
  comment,
  setComment,
  loading,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "emerald" | "rose" | "blue";
  showComment?: boolean;
  comment?: string;
  setComment?: (val: string) => void;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  if (!isOpen) return null;

  const colorClasses = {
    emerald: "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500",
    rose: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
    blue: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 p-6"
      >
        <h3
          className={cn(
            "text-xl font-bold text-slate-900",
            bebasNeue.className,
          )}
        >
          {title}
        </h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>

        {children}

        {showComment && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={comment || ""}
              onChange={(e) => setComment && setComment(e.target.value)}
              rows={3}
              placeholder="Provide additional details..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2",
              colorClasses[confirmColor],
              loading && "opacity-70 cursor-not-allowed",
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function HospitalApprovalPanel() {
  const { center, user } = useDashboard();
  const { requisitions, loading, error, refetch, approve, reject, escalate } =
    useRequisitions(center?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequisition, setSelectedRequisition] =
    useState<Requisition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [escalateComment, setEscalateComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Escalation staff selection
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [escalateSearch, setEscalateSearch] = useState("");
  const [escalateTargetUserId, setEscalateTargetUserId] = useState<
    string | null
  >(null);
  const [isEscalateDropdownOpen, setIsEscalateDropdownOpen] = useState(false);

  // Fetch staff when escalate modal opens
  useEffect(() => {
    if (showEscalateModal && center?.id) {
      const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
          const res = await fetch(`/api/centers/${center.id}/staff`, {
            headers: { "x-user-id": user.id },
          });
          const result = await res.json();
          if (result.success) setStaffList(result.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingStaff(false);
        }
      };
      fetchStaff();
    }
  }, [showEscalateModal, center, user.id]);

  const filteredEscalateStaff = staffList.filter((s) =>
    s.personalInfo.fullName
      .toLowerCase()
      .includes(escalateSearch.toLowerCase()),
  );

  const selectedEscalateStaff = staffList.find(
    (s) => s.id === escalateTargetUserId,
  );

  // Visibility based on role
  const visibleRequisitions = useMemo(() => {
    const role = String(user?.role || "");
    const isAdmin = role === "admin" || role === "center_owner";
    const isApprover = [
      "admin",
      "owner",
      "head-nurse",
      "lab-manager",
      "cmo",
    ].includes(role);

    if (isAdmin) return requisitions;
    if (isApprover) {
      return requisitions.filter(
        (r) =>
          r.requesterId === user?.id ||
          r.status === "pending" ||
          r.assignedToUserId === user?.id,
      );
    }
    return requisitions.filter((r) => r.requesterId === user?.id);
  }, [requisitions, user]);

  // Filtered list
  const filtered = useMemo(() => {
    let items = visibleRequisitions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (r) =>
          r.requesterName?.toLowerCase().includes(term) ||
          r.items?.some((i: any) => i.name.toLowerCase().includes(term)),
      );
    }
    if (filterPriority === "urgent") {
      items = items.filter(
        (r) => r.priority === "urgent" || r.priority === "stat",
      );
    }
    if (filterStatus !== "all") {
      items = items.filter((r) => r.status === filterStatus);
    }
    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [visibleRequisitions, searchTerm, filterPriority, filterStatus]);

  // Stats
  const stats = useMemo(
    () => ({
      total: visibleRequisitions.length,
      pending: visibleRequisitions.filter((r) => r.status === "pending").length,
      approved: visibleRequisitions.filter((r) => r.status === "approved")
        .length,
      rejected: visibleRequisitions.filter((r) => r.status === "rejected")
        .length,
      fulfilled: visibleRequisitions.filter((r) => r.status === "fulfilled")
        .length,
    }),
    [visibleRequisitions],
  );

  const getPriorityBadge = (priority: string) => {
    if (priority === "stat")
      return (
        <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full border border-rose-200">
          STAT
        </span>
      );
    if (priority === "urgent")
      return (
        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200">
          Urgent
        </span>
      );
    return null;
  };

  const getTypeIcon = (type: string) => {
    const map: Record<string, any> = {
      "pharmacy-restock": Package,
      clinical: User,
      lab: FlaskConical,
      "ward-supply": Syringe,
    };
    return map[type] || Package;
  };

  // ── Action handlers ──
  const handleApproveClick = (id: string) => {
    setSelectedId(id);
    setShowApproveModal(true);
  };

  const handleRejectClick = (id: string) => {
    setSelectedId(id);
    setRejectComment("");
    setShowRejectModal(true);
  };

  const handleEscalateClick = (id: string) => {
    setSelectedId(id);
    setEscalateSearch("");
    setEscalateTargetUserId(null);
    setEscalateComment("");
    setShowEscalateModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await approve(selectedId);
      await refetch();
      setShowApproveModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to approve.");
    } finally {
      setActionLoading(false);
      setSelectedId(null);
    }
  };

  const confirmReject = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      await reject(selectedId, rejectComment.trim() || "No reason provided");
      await refetch();
      setShowRejectModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to reject.");
    } finally {
      setActionLoading(false);
      setSelectedId(null);
    }
  };

  const confirmEscalate = async () => {
    if (!selectedId || !escalateTargetUserId) {
      alert("Please select a staff member to escalate to.");
      return;
    }
    setActionLoading(true);
    try {
      await escalate(
        selectedId,
        escalateTargetUserId,
        escalateComment.trim() || undefined,
      );
      await refetch();
      setShowEscalateModal(false);
    } catch (err) {
      console.error(err);
      alert("Escalation failed.");
    } finally {
      setActionLoading(false);
      setSelectedId(null);
      setEscalateTargetUserId(null);
    }
  };

  const handleViewDetails = (req: Requisition) => {
    setSelectedRequisition(req);
    setShowDetailModal(true);
  };

  if (loading) return <ApprovalSkeleton />;
  if (error) {
    return (
      <div className="p-8 text-center text-rose-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p className="font-semibold">Failed to load approvals</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Retry
        </button>
      </div>
    );
  }

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
                Approvals
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {stats.total} total
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Approvals & History
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-md">
              Review pending requests and view past approvals.
            </p>
          </div>
          <button
            onClick={refetch}
            className="p-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-5 h-5 text-slate-700" />
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total"
            value={stats.total}
            icon={BadgeCheck}
            color="slate"
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
            color="emerald"
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={XCircle}
            color="rose"
          />
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterPriority("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                filterPriority === "all"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
              )}
            >
              All Priority
            </button>
            <button
              onClick={() => setFilterPriority("urgent")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                filterPriority === "urgent"
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
              )}
            >
              Urgent/STAT
            </button>
            <div className="w-px h-8 bg-slate-300 mx-1 hidden sm:block" />
            {["all", "pending", "approved", "rejected", "fulfilled"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                    filterStatus === status
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ),
            )}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
              <p className="font-semibold text-slate-700">No requests found</p>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm ||
                filterStatus !== "all" ||
                filterPriority !== "all"
                  ? "Try adjusting your filters"
                  : "No pending approvals for your role."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((req) => {
                const TypeIcon = getTypeIcon(req.type);
                const isPending = req.status === "pending";
                const showActions =
                  isPending &&
                  (req.approverRole === String(user?.role) ||
                    req.assignedToUserId === user?.id ||
                    ["admin", "center_owner"].includes(String(user?.role)));

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-2.5 rounded-xl border",
                            isPending
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200",
                          )}
                        >
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">
                              {req.requesterName}
                            </h3>
                            <span className="text-xs text-slate-500">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                            {getPriorityBadge(req.priority)}
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                req.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : req.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : req.status === "rejected"
                                      ? "bg-rose-100 text-rose-800"
                                      : req.status === "fulfilled"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-slate-100 text-slate-700",
                              )}
                            >
                              {req.status.charAt(0).toUpperCase() +
                                req.status.slice(1)}
                            </span>
                            {req.assignedToUserId && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {req.assignedToName || "Assigned"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {req.items.length} item(s) ·{" "}
                            {req.type.replace("-", " ")}
                            {req.assignedToName && (
                              <span className="ml-2 text-xs text-slate-500">
                                → Assigned to {req.assignedToName}
                              </span>
                            )}
                          </p>
                          {req.clinicalNotes && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                              {req.clinicalNotes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-12 md:ml-0">
                        {showActions ? (
                          <>
                            <button
                              onClick={() => handleApproveClick(req.id)}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              <CheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(req.id)}
                              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1 shadow-sm focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button
                              onClick={() => handleEscalateClick(req.id)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex items-center gap-1 shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <ArrowUp className="w-4 h-4" /> Escalate
                            </button>
                          </>
                        ) : null}
                        <button
                          onClick={() => handleViewDetails(req)}
                          className="p-1 text-slate-500 hover:text-slate-700 rounded focus:ring-2 focus:ring-emerald-500"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <ActionModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedId(null);
        }}
        onConfirm={confirmApprove}
        title="Approve Requisition"
        description="Are you sure you want to approve this requisition? This action cannot be undone."
        confirmLabel="Approve"
        confirmColor="emerald"
        loading={actionLoading}
      />

      <ActionModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedId(null);
          setRejectComment("");
        }}
        onConfirm={confirmReject}
        title="Reject Requisition"
        description="Provide a reason for rejection (optional)."
        confirmLabel="Reject"
        confirmColor="rose"
        showComment={true}
        comment={rejectComment}
        setComment={setRejectComment}
        loading={actionLoading}
      />

      {/* Escalation Modal with Staff Selection */}
      <ActionModal
        isOpen={showEscalateModal}
        onClose={() => {
          setShowEscalateModal(false);
          setSelectedId(null);
          setEscalateTargetUserId(null);
          setEscalateSearch("");
          setEscalateComment("");
        }}
        onConfirm={confirmEscalate}
        title="Escalate Requisition"
        description="Select the staff member to escalate this request to."
        confirmLabel="Escalate"
        confirmColor="blue"
        showComment={true}
        comment={escalateComment}
        setComment={setEscalateComment}
        loading={actionLoading}
      >
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Select Staff *
          </label>
          <div className="relative">
            <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
              <User className="w-4 h-4 text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Search staff..."
                value={escalateSearch}
                onChange={(e) => {
                  setEscalateSearch(e.target.value);
                  setIsEscalateDropdownOpen(true);
                }}
                onFocus={() => setIsEscalateDropdownOpen(true)}
                className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
              {escalateTargetUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setEscalateTargetUserId(null);
                    setEscalateSearch("");
                  }}
                  className="pr-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEscalateDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {loadingStaff ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                    Loading staff...
                  </div>
                ) : filteredEscalateStaff.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    No staff members found
                  </div>
                ) : (
                  filteredEscalateStaff.map((staff) => {
                    const color = getAvatarColor(staff.personalInfo.fullName);
                    const initials = staff.personalInfo.fullName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => {
                          setEscalateTargetUserId(staff.id);
                          setEscalateSearch(
                            staff.personalInfo.fullName +
                              " (" +
                              staff.professional.role +
                              ")",
                          );
                          setIsEscalateDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                            color,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-800">
                            {staff.personalInfo.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {staff.professional.role}
                          </div>
                        </div>
                        {escalateTargetUserId === staff.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {selectedEscalateStaff && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                  getAvatarColor(selectedEscalateStaff.personalInfo.fullName),
                )}
              >
                {selectedEscalateStaff.personalInfo.fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span>
                Escalating to{" "}
                <strong>{selectedEscalateStaff.personalInfo.fullName}</strong> (
                {selectedEscalateStaff.professional.role})
              </span>
            </div>
          )}
        </div>
      </ActionModal>

      {/* Detail Modal */}
      {showDetailModal && selectedRequisition && (
        <RequisitionDetailModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
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

function ApprovalSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-56 bg-slate-200 rounded" />
            <div className="h-5 w-64 bg-slate-100 rounded mt-2" />
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80"
            >
              <div className="flex justify-between">
                <div>
                  <div className="h-3 w-12 bg-slate-200 rounded" />
                  <div className="h-7 w-10 bg-slate-200 rounded mt-1" />
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-11 bg-slate-200 rounded-xl" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-16 h-8 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                  <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                  <div className="w-20 h-8 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
