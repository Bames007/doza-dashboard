"use client";

import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

interface DentalAppointmentsProps {
  appointments: Array<{
    id: string;
    patient: string;
    time: string;
    procedure: string;
    status:
      | "scheduled"
      | "checked-in"
      | "in-progress"
      | "completed"
      | "no-show";
    dentist: string;
  }>;
  loading: boolean;
}

export default function DentalAppointments({
  appointments,
  loading,
}: DentalAppointmentsProps) {
  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-48" />;
  }

  const statusIcon = {
    scheduled: <Clock className="w-4 h-4 text-gray-500" />,
    "checked-in": <CheckCircle className="w-4 h-4 text-green-500" />,
    "in-progress": <Clock className="w-4 h-4 text-blue-500" />,
    completed: <CheckCircle className="w-4 h-4 text-blue-500" />,
    "no-show": <XCircle className="w-4 h-4 text-red-500" />,
  };

  const statusColors = {
    scheduled: "bg-gray-100 text-gray-700",
    "checked-in": "bg-green-100 text-green-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-blue-100 text-blue-700",
    "no-show": "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">
          Today's Dental Appointments
        </h3>
      </div>
      <div className="space-y-3">
        {appointments.slice(0, 5).map((apt) => (
          <div
            key={apt.id}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <div className="mt-0.5">{statusIcon[apt.status]}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">
                  {apt.patient}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${statusColors[apt.status]}`}
                >
                  {apt.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {apt.procedure} • Dr. {apt.dentist} • {apt.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
