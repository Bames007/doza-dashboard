"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  IdCard,
  Search,
  Filter,
  UserPlus,
  Shield,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BriefcaseMedical,
  Crown,
  UserCheck,
  UserX,
  Trash2,
  Clock,
  Activity,
  UserCog,
} from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import AddStaffModal from "../components/AddStaffModal";
import StaffIDCardModal from "../components/StaffIDCardModal";
import { Center, User } from "@/app/center/type";

interface StaffMember {
  id: string;
  staffId: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    position: string;
  };
  professional: {
    role: string;
    department: string;
    employmentType: string;
    startDate: string;
  };
  isOwner: boolean;
  status: "active" | "inactive" | "on_leave";
  createdAt: string;
  joinedAt: string;
  lastUpdated: string;
}

interface StaffPanelProps {
  center: Center;
  user: User;
  onUpdate: (updatedCenter: Center) => void;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default function StaffPanel({ center, user }: StaffPanelProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isIDCardModalOpen, setIsIDCardModalOpen] = useState(false);

  // Load staff data
  const loadStaff = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`/api/centers/${center.id}/staff`, {
        headers: { "x-user-id": user.id },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: ApiResponse = await response.json();
      if (result.success && result.data) {
        setStaff(result.data);
      } else {
        setStaff([]);
        if (result.error) setError(result.error);
      }
    } catch (err: any) {
      console.error("Error loading staff:", err);
      setError(`Failed to load staff: ${err.message}`);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (center?.id) loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  const handleStaffAdded = async (
    newStaff: Omit<
      StaffMember,
      "id" | "staffId" | "createdAt" | "joinedAt" | "lastUpdated"
    >,
  ) => {
    try {
      setSaveStatus("saving");
      setError("");
      const response = await fetch(`/api/centers/${center.id}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": user.id },
        body: JSON.stringify(newStaff),
      });
      const result: ApiResponse = await response.json();
      if (result.success) {
        await loadStaff();
        setSaveStatus("success");
        setIsAddStaffModalOpen(false);
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        throw new Error(result.error || "Failed to add staff");
      }
    } catch (err: any) {
      console.error("Error adding staff:", err);
      setError(err.message);
      setSaveStatus("error");
    }
  };

  const handleDeleteStaff = async (staffId: string, isOwner: boolean) => {
    if (isOwner) {
      alert("Cannot delete owner account");
      return;
    }
    if (
      !confirm(
        "Are you sure you want to delete this staff member? This action cannot be undone.",
      )
    )
      return;
    try {
      setLoading(true);
      const response = await fetch(
        `/api/centers/${center.id}/staff/${staffId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": user.id },
        },
      );
      const result: ApiResponse = await response.json();
      if (result.success) {
        await loadStaff();
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        throw new Error(result.error || "Failed to delete staff");
      }
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      setError(err.message);
      setSaveStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewIDCard = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsIDCardModalOpen(true);
  };

  const handleJoinDozaMedic = async (staffId: string, staffEmail: string) => {
    try {
      await fetch("/api/medics/register/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          email: staffEmail,
          centerId: center.id,
          centerName: center.centerName,
          invitedBy: user.id,
        }),
      });
    } catch (err) {
      console.error("Error inviting to Doza Medic:", err);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────

  const getRoleCounts = () => {
    const counts = {
      owner: 0,
      doctor: 0,
      nurse: 0,
      support: 0,
      admin: 0,
      technician: 0,
      other: 0,
    };
    staff.forEach((m) => {
      const role = m.professional.role.toLowerCase();
      if (m.isOwner) counts.owner++;
      else if (role.includes("doctor") || role.includes("physician"))
        counts.doctor++;
      else if (role.includes("nurse")) counts.nurse++;
      else if (role.includes("admin") || role.includes("manager"))
        counts.admin++;
      else if (role.includes("tech") || role.includes("lab"))
        counts.technician++;
      else if (role.includes("support") || role.includes("assistant"))
        counts.support++;
      else counts.other++;
    });
    return counts;
  };

  const getStatusCounts = () => {
    const counts = { active: 0, inactive: 0, on_leave: 0 };
    staff.forEach((m) => counts[m.status]++);
    return counts;
  };

  const roleCounts = getRoleCounts();
  const statusCounts = getStatusCounts();

  const formatRole = (role: string) =>
    role
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return {
          pill: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          label: "Active",
        };
      case "on_leave":
        return {
          pill: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
          label: "On Leave",
        };
      case "inactive":
      default:
        return {
          pill: "bg-slate-100 text-slate-600 border-slate-200",
          dot: "bg-slate-400",
          label: "Inactive",
        };
    }
  };

  const getFilteredStaff = () => {
    let filtered = staff;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.personalInfo.fullName.toLowerCase().includes(s) ||
          m.personalInfo.email.toLowerCase().includes(s) ||
          m.personalInfo.phone.includes(searchTerm) ||
          m.professional.role.toLowerCase().includes(s) ||
          m.staffId.toLowerCase().includes(s),
      );
    }
    if (filterRole !== "all") {
      filtered = filtered.filter((m) => {
        if (filterRole === "owner") return m.isOwner;
        return m.professional.role
          .toLowerCase()
          .includes(filterRole.toLowerCase());
      });
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }
    return filtered;
  };

  const filteredStaff = getFilteredStaff();

  const roleOptions = [
    { value: "all", label: "All Roles", count: staff.length },
    { value: "owner", label: "Owners", count: roleCounts.owner },
    { value: "doctor", label: "Doctors", count: roleCounts.doctor },
    { value: "nurse", label: "Nurses", count: roleCounts.nurse },
    { value: "admin", label: "Admins", count: roleCounts.admin },
    { value: "technician", label: "Technicians", count: roleCounts.technician },
    { value: "support", label: "Support", count: roleCounts.support },
    { value: "other", label: "Other", count: roleCounts.other },
  ];

  const statusOptions = [
    { value: "all", label: "All Status", count: staff.length },
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "inactive", label: "Inactive", count: statusCounts.inactive },
    { value: "on_leave", label: "On Leave", count: statusCounts.on_leave },
  ];

  // Compact stat pills
  const statItems = [
    { label: "Total", value: staff.length, tone: "emerald" as const },
    { label: "Owners", value: roleCounts.owner, tone: "amber" as const },
    { label: "Doctors", value: roleCounts.doctor, tone: "emerald" as const },
    { label: "Nurses", value: roleCounts.nurse, tone: "emerald" as const },
    { label: "Admins", value: roleCounts.admin, tone: "emerald" as const },
    {
      label: "Technicians",
      value: roleCounts.technician,
      tone: "emerald" as const,
    },
    { label: "Active", value: statusCounts.active, tone: "emerald" as const },
    {
      label: "Inactive",
      value: statusCounts.inactive,
      tone: "slate" as const,
    },
    {
      label: "On Leave",
      value: statusCounts.on_leave,
      tone: "slate" as const,
    },
  ];

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  return (
    <div className={cn("min-h-screen bg-[#F8FAFC] pb-24", poppins.className)}>
      <div className="max-w-7xl mx-auto px-3 md:px-6">
        {/* ─── Compact header ─────────────────────────────────── */}
        <header className="pt-3 md:pt-6 mb-3 md:mb-5">
          {/* Row 1: eyebrow + add button */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
                Team Management
              </span>
              <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
                {staff.length}
              </span>
            </div>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Add Staff
            </button>
          </div>

          {/* Row 2: title */}
          <h1
            className={cn(
              "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
              bebasNeue.className,
            )}
          >
            Staff Overview
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 truncate">
            Managing{" "}
            <span className="font-semibold text-slate-700">
              {center.centerName || "Medical Center"}
            </span>
          </p>

          {/* Row 3: horizontal scroll stat pills on mobile, grid on desktop */}
          <div className="-mx-3 px-3 md:mx-0 md:px-0 mt-3 md:mt-4 flex md:grid md:grid-cols-5 lg:grid-cols-9 gap-2 md:gap-2.5 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
            {statItems.map((stat, i) => (
              <StatPill
                key={i}
                label={stat.label}
                value={stat.value}
                tone={stat.tone}
              />
            ))}
          </div>
        </header>

        {/* ─── Save Status ────────────────────────────────────── */}
        <AnimatePresence>
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={cn(
                "rounded-xl p-2.5 md:p-3 border mb-3 flex items-center gap-2 text-[11px] md:text-xs",
                saveStatus === "success" &&
                  "bg-emerald-50 border-emerald-200 text-emerald-700",
                saveStatus === "error" &&
                  "bg-rose-50 border-rose-200 text-rose-700",
                saveStatus === "saving" &&
                  "bg-slate-50 border-slate-200 text-slate-700",
              )}
            >
              {saveStatus === "saving" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              )}
              {saveStatus === "success" && (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              )}
              {saveStatus === "error" && (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="font-medium truncate">
                {saveStatus === "saving" && "Saving…"}
                {saveStatus === "success" && "Operation successful"}
                {saveStatus === "error" && `Error: ${error}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && saveStatus !== "error" && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 md:p-3 mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[11px] md:text-xs text-rose-700 font-medium truncate">
                {error}
              </span>
            </div>
            <button
              onClick={() => setError("")}
              className="p-1 hover:bg-rose-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
            </button>
          </div>
        )}

        {/* ─── Search + Filters ──────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-5">
          {/* Search — spans full width on mobile */}
          <div className="relative col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email, role…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-xs md:text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none"
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

          {/* Role filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-9 pr-7 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none text-xs md:text-sm text-slate-800 shadow-sm cursor-pointer outline-none truncate"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="relative">
            <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-7 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none text-xs md:text-sm text-slate-800 shadow-sm cursor-pointer outline-none truncate"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Staff grid ────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <span className="text-xs md:text-sm text-slate-500 font-medium">
              Loading staff…
            </span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Users className="w-7 h-7 text-slate-300" />
            </div>
            <h3
              className={cn(
                "text-base md:text-lg font-bold text-slate-900 mb-1.5",
                bebasNeue.className,
              )}
            >
              No Staff Members Found
            </h3>
            <p className="text-[11px] md:text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {searchTerm || filterRole !== "all" || filterStatus !== "all"
                ? "No staff match your filters. Try adjusting your criteria."
                : "Your team is empty. Add your first staff member to get started."}
            </p>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 md:px-6 py-2.5 rounded-xl font-bold text-[11px] md:text-xs uppercase tracking-wide transition-all shadow-sm inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Staff Member
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3">
            {filteredStaff.map((member, index) => {
              const style = getStatusStyle(member.status);
              const initials = getInitials(member.personalInfo.fullName);
              const isOwner = member.isOwner;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-200 p-3.5 md:p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
                >
                  {/* Top: avatar + info + status dot */}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm md:text-base",
                          isOwner ? "bg-amber-500" : "bg-emerald-600",
                        )}
                      >
                        {initials}
                      </div>
                      {isOwner && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5">
                          <Crown className="w-3 h-3" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
                          style.dot,
                        )}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-900 text-xs md:text-sm leading-tight truncate">
                          {member.personalInfo.fullName}
                        </h3>
                        {isOwner && (
                          <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0 uppercase tracking-wide">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] md:text-xs text-slate-500 font-medium truncate">
                        {formatRole(member.professional.role)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          className={cn(
                            "text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                            style.pill,
                          )}
                        >
                          {style.label}
                        </span>
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-mono bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-200 truncate max-w-[100px]">
                          {member.staffId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-600 min-w-0">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {member.personalInfo.email}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-600 min-w-0">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {member.personalInfo.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-500 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">
                          {new Date(member.joinedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleViewIDCard(member)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-1.5"
                    >
                      <IdCard className="w-3.5 h-3.5" />
                      ID Card
                    </button>
                    {!isOwner && (
                      <button
                        onClick={() =>
                          handleDeleteStaff(member.id, member.isOwner)
                        }
                        className="flex-1 border border-rose-200 text-rose-600 bg-rose-50/50 py-2 rounded-lg text-[10px] md:text-[11px] font-bold uppercase tracking-wide hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddStaffModalOpen && (
          <AddStaffModal
            onClose={() => setIsAddStaffModalOpen(false)}
            onStaffAdded={handleStaffAdded}
            center={center}
            user={user}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isIDCardModalOpen && selectedStaff && (
          <StaffIDCardModal
            staff={selectedStaff}
            onClose={() => setIsIDCardModalOpen(false)}
            center={center}
            currentUserId={user.id}
            onJoinDozaMedic={handleJoinDozaMedic}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Compact stat pill ──────────────────────────────────────────

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-slate-50 border-slate-200 text-slate-600";

  return (
    <div
      className={cn(
        "shrink-0 md:shrink w-auto md:w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border",
        toneClass,
      )}
    >
      <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums leading-none">
        {value}
      </span>
    </div>
  );
}
