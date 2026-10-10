// app/center/dashboard/panels/HospitalRequisitionPanel.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Package,
  Syringe,
  FlaskConical,
  RefreshCw,
  Eye,
  Printer,
  X,
  Calendar,
  MessageSquare,
  UserCheck,
  Inbox,
  Send,
  Loader2,
  ArrowUp,
  Check,
} from "lucide-react";
import { useDashboard } from "../../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useRequisitions } from "../../dashboards/hooks/useRequisitions";
import { RequisitionModal } from "./RequisitionModal";
import { getAvatarColor } from "@/app/utils/utils";

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

// ─── Shared status styling ─────────────────────────────────────────

const getStatusStyle = (status: string) => {
  const map: Record<string, { bg: string; icon: any; label: string }> = {
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
    fulfilled: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      label: "Fulfilled",
    },
    rejected: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      label: "Rejected",
    },
    draft: {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertTriangle,
      label: "Draft",
    },
  };
  return (
    map[status] || {
      bg: "bg-slate-100 text-slate-600 border-slate-200",
      icon: AlertTriangle,
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

const PriorityBadge = ({ priority }: { priority: string }) => {
  if (priority !== "urgent" && priority !== "stat") return null;
  const isStat = priority === "stat";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        isStat
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : "bg-amber-50 text-amber-700 border-amber-200",
      )}
    >
      <AlertTriangle className="w-2.5 h-2.5" />
      {isStat ? "STAT" : "Urgent"}
    </span>
  );
};

const getTypeIcon = (type: string) => {
  const map: Record<string, any> = {
    "pharmacy-restock": Package,
    clinical: User,
    lab: FlaskConical,
    "ward-supply": Syringe,
  };
  return map[type] || ClipboardList;
};

// ─── Action Modal (bottom sheet on mobile) ──────────────────────────

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
  confirmColor?: "emerald" | "rose" | "slate";
  showComment?: boolean;
  comment?: string;
  setComment?: (val: string) => void;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  if (!isOpen) return null;

  const colorClasses = {
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    rose: "bg-rose-600 hover:bg-rose-700",
    slate: "bg-slate-800 hover:bg-slate-900",
  };

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
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar for mobile */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900 truncate",
              bebasNeue.className,
            )}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <p className="text-[11px] sm:text-xs text-slate-500">{description}</p>

          {children}

          {showComment && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Reason (optional)
              </label>
              <textarea
                value={comment || ""}
                onChange={(e) => setComment && setComment(e.target.value)}
                rows={3}
                placeholder="Provide additional details…"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none transition"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "w-full sm:flex-1 py-2.5 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50",
              colorClasses[confirmColor],
            )}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Detail Modal (bottom sheet on mobile) ──────────────────────────

