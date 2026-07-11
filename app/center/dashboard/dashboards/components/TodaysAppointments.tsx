"use client";

import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

interface AppointmentItem {
  id: string;
  patientName: string;
  startTime: string; // ISO date string from API
  status: string;
}

interface TodayAppointmentsProps {
  appointments: AppointmentItem[];
  loading: boolean;
}

export default function TodayAppointments({
  appointments,
  loading,
}: TodayAppointmentsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-200 rounded-full" />
                <div>
                  <div className="h-4 w-24 bg-slate-200 rounded-lg" />
                  <div className="h-3 w-12 bg-slate-200 rounded-lg mt-1" />
                </div>
              </div>
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getStatusIcon = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "checked-in" || lower === "checked in")
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (lower === "completed")
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    if (lower === "no-show" || lower === "no show")
      return <XCircle className="w-4 h-4 text-rose-500" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  const getStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "checked-in" || lower === "checked in") {
      return {
        label: "Checked In",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
      };
    }
    if (lower === "completed") {
      return {
        label: "Completed",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
    }
    if (lower === "no-show" || lower === "no show") {
      return {
        label: "No Show",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
      };
    }
    if (lower === "scheduled") {
      return {
        label: "Scheduled",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
    }
    return {
      label: status,
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    };
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 ring-1 ring-purple-200/50">
            <Calendar className="w-5 h-5" />
          </div>
          <h3
            className={cn(
              "text-lg font-semibold text-slate-800",
              bebasNeue.className,
            )}
          >
            Today's Appointments
          </h3>
        </div>
        <span
          className={cn(
            "text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full",
            poppins.className,
          )}
        >
          {safeAppointments.length} total
        </span>
      </div>

      <div className="space-y-3">
        {safeAppointments.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-slate-400" />
            </div>
            <p className={cn("text-sm text-slate-500", poppins.className)}>
              No appointments scheduled for today
            </p>
          </div>
        ) : (
          safeAppointments.slice(0, 5).map((apt) => {
            const badge = getStatusBadge(apt.status);
            return (
              <div
                key={apt.id}
                className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-purple-200/60 hover:bg-purple-50/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {getStatusIcon(apt.status)}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium text-slate-800 truncate",
                        poppins.className,
                      )}
                    >
                      {apt.patientName}
                    </p>
                    <p
                      className={cn(
                        "text-xs text-slate-500 flex items-center gap-1.5",
                        poppins.className,
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      {formatTime(apt.startTime)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full border",
                    badge.bg,
                    badge.text,
                    badge.border,
                    "shrink-0",
                  )}
                >
                  {badge.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
