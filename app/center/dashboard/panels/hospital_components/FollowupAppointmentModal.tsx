// app/center/dashboard/components/patient_panel/FollowUpAppointmentModal.tsx

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins } from "@/app/utils/constants";

interface FollowUpAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientDozaUserId?: string; // ✅ NEW – pass the patient's Doza user ID if available
  centerId: string;
  user: any;
  onSuccess: () => void;
}

interface Appointment {
  id: string;
  patientName: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

// Helper: format time as HH:MM
const formatTime = (iso: string) => {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

// Generate all 30‑minute slots from 8:00 to 18:00 (6 PM)
const generateSlots = (): string[] => {
  const slots: string[] = [];
  const startHour = 8;
  const endHour = 18;
  const interval = 30;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (m === 30 && h === endHour - 1) break;
      const hourStr = String(h).padStart(2, "0");
      const minStr = String(m).padStart(2, "0");
      slots.push(`${hourStr}:${minStr}`);
    }
  }
  return slots;
};

// Check if a slot is occupied by an appointment
const isSlotOccupied = (slot: string, appointments: Appointment[]): boolean => {
  return appointments.some((app) => {
    const start = new Date(app.startTime);
    const h = String(start.getHours()).padStart(2, "0");
    const m = String(start.getMinutes()).padStart(2, "0");
    return `${h}:${m}` === slot;
  });
};

// Get the appointment that occupies a given slot (if any)
const getAppointmentForSlot = (
  slot: string,
  appointments: Appointment[],
): Appointment | null => {
  return (
    appointments.find((app) => {
      const start = new Date(app.startTime);
      const h = String(start.getHours()).padStart(2, "0");
      const m = String(start.getMinutes()).padStart(2, "0");
      return `${h}:${m}` === slot;
    }) || null
  );
};

export default function FollowUpAppointmentModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientDozaUserId,
  centerId,
  user,
  onSuccess,
}: FollowUpAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [fetching, setFetching] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Compute minimum date (tomorrow)
  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }, []);

  // All possible slots (8:00 – 18:00)
  const allSlots = useMemo(() => generateSlots(), []);

  // Fetch appointments for the selected date
  const fetchAppointments = async (selectedDate: string) => {
    if (!centerId || !user?.id || !selectedDate) return;
    setFetching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/appointments?date=${selectedDate}`,
        { headers: { "x-user-id": user.id } },
      );
      const data = await res.json();
      if (data.success) {
        setAppointments(Array.isArray(data.data) ? data.data : []);
      } else {
        setAppointments([]);
        setError(data.error || "Could not load appointments.");
      }
    } catch (err: any) {
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally {
      setFetching(false);
    }
  };

  // When date changes, fetch appointments and reset selection
  useEffect(() => {
    if (date) {
      fetchAppointments(date);
      setSelectedSlot(null);
      setTime("");
    } else {
      setAppointments([]);
      setSelectedSlot(null);
      setTime("");
    }
  }, [date]);

  // Set default date to tomorrow when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
      setDate(minDate);
      setReason("");
      setNotes("");
      setError(null);
      setSelectedSlot(null);
      setTime("");
    }
  }, [isOpen, minDate]);

  const handleSlotSelect = (slot: string) => {
    if (isSlotOccupied(slot, appointments)) return;
    setSelectedSlot(slot);
    setTime(slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError("Please select a date and time.");
      return;
    }
    setLoading(true);
    setError(null);

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    const payload: any = {
      patientId,
      patientName,
      type: "follow-up",
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: 30,
      notes: notes || reason || "",
      reminders: { email: false, sms: false },
      createdBy: user.id,
      status: "scheduled",
    };

    // ✅ Include Doza user ID if available
    if (patientDozaUserId) {
      payload.dozaUserId = patientDozaUserId;
    }

    try {
      const res = await fetch(`/api/centers/${centerId}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to schedule follow‑up");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="followup-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            id="followup-modal-title"
            className={cn(
              "text-xl font-bold text-slate-900",
              poppins.className,
            )}
          >
            Schedule Follow‑up – {patientName}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            aria-label="Close follow‑up modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Date Picker */}
          <div>
            <label
              htmlFor="followup-date"
              className="block text-sm font-medium text-slate-700"
            >
              Date *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="followup-date"
                ref={firstInputRef}
                type="date"
                value={date}
                min={minDate}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full pl-9 px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Earliest date: {new Date(minDate).toLocaleDateString()}
            </p>
          </div>

          {/* Available Slots */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Time Slots
            </label>
            {fetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="ml-2 text-sm text-slate-500">
                  Loading slots...
                </span>
              </div>
            ) : (
              <>
                {date && (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {allSlots.map((slot) => {
                      const occupied = isSlotOccupied(slot, appointments);
                      const appointment = getAppointmentForSlot(
                        slot,
                        appointments,
                      );
                      const isSelected = selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          disabled={occupied}
                          className={cn(
                            "px-3 py-2 rounded-lg text-sm font-medium transition-all relative group",
                            occupied
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                              : isSelected
                                ? "bg-emerald-600 text-white ring-2 ring-emerald-500 ring-offset-2"
                                : "bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-700",
                          )}
                          title={
                            occupied && appointment
                              ? `Occupied by ${appointment.patientName}`
                              : ""
                          }
                        >
                          {slot}
                          {occupied && (
                            <span className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-600">
                              <User className="w-3 h-3 mr-1" />
                              {appointment?.patientName}
                            </span>
                          )}
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 inline ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {date &&
                  allSlots.every((slot) =>
                    isSlotOccupied(slot, appointments),
                  ) && (
                    <p className="text-sm text-amber-600 mt-2">
                      All slots are booked for this date. Please choose another
                      date.
                    </p>
                  )}
              </>
            )}
          </div>

          {/* List of existing appointments for the selected date (booked) */}
          {date && appointments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Booked Appointments ({appointments.length})
              </label>
              <div className="max-h-24 overflow-y-auto space-y-1 text-sm">
                {appointments.map((app) => (
                  <div
                    key={app.id}
                    className="flex justify-between items-center p-1.5 bg-slate-50 rounded border border-slate-200 text-slate-600"
                  >
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(app.startTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {app.patientName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label
              htmlFor="followup-reason"
              className="block text-sm font-medium text-slate-700"
            >
              Reason
            </label>
            <input
              id="followup-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Post‑operative check"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="followup-notes"
              className="block text-sm font-medium text-slate-700"
            >
              Notes
            </label>
            <textarea
              id="followup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-500 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Any additional instructions..."
            />
          </div>

          {error && (
            <div
              className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              role="alert"
            >
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedSlot}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Scheduling...</span>
              </>
            ) : (
              "Schedule Follow‑up"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
