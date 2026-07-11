"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  User,
  Stethoscope,
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
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { poppins, bebasNeue } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";
import { useAppointments } from "../dashboards/hooks/useAppointments";
import type { Appointment } from "../types/appointment";

// Helper to format time
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Helper to format month-year
const formatMonthYear = (date: Date) =>
  date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

// Skeleton components
function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-200">
        {[8, 9, 10, 11, 12, 13, 14].map((hour) => (
          <div key={hour} className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-20 p-2 bg-slate-50/50 border-b sm:border-b-0 sm:border-r border-slate-200 flex items-center justify-center">
              <div className="h-4 w-14 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="flex-1 p-2 space-y-2 min-h-[60px]">
              <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="bg-slate-50 p-2 text-center">
            <div className="h-4 w-8 mx-auto bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {Array.from({ length: 35 }).map((_, idx) => (
          <div key={idx} className="bg-white p-2 h-24">
            <div className="h-4 w-6 bg-slate-200 rounded animate-pulse" />
            <div className="mt-1 h-3 w-8 bg-slate-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Status badge component with better contrast
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; icon: any; label: string }> = {
    scheduled: {
      color: "bg-blue-100 text-blue-700",
      icon: Clock,
      label: "Scheduled",
    },
    confirmed: {
      color: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle,
      label: "Confirmed",
    },
    "checked-in": {
      color: "bg-purple-100 text-purple-700",
      icon: User,
      label: "Checked In",
    },
    "in-progress": {
      color: "bg-amber-100 text-amber-700",
      icon: Stethoscope,
      label: "In Progress",
    },
    completed: {
      color: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle,
      label: "Completed",
    },
    cancelled: {
      color: "bg-rose-100 text-rose-700",
      icon: XCircle,
      label: "Cancelled",
    },
    "no-show": {
      color: "bg-slate-100 text-slate-700",
      icon: AlertCircle,
      label: "No Show",
    },
  };
  const { color, icon: Icon, label } = config[status] || config.scheduled;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full",
        color,
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Hook to fetch appointments for a whole month
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Daily appointments
  const { appointments: dailyAppointments, loading: dailyLoading } =
    useAppointments({ date: selectedDate });

  // Monthly appointments
  const monthString = `${selectedMonth.getFullYear()}-${String(
    selectedMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  const {
    appointments: monthAppointments,
    loading: monthLoading,
    error: monthError,
  } = useMonthAppointments(center?.id, monthString, user?.id);

  // Filter daily appointments
  const filteredDailyAppointments = useMemo(() => {
    if (filterStatus === "all") return dailyAppointments;
    return dailyAppointments.filter((a) => a.status === filterStatus);
  }, [dailyAppointments, filterStatus]);

  // Time slots for calendar view
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
    return slots;
  }, [filteredDailyAppointments]);

  // Month grid
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

  // Map month appointments by date
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

  // Handlers
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
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
      } else {
        alert(data.error || "Failed to cancel appointment");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while cancelling");
    } finally {
      setShowCancelModal(null);
      setCancelReason("");
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
      } else {
        alert(result.error || "Failed to create appointment");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create appointment");
    }
  };

  const loading = view === "month" ? monthLoading : dailyLoading;

  // Determine which skeleton to show
  const renderSkeleton = () => {
    if (view === "calendar") return <CalendarSkeleton />;
    if (view === "month") return <MonthSkeleton />;
    return <ListSkeleton />;
  };

  return (
    <div className={cn("space-y-6 pb-20 px-4 sm:px-0", poppins.className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Appointments
          </h1>
          <p className="text-sm text-slate-500">
            Schedule and manage patient appointments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200/80 overflow-hidden">
            {["calendar", "month", "list"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200",
                  view === v
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50",
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center gap-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>
      </div>

      {/* Navigation & Filters */}
      {view === "calendar" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                onClick={handlePreviousDay}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <button
                onClick={handleNextDay}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 bg-white"
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
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-lg font-semibold text-slate-800">
              {formatMonthYear(selectedMonth)}
            </h2>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          {monthError && (
            <p className="text-sm text-rose-600 mt-2">
              Error loading month appointments:{" "}
              {monthError.message || monthError}
            </p>
          )}
        </div>
      )}

      {view === "list" && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                className="flex-1 sm:flex-none px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 bg-white"
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
          </div>
        </div>
      )}

      {/* View Content */}
      {loading ? (
        renderSkeleton()
      ) : (
        <>
          {view === "calendar" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="divide-y divide-slate-200 max-h-[600px] overflow-y-auto">
                {timeSlots.map(({ hour, apps }) => (
                  <div
                    key={hour}
                    className="flex flex-col sm:flex-row hover:bg-emerald-50/30 transition-colors duration-150"
                  >
                    <div className="w-full sm:w-20 p-2 text-sm text-slate-600 border-b sm:border-b-0 sm:border-r border-slate-200 bg-slate-50/50 sm:bg-transparent flex items-center justify-center font-medium">
                      {hour % 12 === 0 ? 12 : hour % 12}:00{" "}
                      {hour < 12 ? "AM" : "PM"}
                    </div>
                    <div className="flex-1 p-2 space-y-1.5 min-h-[60px]">
                      {apps.length === 0 ? (
                        <span className="text-xs text-slate-400 italic block text-center sm:text-left">
                          — No appointments —
                        </span>
                      ) : (
                        apps.map((app) => (
                          <div
                            key={app.id}
                            onClick={() => {
                              setSelectedAppointment(app);
                              setShowDetailsModal(true);
                            }}
                            className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl cursor-pointer shadow-sm hover:shadow-md hover:border-emerald-300 transition-all"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-1">
                              <div>
                                <p className="font-medium text-slate-800 text-sm">
                                  {app.patientName}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {app.title}
                                </p>
                              </div>
                              <StatusBadge status={app.status} />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              <time dateTime={app.startTime}>
                                {formatTime(app.startTime)}
                              </time>{" "}
                              –{" "}
                              <time dateTime={app.endTime}>
                                {formatTime(app.endTime)}
                              </time>
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="bg-slate-50/80 p-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-200">
                {monthGrid.flat().map((date, idx) => {
                  if (!date) {
                    return (
                      <div key={`empty-${idx}`} className="bg-white p-2 h-24" />
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
                        if (hasAppointments) {
                          setSelectedDate(dateStr);
                          setView("calendar");
                        }
                      }}
                      className={cn(
                        "bg-white p-2 h-24 cursor-pointer hover:bg-emerald-50/50 transition flex flex-col",
                        hasAppointments ? "font-medium" : "",
                        isToday ? "bg-emerald-50/30" : "",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm text-slate-700",
                          isToday && "font-bold text-emerald-600",
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {hasAppointments && (
                        <div className="mt-1 flex items-center gap-1 text-emerald-600">
                          <Circle className="w-2 h-2 fill-emerald-600" />
                          <span className="text-xs">
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              {filteredDailyAppointments.length === 0 ? (
                <div className="p-12 text-center">
                  <CalendarIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No appointments scheduled for this day.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredDailyAppointments.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedAppointment(app);
                        setShowDetailsModal(true);
                      }}
                      className="p-4 hover:bg-emerald-50/30 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {app.patientName}
                          </p>
                          <p className="text-sm text-slate-600 truncate">
                            {app.title}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 ml-13 sm:ml-0 justify-between sm:justify-end w-full sm:w-auto">
                        <span className="text-sm text-slate-600 whitespace-nowrap">
                          <time dateTime={app.startTime}>
                            {formatTime(app.startTime)}
                          </time>
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AppointmentModal
            key="add-modal"
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveAppointment}
            centerId={center?.id}
            userId={user?.id}
          />
        )}

        {showDetailsModal && selectedAppointment && (
          <AppointmentDetailsModal
            key="details-modal"
            appointment={selectedAppointment}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedAppointment(null);
            }}
            onEdit={() => {
              setShowAddModal(true);
            }}
            onCancel={() => setShowCancelModal(selectedAppointment.id)}
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

// Full Appointment Modal (with inline patient creation)
function AppointmentModal({ onClose, onSave, centerId, userId }: any) {
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    patientPhone: "",
    title: "",
    type: "checkup",
    startTime: "",
    notes: "",
    reminders: { email: false, sms: false },
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

  const getEndTime = (start: string) => {
    if (!start) return "";
    const end = new Date(new Date(start).getTime() + 30 * 60000);
    return end.toISOString().slice(0, 16);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value;
    setFormData({ ...formData, startTime: start });
  };

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
    const dataToSave = {
      ...formData,
      endTime: getEndTime(formData.startTime),
    };
    await onSave(dataToSave);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2
            className={cn(
              "text-xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            New Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Patient *
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
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
                className="px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1 text-sm text-slate-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
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
                      className="p-2 hover:bg-emerald-50 cursor-pointer transition-colors"
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
                      <p className="font-medium text-slate-800">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.phone}</p>
                    </div>
                  ))}
                </div>
              )}

            {showAddPatientForm && (
              <div className="mt-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                <h4 className="text-sm font-medium text-slate-700 mb-2">
                  New Patient
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Full name *"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400"
                    value={newPatient.fullName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, fullName: e.target.value })
                    }
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400"
                    value={newPatient.email}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, email: e.target.value })
                    }
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPatientForm(false);
                        setNewPatient({ fullName: "", phone: "", email: "" });
                      }}
                      className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreatePatient}
                      disabled={addingPatient || !newPatient.fullName.trim()}
                      className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {addingPatient ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {formData.patientName && !formData.patientId && (
              <p className="text-xs text-amber-600 mt-1">
                Please select a patient from the list
              </p>
            )}
          </div>

          {/* Appointment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type *
              </label>
              <select
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Routine checkup"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              step="1800"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800"
              value={formData.startTime}
              onChange={handleStartTimeChange}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              End time automatically set to 30 minutes later.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reminders
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
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
                  className="rounded focus:ring-emerald-500"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
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
                  className="rounded focus:ring-emerald-500"
                />
                SMS
              </label>
            </div>
          </div>

          {validationError && (
            <p className="text-sm text-rose-600">{validationError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Create Appointment
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Details Modal
function AppointmentDetailsModal({
  appointment,
  onClose,
  onEdit,
  onCancel,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2
            className={cn(
              "text-xl font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">Patient</p>
              <p className="font-medium text-slate-800">
                {appointment.patientName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Type</p>
              <p className="capitalize text-slate-700">{appointment.type}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <StatusBadge status={appointment.status} />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500">Time</p>
              <p className="text-slate-700">
                <time dateTime={appointment.startTime}>
                  {new Date(appointment.startTime).toLocaleString()}
                </time>{" "}
                –{" "}
                <time dateTime={appointment.endTime}>
                  {formatTime(appointment.endTime)}
                </time>
              </p>
            </div>
            {appointment.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Notes</p>
                <p className="text-sm text-slate-700">{appointment.notes}</p>
              </div>
            )}
            {appointment.cancellationReason && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Cancellation Reason</p>
                <p className="text-sm text-rose-600">
                  {appointment.cancellationReason}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-slate-200/80 p-4 flex flex-col sm:flex-row justify-end gap-3">
          {appointment.status !== "cancelled" &&
            appointment.status !== "completed" && (
              <>
                <button
                  onClick={onEdit}
                  className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Cancel Reason Modal
function CancelReasonModal({ onConfirm, onClose, reason, setReason }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80"
      >
        <h3
          className={cn(
            "text-lg font-bold text-slate-800 mb-4",
            bebasNeue.className,
          )}
        >
          Cancel Appointment
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Please provide a reason for cancellation:
        </p>
        <textarea
          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for cancellation (required)"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Confirm Cancellation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
