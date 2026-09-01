// app/center/dashboard/panels/HospitalRequisitionPanel.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
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

// ─── Action Modal (reusable) ──────────────────────────────────────
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
    emerald:
      "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-600/25 active:scale-[0.98] focus:ring-emerald-500",
    rose: "bg-gradient-to-r from-rose-600 to-red-600 hover:shadow-lg hover:shadow-rose-600/25 active:scale-[0.98] focus:ring-rose-500",
    blue: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98] focus:ring-blue-500",
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl shadow-slate-900/10 border border-slate-200/80 p-6 md:p-8 space-y-6"
      >
        <div className="space-y-1.5">
          <h3
            className={cn(
              "text-2xl text-slate-900 tracking-tight font-normal",
              bebasNeue.className,
            )}
          >
            {title}
          </h3>
          <p className="text-sm font-normal text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {children}

        {showComment && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Reason{" "}
              <span className="text-slate-400 font-normal lowercase">
                (optional)
              </span>
            </label>
            <textarea
              value={comment || ""}
              onChange={(e) => setComment && setComment(e.target.value)}
              rows={3}
              placeholder="Provide additional details or context..."
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all border border-slate-200/60 shadow-sm focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold text-white rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2",
              colorClasses[confirmColor],
              loading && "opacity-70 cursor-not-allowed shadow-none scale-100",
            )}
          >
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
            )}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Requisition Detail Modal (unchanged) ─────────────────────────
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
        <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-1 rounded-full border border-rose-200/80 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" /> STAT
        </span>
      );
    if (priority === "urgent")
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200/80 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5" /> Urgent
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-full border border-slate-200">
        Normal
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      { label: string; color: string; border: string }
    > = {
      pending: {
        label: "Pending",
        color: "bg-amber-50 text-amber-700",
        border: "border-amber-200/80",
      },
      approved: {
        label: "Approved",
        color: "bg-emerald-50 text-emerald-700",
        border: "border-emerald-200/80",
      },
      rejected: {
        label: "Rejected",
        color: "bg-rose-50 text-rose-700",
        border: "border-rose-200/80",
      },
      fulfilled: {
        label: "Fulfilled",
        color: "bg-blue-50 text-blue-700",
        border: "border-blue-200/80",
      },
      draft: {
        label: "Draft",
        color: "bg-slate-100 text-slate-700",
        border: "border-slate-200",
      },
    };
    const config = map[status] || {
      label: status,
      color: "bg-slate-100 text-slate-700",
      border: "border-slate-200",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border",
          config.color,
          config.border,
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-slate-900/10 border border-slate-200/80 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 md:px-8 py-5 flex justify-between items-center rounded-t-3xl z-20 print:bg-white print:border-b">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                Details view
              </span>
            </div>
            <h2
              className={cn(
                "text-2xl md:text-3xl text-slate-900 tracking-tight font-normal",
                bebasNeue.className,
              )}
            >
              Requisition #
              {requisition.id
                ? requisition.id.slice(-6).toUpperCase()
                : "Details"}
            </h2>
          </div>
          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={handlePrint}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
              aria-label="Print"
              title="Print Requisition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
              aria-label="Close"
              title="Close Modal"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Requisition Summary Card Grid */}
          <div className="bg-slate-50/70 p-5 md:p-6 rounded-3xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Requester
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {requisition.requesterName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Type
              </p>
              <p className="font-semibold text-slate-900 text-sm capitalize">
                {requisition.type.replace("-", " ")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Priority
              </p>
              <div>{getPriorityBadge(requisition.priority)}</div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Status
              </p>
              <div>{getStatusBadge(requisition.status)}</div>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Created Date & Time
              </p>
              <p className="text-sm font-medium text-slate-700">
                {formatDate(requisition.createdAt)}
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Assigned To
              </p>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {requisition.assignedToName || "Not assigned"}
              </p>
            </div>
            {requisition.clinicalNotes && (
              <div className="col-span-full space-y-1 pt-2 border-t border-slate-200/60">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Clinical Notes
                </p>
                <p className="text-sm text-slate-700 bg-white p-3.5 rounded-2xl border border-slate-200/60 shadow-sm leading-relaxed">
                  {requisition.clinicalNotes}
                </p>
              </div>
            )}
          </div>

          {/* Items */}
          {requisition.items && requisition.items.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                Requested Items ({requisition.items.length})
              </h3>
              <div className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm divide-y divide-slate-100">
                {requisition.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 md:px-6 flex justify-between items-center hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 text-sm">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.strength}{" "}
                        <span className="text-slate-300">•</span> {item.form}{" "}
                        <span className="text-slate-300">•</span> {item.unit}
                      </p>
                    </div>
                    <div className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold shadow-inner">
                      ×{item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval Chain */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Approval Chain History
            </h3>
            <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-6 ml-2">
              {requisition.approvalHistory &&
              requisition.approvalHistory.length > 0 ? (
                requisition.approvalHistory.map((entry, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-emerald-600 bg-white shadow-sm ring-4 ring-emerald-50" />
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2.5 transition-all hover:border-slate-300">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {getActionLabel(entry.action)}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium border border-slate-200/60">
                              {entry.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Action completed by{" "}
                            <span className="font-semibold text-slate-800">
                              {entry.userName || entry.userId}
                            </span>
                          </p>
                          {entry.comment && (
                            <div className="mt-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-start gap-2 shadow-inner">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span className="italic leading-relaxed">
                                "{entry.comment}"
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 text-center text-sm text-slate-500">
                  No approval history records available yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer (print only) */}
        <div className="hidden print:block text-xs text-slate-400 text-center py-6 border-t border-slate-200 mt-6">
          Printed securely from Doza Center Dashboard
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

  // ── UI state ──
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "my" | "assigned">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequisition, setSelectedRequisition] =
    useState<Requisition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ── Action modals state ──
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [escalateComment, setEscalateComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ── Escalation staff selection ──
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

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let items = requisitions;

    if (viewMode === "my") {
      items = items.filter((r) => r.requesterId === user?.id);
    } else if (viewMode === "assigned") {
      items = items.filter((r) => r.assignedToUserId === user?.id);
    }
    // "all" shows everything the API returned

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

  // ── Helpers ──
  const getStatusConfig = (status: string) => {
    const map: Record<string, any> = {
      pending: {
        label: "Pending",
        icon: Clock,
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-200",
      },
      approved: {
        label: "Approved",
        icon: CheckCircle,
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
      },
      fulfilled: {
        label: "Fulfilled",
        icon: CheckCircle,
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        border: "border-emerald-200",
      },
      rejected: {
        label: "Rejected",
        icon: XCircle,
        bg: "bg-rose-100",
        text: "text-rose-800",
        border: "border-rose-200",
      },
      draft: {
        label: "Draft",
        icon: AlertTriangle,
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
      },
    };
    return (
      map[status] || {
        label: status,
        icon: AlertTriangle,
        bg: "bg-slate-100",
        text: "text-slate-700",
        border: "border-slate-200",
      }
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

  // ── Action handlers ──
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

  // ── Render ──
  if (loading) return <RequisitionSkeleton />;
  if (error) {
    return (
      <div className="p-8 text-center text-rose-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
        <p className="font-semibold">Failed to load requisitions</p>
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
        "min-h-screen bg-slate-50/60 pb-28 pt-8 md:pt-12 text-slate-900 selection:bg-emerald-500 selection:text-white",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Header - Clean, Borderless & Spacious */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-slate-200/60">
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Requisitions Management
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-200/50 px-3 py-1 rounded-full">
                {requisitions.length} total
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight font-normal leading-[1.05]",
                bebasNeue.className,
              )}
            >
              {viewMode === "my"
                ? "My Requests"
                : viewMode === "assigned"
                  ? "Assigned to Me"
                  : "All Requests"}
            </h1>
            <p className="text-sm sm:text-base font-normal text-slate-600 max-w-2xl leading-relaxed">
              {viewMode === "my"
                ? "Manage and track the progress of requisitions you have created."
                : viewMode === "assigned"
                  ? "Review and take action on requisitions assigned to you."
                  : "Comprehensive overview of all your requisitions and those assigned to you."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={refetch}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-slate-600 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center gap-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> New Request
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={ClipboardList} />
          <StatCard label="Pending" value={stats.pending} icon={Clock} />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
          />
          <StatCard
            label="Fulfilled"
            value={stats.fulfilled}
            icon={CheckCircle}
          />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} />
        </div>

        {/* View Tabs & Search Filters Wrapper */}
        <div className="bg-white p-5 sm:p-7 rounded-[2rem] border border-slate-200/85 shadow-xl shadow-slate-950/[0.02] space-y-6">
          {/* View Tabs */}
          <div className="flex flex-wrap gap-2.5 pb-6 border-b border-slate-100">
            <button
              onClick={() => setViewMode("all")}
              className={cn(
                "px-4.5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2.5",
                viewMode === "all"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/70",
              )}
            >
              <ClipboardList className="w-4 h-4" />
              All
              <span
                className={cn(
                  "text-xs rounded-full px-2 py-0.5",
                  viewMode === "all"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/70 text-slate-600",
                )}
              >
                {requisitions.length}
              </span>
            </button>
            <button
              onClick={() => setViewMode("my")}
              className={cn(
                "px-4.5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2.5",
                viewMode === "my"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/70",
              )}
            >
              <Send className="w-4 h-4" />
              My Requests
              <span
                className={cn(
                  "text-xs rounded-full px-2 py-0.5",
                  viewMode === "my"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/70 text-slate-600",
                )}
              >
                {requisitions.filter((r) => r.requesterId === user?.id).length}
              </span>
            </button>
            <button
              onClick={() => setViewMode("assigned")}
              className={cn(
                "px-4.5 py-3 rounded-2xl text-sm font-medium transition-all flex items-center gap-2.5",
                viewMode === "assigned"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100/80 border border-slate-200/70",
              )}
            >
              <Inbox className="w-4 h-4" />
              Assigned to Me
              <span
                className={cn(
                  "text-xs rounded-full px-2 py-0.5",
                  viewMode === "assigned"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/70 text-slate-600",
                )}
              >
                {
                  requisitions.filter((r) => r.assignedToUserId === user?.id)
                    .length
                }
              </span>
            </button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by item, requester, or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {["all", "pending", "approved", "fulfilled", "rejected"].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                      statusFilter === status
                        ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-950/10"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                    )}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-[2rem] border border-slate-200/85 shadow-xl shadow-slate-950/[0.02] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-16 sm:p-24 text-center text-slate-500">
              <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-5 text-emerald-600 shadow-sm">
                <ClipboardList className="w-9 h-9 stroke-[1.8]" />
              </div>
              <p className="font-bold text-lg text-slate-800 tracking-tight">
                No requisitions found
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : viewMode === "my"
                    ? "You haven't created any requests yet."
                    : viewMode === "assigned"
                      ? "No requests have been assigned to you."
                      : "No requests available at the moment."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((req) => {
                const config = getStatusConfig(req.status);
                const Icon = config.icon;
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 sm:p-7 hover:bg-emerald-50/[0.15] transition-all group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl border shadow-sm transition-transform group-hover:scale-105 shrink-0",
                            config.bg,
                            config.text,
                            config.border,
                          )}
                        >
                          <TypeIcon className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="font-bold text-base text-slate-900 tracking-tight">
                              {req.requesterName}
                            </h3>
                            <span className="text-xs font-medium text-slate-300">
                              •
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                            {req.priority === "urgent" && (
                              <span className="inline-flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200/80 shadow-sm">
                                <AlertTriangle className="w-3 h-3 stroke-[2.2]" />
                                Urgent
                              </span>
                            )}
                            {req.priority === "stat" && (
                              <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-semibold bg-rose-50 px-3 py-0.5 rounded-full border border-rose-200/80 shadow-sm">
                                <AlertTriangle className="w-3 h-3 stroke-[2.2]" />
                                STAT
                              </span>
                            )}
                            {req.assignedToUserId && (
                              <span className="text-xs font-semibold bg-blue-50/80 text-blue-700 px-3 py-0.5 rounded-full border border-blue-200/80 flex items-center gap-1.5 shadow-sm">
                                <User className="w-3 h-3 stroke-[2.2]" />
                                {isAssignedToMe
                                  ? "Assigned to You"
                                  : req.assignedToName || "Assigned"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-600 capitalize">
                            {req.items.length} item(s){" "}
                            <span className="text-slate-300">•</span>{" "}
                            {req.type.replace("-", " ")}
                            {req.assignedToName && !isAssignedToMe && (
                              <span className="ml-2 text-xs text-slate-400 font-normal">
                                → Assigned to {req.assignedToName}
                              </span>
                            )}
                          </p>
                          {req.clinicalNotes && (
                            <p className="text-xs text-slate-500 mt-2 line-clamp-1 bg-slate-50/80 px-3 py-2 rounded-xl border border-slate-200/60">
                              {req.clinicalNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <span
                          className={cn(
                            "px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-sm",
                            config.bg,
                            config.text,
                            config.border,
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                          {config.label}
                        </span>

                        {showActions && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveClick(req.id)}
                              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                              <CheckCircle className="w-3.5 h-3.5 stroke-[2.2]" />{" "}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(req.id)}
                              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                            >
                              <XCircle className="w-3.5 h-3.5 stroke-[2.2]" />{" "}
                              Reject
                            </button>
                            <button
                              onClick={() => handleEscalateClick(req.id)}
                              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <ArrowUp className="w-3.5 h-3.5 stroke-[2.2]" />{" "}
                              Escalate
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleViewDetails(req)}
                          className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 hover:border-slate-300 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
                          title="View details & approval chain"
                        >
                          <Eye className="w-4 h-4 stroke-[2.2]" />
                        </button>

                        {isEditable && (
                          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                            <button
                              className="p-2.5 bg-emerald-50 border border-emerald-200/60 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
                              title="Edit"
                            >
                              <Eye className="w-4 h-4 stroke-[2.2]" />
                            </button>
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="p-2.5 bg-rose-50 border border-rose-200/60 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500"
                              title="Delete"
                            >
                              <XCircle className="w-4 h-4 stroke-[2.2]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals Section ── */}
      <RequisitionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={async (data: any) => {
          await createRequisition(data);
          setModalOpen(false);
          refetch();
        }}
      />

      {showDetailModal && selectedRequisition && (
        <RequisitionDetailModal
          requisition={selectedRequisition}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequisition(null);
          }}
        />
      )}

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
        confirmColor="blue"
        showComment={true}
        comment={escalateComment}
        setComment={setEscalateComment}
        loading={actionLoading}
      >
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Select Staff *
          </label>
          <div className="relative">
            <div className="flex items-center border border-slate-200 bg-slate-50/70 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/25 focus-within:border-blue-600 transition-all">
              <User className="w-4 h-4 text-slate-400 ml-3.5" />
              <input
                type="text"
                placeholder="Search staff..."
                value={escalateSearch}
                onChange={(e) => {
                  setEscalateSearch(e.target.value);
                  setIsEscalateDropdownOpen(true);
                }}
                onFocus={() => setIsEscalateDropdownOpen(true)}
                className="flex-1 px-3 py-3 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              />
              {escalateTargetUserId && (
                <button
                  type="button"
                  onClick={() => {
                    setEscalateTargetUserId(null);
                    setEscalateSearch("");
                  }}
                  className="pr-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {isEscalateDropdownOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5">
                {loadingStaff ? (
                  <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mb-2" />
                    Loading staff members...
                  </div>
                ) : filteredEscalateStaff.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500">
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
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-3 border-b border-slate-50 last:border-0"
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm",
                            color,
                          )}
                        >
                          {initials}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-slate-800">
                            {staff.personalInfo.fullName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {staff.professional.role}
                          </div>
                        </div>
                        {escalateTargetUserId === staff.id && (
                          <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {selectedEscalateStaff && (
            <div className="mt-3 flex items-center gap-2.5 text-xs text-blue-800 bg-blue-50/80 p-3 rounded-2xl border border-blue-200/60 shadow-sm">
              <div
                className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm",
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
                <strong className="font-semibold">
                  {selectedEscalateStaff.personalInfo.fullName}
                </strong>{" "}
                ({selectedEscalateStaff.professional.role})
              </span>
            </div>
          )}
        </div>
      </ActionModal>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="group relative overflow-hidden bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-emerald-300 transition-all duration-300 shadow-xl shadow-slate-950/5 hover:shadow-2xl hover:-translate-y-0.5">
      {/* Ambient decorative glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-emerald-400/20" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl md:text-4xl font-normal tracking-tight leading-none text-slate-900",
              bebasNeue.className,
            )}
          >
            {value}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110 shrink-0">
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
}

function RequisitionSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-slate-200" />
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-48 bg-slate-200 rounded" />
            <div className="h-5 w-64 bg-slate-100 rounded mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="w-32 h-10 bg-slate-200 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-4 border border-slate-200/80"
            >
              <div className="flex justify-between">
                <div>
                  <div className="h-3 w-10 bg-slate-200 rounded" />
                  <div className="h-7 w-12 bg-slate-200 rounded mt-1" />
                </div>
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 w-24 bg-slate-200 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-11 bg-slate-200 rounded-xl" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-16 h-8 bg-slate-200 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-6 bg-slate-200 rounded-full" />
                  <div className="w-16 h-6 bg-slate-200 rounded-full" />
                  <div className="w-16 h-6 bg-slate-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