function RequisitionDetailModal({
  requisition,
  onClose,
}: {
  requisition: Requisition;
  onClose: () => void;
}) {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

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

  const handlePrint = () => window.print();

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 print:bg-white print:backdrop-blur-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl print:shadow-none print:border-none print:rounded-none print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center print:hidden">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 print:bg-white">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                Details
              </span>
            </div>
            <h2
              className={cn(
                "text-base sm:text-lg font-bold text-slate-900 truncate",
                bebasNeue.className,
              )}
            >
              Requisition #
              {requisition.id
                ? requisition.id.slice(-6).toUpperCase()
                : "Details"}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Print"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Requester
              </p>
              <p className="text-xs font-bold text-slate-900 truncate">
                {requisition.requesterName}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Type
              </p>
              <p className="text-xs font-bold text-slate-900 capitalize truncate">
                {requisition.type.replace("-", " ")}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Priority
              </p>
              {requisition.priority === "urgent" ||
              requisition.priority === "stat" ? (
                <PriorityBadge priority={requisition.priority} />
              ) : (
                <span className="text-xs font-bold text-slate-700">Normal</span>
              )}
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Status
              </p>
              <StatusBadge status={requisition.status} />
            </div>
            <div className="col-span-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Created
              </p>
              <p className="text-xs text-slate-700 tabular-nums">
                {formatDate(requisition.createdAt)}
              </p>
            </div>
            <div className="col-span-2 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                Assigned To
              </p>
              <p className="text-xs font-bold text-slate-900 truncate">
                {requisition.assignedToName || "Not assigned"}
              </p>
            </div>
            {requisition.clinicalNotes && (
              <div className="col-span-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Clinical Notes
                </p>
                <p className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  {requisition.clinicalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {requisition.items && requisition.items.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  Items
                </p>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full tabular-nums">
                  {requisition.items.length}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200">
                {requisition.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex justify-between items-start gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">
                        {item.strength} · {item.form} · {item.unit}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-800 tabular-nums shrink-0">
                      ×{item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Chain */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" />
                Approval Chain
              </h3>
              {requisition.approvalHistory && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full tabular-nums">
                  {requisition.approvalHistory.length}
                </span>
              )}
            </div>
            <div className="relative pl-5 border-l-2 border-emerald-200 space-y-2.5">
              {requisition.approvalHistory &&
              requisition.approvalHistory.length > 0 ? (
                requisition.approvalHistory.map((entry, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-500 bg-white" />
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {getActionLabel(entry.action)}
                          </p>
                          <span className="text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full shrink-0">
                            {entry.role}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 flex items-center gap-1 tabular-nums shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        by{" "}
                        <span className="font-semibold text-slate-800">
                          {entry.userName || entry.userId}
                        </span>
                      </p>
                      {entry.comment && (
                        <p className="text-[10px] text-slate-700 mt-1.5 flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg">
                          <MessageSquare className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="italic">"{entry.comment}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  No approval history yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block text-[10px] text-slate-400 text-center py-3 border-t border-slate-200">
          Printed from Doza Center Dashboard
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function HospitalRequisitionPanel() {
  const { center, user } = useDashboard();
  const {
    requisitions,
    loading,
    error,
    refetch,
    createRequisition,
    deleteRequisition,
    approve,
    reject,
    escalate,
  } = useRequisitions(center?.id);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "my" | "assigned">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] =
    useState<Requisition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [escalateComment, setEscalateComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [escalateSearch, setEscalateSearch] = useState("");
  const [escalateTargetUserId, setEscalateTargetUserId] = useState<
    string | null
  >(null);
  const [isEscalateDropdownOpen, setIsEscalateDropdownOpen] = useState(false);

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

  // ── Stats ──
  const stats = useMemo(() => {
    const total = requisitions.length;
    const pending = requisitions.filter((r) => r.status === "pending").length;
    const approved = requisitions.filter((r) => r.status === "approved").length;
    const fulfilled = requisitions.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const rejected = requisitions.filter((r) => r.status === "rejected").length;
    return { total, pending, approved, fulfilled, rejected };
  }, [requisitions]);

  const myCount = useMemo(
    () => requisitions.filter((r) => r.requesterId === user?.id).length,
    [requisitions, user?.id],
  );
  const assignedCount = useMemo(
    () => requisitions.filter((r) => r.assignedToUserId === user?.id).length,
    [requisitions, user?.id],
  );

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let items = requisitions;

    if (viewMode === "my") {
      items = items.filter((r) => r.requesterId === user?.id);
    } else if (viewMode === "assigned") {
      items = items.filter((r) => r.assignedToUserId === user?.id);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (r) =>
          r.requesterName?.toLowerCase().includes(term) ||
          r.items?.some((i: any) => i.name.toLowerCase().includes(term)) ||
          r.assignedToName?.toLowerCase().includes(term),
      );
    }

    if (statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter);
    }

    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [requisitions, viewMode, searchTerm, statusFilter, user?.id]);

  // ── Handlers ──
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this requisition?")) return;
    await deleteRequisition(id);
    refetch();
  };

  const handleViewDetails = (req: Requisition) => {
    setSelectedRequisition(req);
    setShowDetailModal(true);
  };

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

  if (loading) return <RequisitionSkeleton />;

  if (error) {
    return (
      <div className="pb-24 pt-6 px-4 text-center">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <p className="font-bold text-rose-700 text-sm">
          Failed to load requisitions
        </p>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const viewTabs = [
    {
      value: "all" as const,
      label: "All",
      count: stats.total,
      icon: ClipboardList,
    },
    { value: "my" as const, label: "Mine", count: myCount, icon: Send },
    {
      value: "assigned" as const,
      label: "Assigned",
      count: assignedCount,
      icon: Inbox,
    },
  ];

  const statusTabs = [
    { value: "all", label: "All", count: stats.total },
    { value: "pending", label: "Pending", count: stats.pending },
    { value: "approved", label: "Approved", count: stats.approved },
    { value: "fulfilled", label: "Fulfilled", count: stats.fulfilled },
    { value: "rejected", label: "Rejected", count: stats.rejected },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto selection:bg-emerald-500 selection:text-white",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + count + actions */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Requisitions
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {stats.total}
            </span>
            {stats.pending > 0 && (
              <span className="text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {stats.pending} pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={refetch}
              className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          {viewMode === "my"
            ? "My Requests"
            : viewMode === "assigned"
              ? "Assigned to Me"
              : "All Requests"}
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          {viewMode === "my"
            ? "Track the progress of requisitions you created"
            : viewMode === "assigned"
              ? "Review and act on requisitions assigned to you"
              : "Overview of all requisitions"}
        </p>

        {/* Row 3: stat pills — horizontal scroll */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex md:grid md:grid-cols-5 gap-2 md:gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 md:pb-0">
          <StatPill
            label="Total"
            value={stats.total}
            tone="slate"
            icon={ClipboardList}
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
            label="Fulfilled"
            value={stats.fulfilled}
            tone="emerald"
            icon={CheckCircle}
          />
          <StatPill
            label="Rejected"
            value={stats.rejected}
            tone="rose"
            icon={XCircle}
          />
        </div>
      </header>

      {/* ─── Search ─────────────────────────────────────────── */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by item, requester, or assignee…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none shadow-sm transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      {/* ─── View tabs + Status chips ─────────────────────────── */}
      <div className="mb-3 space-y-2">
        {/* View tabs */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {viewTabs.map((tab) => {
            const isActive = viewMode === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setViewMode(tab.value)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
                )}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                <span
                  className={cn(
                    "text-[9px] md:text-[10px] font-semibold tabular-nums",
                    isActive ? "text-emerald-100" : "text-slate-400",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status chips */}
        <div className="-mx-3 px-3 md:mx-0 md:px-0 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "shrink-0 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wide transition-all whitespace-nowrap border",
                  isActive
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1 text-[9px] font-semibold tabular-nums",
                    isActive ? "text-slate-300" : "text-slate-400",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── List ────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 md:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-emerald-500" />
          </div>
          <h3
            className={cn(
              "text-base md:text-lg font-bold text-slate-800 mb-1",
              bebasNeue.className,
            )}
          >
            No requisitions found
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters."
              : viewMode === "my"
                ? "You haven't created any requests yet."
                : viewMode === "assigned"
                  ? "No requests assigned to you."
                  : "No requests available at the moment."}
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
          {filtered.map((req) => {
            const statusStyle = getStatusStyle(req.status);
            const TypeIcon = getTypeIcon(req.type);
            const isPending = req.status === "pending";
            const isEditable = isPending && req.requesterId === user?.id;
            const isAssignedToMe = req.assignedToUserId === user?.id;
            const showActions =
              isPending &&
              (req.assignedToUserId === user?.id ||
                req.approverRole === String(user?.role) ||
                ["admin", "center_owner"].includes(String(user?.role)));

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 hover:border-emerald-200 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg border shrink-0",
                      statusStyle.bg,
                    )}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900 truncate">
                        {req.requesterName}
                      </h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <PriorityBadge priority={req.priority} />
                      {req.assignedToUserId && (
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-full truncate max-w-[160px]">
                          {isAssignedToMe
                            ? "Assigned to You"
                            : `→ ${req.assignedToName || "Assigned"}`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] md:text-[11px] text-slate-500">
                      <span className="tabular-nums">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="tabular-nums">
                        {req.items.length} item
                        {req.items.length === 1 ? "" : "s"}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="capitalize truncate">
                        {req.type.replace("-", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes preview */}
                {req.clinicalNotes && (
                  <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed line-clamp-1 mb-2 pl-10">
                    {req.clinicalNotes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                  {showActions ? (
                    <>
                      <button
                        onClick={() => handleApproveClick(req.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectClick(req.id)}
                        className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleEscalateClick(req.id)}
                        className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1"
                        aria-label="Escalate"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleViewDetails(req)}
                      className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold uppercase tracking-wide rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3 h-3" />
                      View details
                    </button>
                  )}

                  {/* View button always present when actions shown */}
                  {showActions && (
                    <button
                      onClick={() => handleViewDetails(req)}
                      className="px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors shrink-0"
                      aria-label="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete for owner's own pending */}
                  {isEditable && (
                    <button
                      onClick={() => handleDelete(req.id)}
                      className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg transition-colors shrink-0"
                      aria-label="Delete"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── Modals ─────────────────────────────────────────── */}
      <RequisitionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data: any) => {
          await createRequisition(data);
          setModalOpen(false);
          refetch();
        }}
      />

      <AnimatePresence>
        {showDetailModal && selectedRequisition && (
          <RequisitionDetailModal
            requisition={selectedRequisition}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedRequisition(null);
            }}
          />
        )}
      </AnimatePresence>

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
        confirmColor="slate"
        showComment={true}
        comment={escalateComment}
        setComment={setEscalateComment}
        loading={actionLoading}
      >
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
            Select Staff <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition">
              <User className="w-3.5 h-3.5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search staff…"
                value={escalateSearch}
                onChange={(e) => {
                  setEscalateSearch(e.target.value);
                  setIsEscalateDropdownOpen(true);
                }}
                onFocus={() => setIsEscalateDropdownOpen(true)}
                className="flex-1 px-3 py-2.5 bg-transparent outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
              />
              {escalateTargetUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setEscalateTargetUserId(null);
                    setEscalateSearch("");
                  }}
                  className="pr-3 text-slate-400 hover:text-slate-600 shrink-0"
                  aria-label="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {isEscalateDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {loadingStaff ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    Loading…
                  </div>
                ) : filteredEscalateStaff.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No staff found
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
                            `${staff.personalInfo.fullName} (${staff.professional.role})`,
                          );
                          setIsEscalateDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2.5 border-b border-slate-100 last:border-0"
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                            color,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">
                            {staff.personalInfo.fullName}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate">
                            {staff.professional.role}
                          </div>
                        </div>
                        {escalateTargetUserId === staff.id && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {selectedEscalateStaff && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0",
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
              <span className="truncate">
                Escalating to{" "}
                <strong className="font-bold">
                  {selectedEscalateStaff.personalInfo.fullName}
                </strong>
              </span>
            </div>
          )}
        </div>
      </ActionModal>
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
        "shrink-0 w-36 sm:w-44 md:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
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

// ─── Skeleton ───────────────────────────────────────────────────────

function RequisitionSkeleton() {
  return (
    <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
      <div className="mb-3 md:mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded-full" />
        </div>
        <div className="h-7 w-48 bg-slate-200 rounded mb-1" />
        <div className="h-3 w-56 bg-slate-100 rounded" />
      </div>
      <div className="flex gap-2.5 mb-3 md:mb-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-36 bg-white rounded-xl border border-slate-200 shrink-0 md:flex-1"
          />
        ))}
      </div>
      <div className="h-10 bg-white rounded-xl border border-slate-200 mb-3" />
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 h-32"
          />
        ))}
      </div>
    </div>
  );
}
