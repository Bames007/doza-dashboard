// app/center/dashboard/panels/AppointmentsPanel.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Search,
  Circle,
  Edit,
  Eye,
  Calendar,
  UserCheck,
  UserX,
  Activity,
  Phone,
  CalendarDays,
  Check,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAppointments } from "../dashboards/hooks/useAppointments";
import type { Appointment } from "../types/appointment";

// ─── Helpers ────────────────────────────────────────────────────────

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatMonthYear = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

// Unified status styles — emerald/slate/rose only
const getStatusStyle = (status: string) => {
  const map: Record<string, string> = {
    scheduled: "bg-slate-100 text-slate-700 border-slate-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "checked-in": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "in-progress": "bg-slate-100 text-slate-700 border-slate-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    "no-show": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
};

const getStatusIcon = (status: string) => {
  const map: Record<string, any> = {
    scheduled: Clock,
    confirmed: CheckCircle,
    "checked-in": UserCheck,
    "in-progress": Activity,
    completed: Check,
    cancelled: XCircle,
    "no-show": UserX,
  };
  return map[status] || Clock;
};

const StatusBadge = ({ status }: { status: string }) => {
  const Icon = getStatusIcon(status);
  const label = status.replace(/-/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wide rounded-full border shrink-0",
        getStatusStyle(status),
      )}
    >
      <Icon className="w-2.5 h-2.5" />
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
};

// ─── Skeletons ──────────────────────────────────────────────────────

const CalendarSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="divide-y divide-slate-100">
      {[8, 9, 10, 11, 12].map((hour) => (
        <div key={hour} className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-20 p-2 bg-slate-50/50 border-b sm:border-b-0 sm:border-r border-slate-100 flex items-center justify-center">
            <div className="h-3 w-12 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-2 space-y-1.5 min-h-[50px]">
            <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MonthSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="grid grid-cols-7 gap-px bg-slate-200">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
        <div key={i} className="bg-slate-50 p-1.5 text-center">
          <div className="h-3 w-4 mx-auto bg-slate-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-7 gap-px bg-slate-200">
      {Array.from({ length: 35 }).map((_, idx) => (
        <div key={idx} className="bg-white p-1.5 h-14 sm:h-20">
          <div className="h-3 w-5 bg-slate-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

const ListSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-slate-200 p-3 h-20 animate-pulse"
      />
    ))}
  </div>
);

// ─── Month Appointments Hook ────────────────────────────────────────

function useMonthAppointments(
  centerId: string | undefined,
  month: string,
  userId: string | undefined,
) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!centerId || !userId) return;
    setLoading(true);
    fetch(`/api/centers/${centerId}/appointments?month=${month}`, {
      headers: { "x-user-id": userId },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setAppointments(data.appointments);
        } else {
          setError(data.error || "Unknown error");
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [centerId, month, userId]);

  return { appointments, loading, error };
}

// ─── Details Bottom Sheet ───────────────────────────────────────────

function AppointmentDetailsSheet({
  appointment,
  onClose,
  onEdit,
  onCancel,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onEdit: () => void;
  onCancel: (id: string) => void;
}) {
  if (!appointment) return null;

  const isCancellable =
    appointment.status !== "cancelled" && appointment.status !== "completed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Appointment Details
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Patient */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                {appointment.patientName?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                  Patient
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {appointment.patientName}
                </p>
                {appointment.patientPhone && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    {appointment.patientPhone}
                  </p>
                )}
              </div>
              <StatusBadge status={appointment.status} />
            </div>
          </div>

          {/* Type & Title */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Type
              </p>
              <p className="text-xs font-semibold text-slate-800 capitalize truncate">
                {appointment.type}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Title
              </p>
              <p className="text-xs font-semibold text-slate-800 truncate">
                {appointment.title || "—"}
              </p>
            </div>
          </div>

          {/* Time */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Schedule
            </p>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-700 flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {formatDate(appointment.startTime)}
              </p>
              <p className="text-xs text-slate-700 flex items-center gap-2 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {formatTime(appointment.startTime)} –{" "}
                {formatTime(appointment.endTime)}
              </p>
              <p className="text-[10px] text-slate-500 pl-5.5">
                Duration: {appointment.duration || 30} minutes
              </p>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Notes
              </p>
              <p className="text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Cancellation */}
          {appointment.cancellationReason && (
            <div>
              <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wide mb-1.5">
                Cancellation Reason
              </p>
              <p className="text-[11px] text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                {appointment.cancellationReason}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-100 pt-3">
            <p className="tabular-nums">
              Created: {new Date(appointment.createdAt).toLocaleString()}
            </p>
            <p className="tabular-nums">
              Updated: {new Date(appointment.updatedAt).toLocaleString()}
            </p>
            <p className="font-mono">ID: {appointment.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Close
          </button>
          {isCancellable && (
            <>
              <button
                onClick={() => onCancel(appointment.id)}
                className="w-full sm:flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onEdit}
                className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors shadow-sm"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function AppointmentsPanel() {
  const { center, user } = useDashboard();
  const [view, setView] = useState<"calendar" | "list" | "month">("calendar");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { appointments: dailyAppointments, loading: dailyLoading } =
    useAppointments({ date: selectedDate });

  const monthString = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  const {
    appointments: monthAppointments,
    loading: monthLoading,
    error: monthError,
  } = useMonthAppointments(center?.id, monthString, user?.id);

  const filteredDailyAppointments = useMemo(() => {
    let filtered = dailyAppointments;
    if (filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus);
    }
    if (filterType !== "all") {
      filtered = filtered.filter((a) => a.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          a.title?.toLowerCase().includes(q) ||
          a.patientPhone?.includes(q),
      );
    }
    return filtered;
  }, [dailyAppointments, filterStatus, filterType, searchQuery]);

  const timeSlots = useMemo(() => {
    const slots: { hour: number; apps: Appointment[] }[] = [];
    for (let h = 8; h <= 18; h++) {
      slots.push({ hour: h, apps: [] });
    }
    filteredDailyAppointments.forEach((app) => {
      const hour = new Date(app.startTime).getHours();
      if (hour >= 8 && hour <= 18) {
        const slot = slots.find((s) => s.hour === hour);
        if (slot) slot.apps.push(app);
      }
    });
    slots.forEach((slot) => {
      slot.apps.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    });
    return slots;
  }, [filteredDailyAppointments]);

  const monthGrid = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const grid: (Date | null)[][] = [];
    let week: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      week.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      week.push(date);
      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      grid.push(week);
    }
    return grid;
  }, [selectedMonth]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    if (monthAppointments) {
      monthAppointments.forEach((app) => {
        const dateStr = new Date(app.startTime).toISOString().split("T")[0];
        if (!map.has(dateStr)) map.set(dateStr, []);
        map.get(dateStr)!.push(app);
      });
    }
    return map;
  }, [monthAppointments]);

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedAppointment(null);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedAppointment(null);
  };

  const handleGoToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedAppointment(null);
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1),
    );
  };

  const handleSelectAppointment = (app: Appointment) => {
    setSelectedAppointment(app);
  };

  const handleCancel = async () => {
    if (!showCancelModal || !cancelReason.trim()) return;
    try {
      const res = await fetch(
        `/api/centers/${center?.id}/appointments/${showCancelModal}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
          },
          body: JSON.stringify({
            status: "cancelled",
            cancellationReason: cancelReason,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setRefreshKey((prev) => prev + 1);
        setSelectedAppointment(null);
        setShowCancelModal(null);
        setCancelReason("");
      } else {
        alert(data.error || "Failed to cancel appointment");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while cancelling");
    }
  };

  const handleEditAppointment = () => {
    if (selectedAppointment) {
      setShowAddModal(true);
    }
  };

  const handleSaveAppointment = async (data: any) => {
    try {
      const payload = {
        ...data,
        centerId: center?.id,
        createdBy: user?.id,
        status: data.status || "scheduled",
      };
      const res = await fetch(`/api/centers/${center?.id}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setShowAddModal(false);
        setRefreshKey((prev) => prev + 1);
        setSelectedAppointment(null);
      } else {
        alert(result.error || "Failed to create appointment");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create appointment");
    }
  };

  const loading = view === "month" ? monthLoading : dailyLoading;
  const activeFilterCount =
    (filterStatus !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0);

  const renderSkeleton = () => {
    if (view === "calendar") return <CalendarSkeleton />;
    if (view === "month") return <MonthSkeleton />;
    return <ListSkeleton />;
  };

  // View toggle tabs
  const viewTabs: { key: "calendar" | "month" | "list"; label: string }[] = [
    { key: "calendar", label: "Day" },
    { key: "month", label: "Month" },
    { key: "list", label: "List" },
  ];

  return (
    <div
      className={cn(
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + New button */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Appointments
            </span>
            <span className="text-[9px] md:text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full shrink-0 tabular-nums">
              {filteredDailyAppointments.length}
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-[11px] md:text-xs font-bold uppercase tracking-wide shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            New
          </button>
        </div>

        {/* Row 2: Title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Appointments
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Schedule and manage patient appointments
        </p>

        {/* Row 3: view tabs */}
        <div className="mt-3 md:mt-4 flex gap-1.5">
          {viewTabs.map((tab) => {
            const isActive = view === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setView(tab.key)}
                className={cn(
                  "px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Navigation bar ────────────────────────────────── */}
      {view !== "month" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2.5 md:p-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            {/* Date nav */}
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <button
                onClick={handlePreviousDay}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex-1 text-center min-w-0">
                <p className="text-xs md:text-sm font-bold text-slate-900 truncate tabular-nums">
                  <span className="md:hidden">
                    {formatDateShort(selectedDate)}
                  </span>
                  <span className="hidden md:inline">
                    {formatDate(selectedDate)}
                  </span>
                </p>
              </div>
              <button
                onClick={handleNextDay}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={handleGoToday}
                className="ml-1 px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shrink-0"
              >
                Today
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wide border transition-all shrink-0",
                showFilters || activeFilterCount > 0
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              )}
            >
              <Filter className="w-3 h-3" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span
                  className={cn(
                    "text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center",
                    showFilters || activeFilterCount > 0
                      ? "bg-white/25 text-white"
                      : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Search + filters row */}
          <div className="mt-2 md:mt-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-[11px] md:text-xs text-slate-800 outline-none truncate"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked In</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                      Type
                    </label>
                    <select
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-[11px] md:text-xs text-slate-800 outline-none truncate"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="checkup">Checkup</option>
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                      <option value="procedure">Procedure</option>
                      <option value="test">Test</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterType("all");
                    }}
                    className="mt-2 w-full py-1.5 text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:text-emerald-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Month nav bar */}
      {view === "month" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2.5 md:p-3 mb-3 md:mb-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h2 className="text-xs md:text-sm font-bold text-slate-900 tabular-nums">
              {formatMonthYear(selectedMonth)}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
          {monthError && (
            <p className="text-[10px] text-rose-600 mt-2">
              Error: {monthError.message || monthError}
            </p>
          )}
        </div>
      )}

      {/* ─── Main content ────────────────────────────────────── */}
      {loading ? (
        renderSkeleton()
      ) : (
        <>
          {view === "calendar" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-16rem)] overflow-y-auto">
                {timeSlots.map(({ hour, apps }) => (
                  <div key={hour} className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-20 p-2 text-[10px] md:text-xs text-slate-500 sm:border-r border-b sm:border-b-0 border-slate-100 bg-slate-50/50 sm:bg-transparent flex items-center justify-center font-bold uppercase tracking-wide tabular-nums">
                      {hour % 12 === 0 ? 12 : hour % 12}:00{" "}
                      {hour < 12 ? "AM" : "PM"}
                    </div>
                    <div className="flex-1 p-2 space-y-1.5 min-h-[50px]">
                      {apps.length === 0 ? (
                        <span className="text-[10px] md:text-xs text-slate-300 italic block text-center sm:text-left py-2">
                          —
                        </span>
                      ) : (
                        apps.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => handleSelectAppointment(app)}
                            className={cn(
                              "p-2 md:p-2.5 rounded-xl cursor-pointer transition-all border",
                              selectedAppointment?.id === app.id
                                ? "bg-emerald-50 border-emerald-300"
                                : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/30",
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 text-xs md:text-sm truncate">
                                  {app.patientName}
                                </p>
                                {app.title && (
                                  <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                                    {app.title}
                                  </p>
                                )}
                              </div>
                              <StatusBadge status={app.status} />
                            </div>
                            <p className="text-[10px] md:text-[11px] text-slate-500 flex items-center gap-1 tabular-nums">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(app.startTime)} –{" "}
                              {formatTime(app.endTime)}
                              {app.type === "follow-up" && (
                                <span className="ml-1 text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                  Follow-up
                                </span>
                              )}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "month" && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-1.5 md:p-2 text-center text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wide"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {monthGrid.flat().map((date, idx) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="bg-slate-50/50 p-1.5 h-14 sm:h-20"
                      />
                    );
                  }
                  const dateStr = date.toISOString().split("T")[0];
                  const dayAppointments = appointmentsByDate.get(dateStr) || [];
                  const hasAppointments = dayAppointments.length > 0;
                  const isToday =
                    dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setView("calendar");
                      }}
                      className={cn(
                        "bg-white p-1.5 h-14 sm:h-20 cursor-pointer hover:bg-emerald-50/50 transition flex flex-col",
                        isToday && "bg-emerald-50/40",
                      )}
                    >
                      <span
                        className={cn(
                          "text-[11px] md:text-xs text-slate-700 tabular-nums",
                          isToday && "font-bold text-emerald-700",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {hasAppointments && (
                        <div className="mt-0.5 flex items-center gap-1">
                          <Circle className="w-1.5 h-1.5 fill-emerald-600 text-emerald-600" />
                          <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 tabular-nums">
                            {dayAppointments.length}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === "list" && (
            <>
              {filteredDailyAppointments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3
                    className={cn(
                      "text-base md:text-lg font-bold text-slate-800 mb-1",
                      bebasNeue.className,
                    )}
                  >
                    No Appointments
                  </h3>
                  <p className="text-[11px] md:text-xs text-slate-500">
                    No appointments scheduled for this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDailyAppointments.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => handleSelectAppointment(app)}
                      className={cn(
                        "bg-white rounded-xl border p-3 cursor-pointer transition-colors",
                        selectedAppointment?.id === app.id
                          ? "border-emerald-300 bg-emerald-50/30"
                          : "border-slate-200 hover:border-emerald-200",
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-xs md:text-sm shrink-0">
                          {app.patientName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs md:text-sm font-bold text-slate-900 truncate">
                                {app.patientName}
                              </p>
                              {app.title && (
                                <p className="text-[10px] md:text-[11px] text-slate-500 truncate">
                                  {app.title}
                                </p>
                              )}
                            </div>
                            <StatusBadge status={app.status} />
                          </div>
                          <div className="flex items-center gap-2 text-[10px] md:text-[11px] text-slate-500 tabular-nums mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatTime(app.startTime)}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="capitalize">{app.type}</span>
                            {app.type === "follow-up" && (
                              <span className="text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                Follow-up
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Details Sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedAppointment && (
          <AppointmentDetailsSheet
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onEdit={handleEditAppointment}
            onCancel={(id) => setShowCancelModal(id)}
          />
        )}
      </AnimatePresence>

      {/* ─── Modals ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <AppointmentModal
            key="add-modal"
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveAppointment}
            centerId={center?.id}
            userId={user?.id}
            initialData={selectedAppointment || undefined}
          />
        )}

        {showCancelModal && (
          <CancelReasonModal
            key="cancel-modal"
            onConfirm={handleCancel}
            onClose={() => setShowCancelModal(null)}
            reason={cancelReason}
            setReason={setCancelReason}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Appointment Modal ──────────────────────────────────────────────

function AppointmentModal({
  onClose,
  onSave,
  centerId,
  userId,
  initialData,
}: any) {
  const [formData, setFormData] = useState({
    patientId: initialData?.patientId || "",
    patientName: initialData?.patientName || "",
    patientPhone: initialData?.patientPhone || "",
    title: initialData?.title || "",
    type: initialData?.type || "checkup",
    startTime: initialData?.startTime
      ? new Date(initialData.startTime).toISOString().slice(0, 16)
      : "",
    notes: initialData?.notes || "",
    reminders: initialData?.reminders || { email: false, sms: false },
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: "",
    phone: "",
    email: "",
  });
  const [addingPatient, setAddingPatient] = useState(false);

  useEffect(() => {
    if (!centerId || !userId) return;
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await fetch(`/api/centers/${centerId}/patients`, {
          headers: { "x-user-id": userId },
        });
        const data = await res.json();
        if (data.success) {
          setPatients(data.data);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, [centerId, userId]);

  const filteredPatients = patients.filter((p: any) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.fullName.trim()) return;
    setAddingPatient(true);
    try {
      const res = await fetch(`/api/centers/${centerId}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(newPatient),
      });
      const data = await res.json();
      if (data.success) {
        const created = data.data;
        setPatients((prev) => [...prev, created]);
        setFormData({
          ...formData,
          patientId: created.id,
          patientName: created.fullName,
          patientPhone: created.phone || "",
        });
        setSearchTerm(created.fullName);
        setShowAddPatientForm(false);
        setNewPatient({ fullName: "", phone: "", email: "" });
        setValidationError("");
      } else {
        alert(data.error || "Failed to create patient");
      }
    } catch (error) {
      alert("Error creating patient");
    } finally {
      setAddingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    if (!formData.patientId) {
      setValidationError("Please select a patient from the list");
      return;
    }
    if (!formData.startTime) {
      setValidationError("Start time is required");
      return;
    }
    setLoading(true);

    const isoStartTime = new Date(formData.startTime).toISOString();
    const isoEndTime = new Date(
      new Date(formData.startTime).getTime() + 30 * 60000,
    ).toISOString();

    const dataToSave = {
      ...formData,
      startTime: isoStartTime,
      endTime: isoEndTime,
    };

    await onSave(dataToSave);
    setLoading(false);
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
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
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
            {initialData ? "Edit Appointment" : "New Appointment"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Form body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5"
        >
          {/* Patient */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Patient <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient…"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowAddPatientForm(!showAddPatientForm)}
                className="px-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1 text-xs text-slate-600 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {showPatientDropdown &&
              !showAddPatientForm &&
              filteredPatients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          patientId: p.id,
                          patientName: p.fullName,
                          patientPhone: p.phone || "",
                        });
                        setSearchTerm(p.fullName);
                        setShowPatientDropdown(false);
                        setValidationError("");
                      }}
                    >
                      <p className="text-xs font-semibold text-slate-800">
                        {p.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500">{p.phone}</p>
                    </div>
                  ))}
                </div>
              )}

            {showAddPatientForm && (
              <div className="mt-2 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                  New Patient
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full name *"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
                    value={newPatient.fullName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, fullName: e.target.value })
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/40"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPatientForm(false);
                        setNewPatient({ fullName: "", phone: "", email: "" });
                      }}
                      className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreatePatient}
                      disabled={addingPatient || !newPatient.fullName.trim()}
                      className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {addingPatient ? "Creating…" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Type + Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Type <span className="text-rose-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 outline-none truncate"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
              >
                <option value="checkup">Checkup</option>
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="procedure">Procedure</option>
                <option value="test">Test</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Routine checkup"
              />
            </div>
          </div>

          {/* Start time */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Start Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              step="1800"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 outline-none tabular-nums"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              End time auto-set to 30 minutes later.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes…"
            />
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
              Reminders
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: {
                        ...formData.reminders,
                        email: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-emerald-600 w-3.5 h-3.5"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders.sms}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminders: {
                        ...formData.reminders,
                        sms: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-emerald-600 w-3.5 h-3.5"
                />
                SMS
              </label>
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[11px] text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {validationError}
            </div>
          )}
        </form>

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
            type="submit"
            form=""
            onClick={handleSubmit as any}
            disabled={loading}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {initialData ? "Update" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Cancel Reason Modal ────────────────────────────────────────────

function CancelReasonModal({ onConfirm, onClose, reason, setReason }: any) {
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
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="p-4 sm:p-5">
          <h3
            className={cn(
              "text-base sm:text-lg font-bold text-slate-900 mb-2",
              bebasNeue.className,
            )}
          >
            Cancel Appointment
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mb-3">
            Please provide a reason for cancellation.
          </p>
          <textarea
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation (required)"
            autoFocus
          />
        </div>

        <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors"
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="w-full sm:flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}
