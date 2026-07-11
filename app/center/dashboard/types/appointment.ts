export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  doctorId?: string;
  doctorName?: string;
  title: string;
  type:
    | "checkup"
    | "consultation"
    | "follow-up"
    | "emergency"
    | "procedure"
    | "other";
  startTime: string; // ISO datetime
  endTime: string;
  duration: number; // minutes
  status:
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  cancellationReason?: string;
  notes?: string;
  reminders: {
    email?: boolean;
    sms?: boolean;
    sentAt?: string[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
