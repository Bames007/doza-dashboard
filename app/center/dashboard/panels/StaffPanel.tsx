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

export default function StaffPanel({
  center,
  user,
  onUpdate,
}: StaffPanelProps) {
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

  // Helpers
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-700",
          border: "border-emerald-200",
          dot: "bg-emerald-500",
        };
      case "inactive":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400",
        };
      case "on_leave":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          border: "border-amber-200",
          dot: "bg-amber-500",
        };
      default:
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          border: "border-slate-200",
          dot: "bg-slate-400",
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
    { value: "all", label: "All Roles", count: staff.length, icon: Users },
    { value: "owner", label: "Owners", count: roleCounts.owner, icon: Crown },
    {
      value: "doctor",
      label: "Doctors",
      count: roleCounts.doctor,
      icon: BriefcaseMedical,
    },
    { value: "nurse", label: "Nurses", count: roleCounts.nurse, icon: Shield },
    { value: "admin", label: "Admins", count: roleCounts.admin, icon: UserCog },
    {
      value: "technician",
      label: "Technicians",
      count: roleCounts.technician,
      icon: Activity,
    },
    {
      value: "support",
      label: "Support",
      count: roleCounts.support,
      icon: Users,
    },
    {
      value: "other",
      label: "Other",
      count: roleCounts.other,
      icon: UserCheck,
    },
  ];

  const statusOptions = [
    { value: "all", label: "All", count: staff.length },
    { value: "active", label: "Active", count: statusCounts.active },
    { value: "inactive", label: "Inactive", count: statusCounts.inactive },
    { value: "on_leave", label: "On Leave", count: statusCounts.on_leave },
  ];

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-40 pt-6",
        poppins.className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 md:px-6"
      >
        {/* --- HEADER --- */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Team Management
              </span>
              <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {staff.length} members
              </span>
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Staff <span className="text-emerald-600">Overview</span>
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Manage your team at{" "}
              <span className="font-semibold text-slate-800">
                {center.centerName || "Medical Center"}
              </span>
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsAddStaffModalOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] hover:shadow-xl hover:shadow-emerald-200/50 transition-all flex items-center gap-2.5 shadow-lg shadow-emerald-200/30"
          >
            <UserPlus size={17} className="stroke-[2.5]" /> Add Staff
          </motion.button>
        </header>

        {/* --- SAVE STATUS --- */}
        <AnimatePresence>
          {saveStatus !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-2xl p-4 border-2 backdrop-blur-sm mb-7 shadow-sm",
                saveStatus === "success" &&
                  "bg-emerald-50/90 border-emerald-200 text-emerald-800",
                saveStatus === "error" &&
                  "bg-rose-50/90 border-rose-200 text-rose-800",
                saveStatus === "saving" &&
                  "bg-blue-50/90 border-blue-200 text-blue-800",
              )}
            >
              <div className="flex items-center gap-3">
                {saveStatus === "saving" && (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {saveStatus === "success" && (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                {saveStatus === "error" && <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-semibold">
                  {saveStatus === "saving" && "Saving changes..."}
                  {saveStatus === "success" && "Operation successful!"}
                  {saveStatus === "error" && `Error: ${error}`}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 mb-7 flex items-center justify-between backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-sm text-rose-800 font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="p-1.5 hover:bg-rose-100 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        )}

        {/* --- STATS (modern cards) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-10">
          {[
            {
              label: "Total",
              value: staff.length,
              icon: Users,
              color: "from-blue-500 to-indigo-600",
              bg: "bg-blue-50",
              text: "text-blue-700",
            },
            {
              label: "Owners",
              value: roleCounts.owner,
              icon: Crown,
              color: "from-amber-500 to-orange-600",
              bg: "bg-amber-50",
              text: "text-amber-700",
            },
            {
              label: "Doctors",
              value: roleCounts.doctor,
              icon: BriefcaseMedical,
              color: "from-emerald-500 to-teal-600",
              bg: "bg-emerald-50",
              text: "text-emerald-700",
            },
            {
              label: "Nurses",
              value: roleCounts.nurse,
              icon: Shield,
              color: "from-purple-500 to-violet-600",
              bg: "bg-purple-50",
              text: "text-purple-700",
            },
            {
              label: "Active",
              value: statusCounts.active,
              icon: UserCheck,
              color: "from-green-500 to-emerald-600",
              bg: "bg-green-50",
              text: "text-green-700",
            },
            {
              label: "Inactive",
              value: statusCounts.inactive,
              icon: UserX,
              color: "from-slate-400 to-slate-500",
              bg: "bg-slate-50",
              text: "text-slate-700",
            },
            {
              label: "On Leave",
              value: statusCounts.on_leave,
              icon: Clock,
              color: "from-amber-400 to-amber-600",
              bg: "bg-amber-50",
              text: "text-amber-700",
            },
            {
              label: "Filtered",
              value: filteredStaff.length,
              icon: Filter,
              color: "from-rose-400 to-rose-600",
              bg: "bg-rose-50",
              text: "text-rose-700",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-2xl p-4 border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-all duration-200 group",
                "flex flex-col items-start gap-1.5",
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl font-bold text-slate-900 leading-none">
                  {stat.value}
                </span>
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("w-4 h-4", stat.text)} />
                </div>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.12em]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* --- SEARCH & FILTERS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-sm text-slate-800 placeholder:text-slate-400 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none text-sm text-slate-800 shadow-sm cursor-pointer"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none text-sm text-slate-800 shadow-sm cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- STAFF GRID --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
            <span className="text-sm text-slate-500 font-medium">
              Loading staff members...
            </span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <Users className="w-10 h-10 text-slate-300" />
            </div>
            <h3
              className={cn(
                "text-2xl font-bold text-slate-900 mb-2",
                bebasNeue.className,
              )}
            >
              No Staff Members Found
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto mb-7">
              {searchTerm || filterRole !== "all" || filterStatus !== "all"
                ? "No staff match your current search filters. Try adjusting your criteria."
                : "Your team is empty. Add your first staff member to get started."}
            </p>
            <button
              onClick={() => setIsAddStaffModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-9 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] hover:shadow-xl hover:shadow-emerald-200/50 transition-all shadow-lg shadow-emerald-200/30"
            >
              Add Staff Member
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredStaff.map((member, index) => {
              const colors = getStatusColor(member.status);
              const initials = getInitials(member.personalInfo.fullName);
              const isOwner = member.isOwner;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-xl hover:border-emerald-200/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm",
                          isOwner
                            ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200/50"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200/50",
                        )}
                      >
                        {initials}
                      </div>
                      {isOwner && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white rounded-full p-0.5 shadow-md shadow-amber-200/50">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
                          colors.dot,
                        )}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900 text-[15px] leading-tight truncate">
                          {member.personalInfo.fullName}
                        </h3>
                        {isOwner && (
                          <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Owner
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 font-medium">
                        {formatRole(member.professional.role)}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] px-2.5 py-0.5 rounded-full font-semibold",
                            colors.bg,
                            colors.text,
                            "border",
                            colors.border,
                          )}
                        >
                          {member.status === "active"
                            ? "Active"
                            : member.status === "inactive"
                              ? "Inactive"
                              : "On Leave"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
                          {member.staffId}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {member.personalInfo.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{member.personalInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>
                        Joined{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(member.joinedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2.5 pt-3 border-t border-slate-100">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleViewIDCard(member)}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-2"
                    >
                      <IdCard size={14} /> ID Card
                    </motion.button>
                    {!isOwner && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() =>
                          handleDeleteStaff(member.id, member.isOwner)
                        }
                        className="flex-1 border-2 border-rose-200/80 text-rose-600 bg-rose-50/50 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-rose-100 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Remove
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* MODALS */}
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
