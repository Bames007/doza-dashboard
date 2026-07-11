"use client";

import { Patient } from "../../hooks/usePatients";
import {
  Clock,
  User,
  Bed,
  AlertCircle,
  Edit,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/app/utils/utils";

interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
}

export default function PatientList({
  patients,
  loading,
  onEdit,
  onDelete,
  onUpdate,
}: PatientListProps) {
  if (loading) {
    return (
      <div
        className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm animate-pulse"
        aria-label="Loading patient list"
      >
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-3 w-48 bg-slate-200 rounded" />
              </div>
              <div className="w-16 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const acuityColors: Record<string, string> = {
    "1": "bg-rose-600 text-white ring-rose-200",
    "2": "bg-orange-500 text-white ring-orange-200",
    "3": "bg-amber-500 text-white ring-amber-200",
    "4": "bg-emerald-500 text-white ring-emerald-200",
    "5": "bg-blue-500 text-white ring-blue-200",
  };

  const statusColors: Record<string, string> = {
    waiting: "bg-amber-100 text-amber-800 border-amber-200",
    "in-treatment": "bg-blue-100 text-blue-800 border-blue-200",
    discharged: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const formatAge = (dob: string) => {
    if (!dob) return "N/A";
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return `${age}y`;
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      role="table"
      aria-label="Emergency patient list"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Patient
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Acuity
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden sm:table-cell"
              >
                Complaint
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden md:table-cell"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden lg:table-cell"
              >
                Wait Time
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider hidden xl:table-cell"
              >
                Bed
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="font-medium">No patients in emergency</p>
                    <p className="text-sm text-slate-400">
                      Click "Add Patient" to register a new emergency case.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              patients.map((p) => {
                const waitTime =
                  p.triageTime && p.arrivalTime
                    ? Math.round(
                        (new Date(p.triageTime).getTime() -
                          new Date(p.arrivalTime).getTime()) /
                          60000,
                      )
                    : null;
                const statusKey = p.status as keyof typeof statusColors;
                const acuityKey = (p.acuity ||
                  "3") as keyof typeof acuityColors;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {p.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            {p.fullName}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{formatAge(p.dateOfBirth)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span>{p.gender || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ring-2 ring-offset-2",
                          acuityColors[acuityKey],
                        )}
                      >
                        {p.acuity || "3"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 hidden sm:table-cell max-w-[150px] truncate">
                      {p.chiefComplaint || "N/A"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                          statusColors[statusKey] ||
                            "bg-slate-100 text-slate-700 border-slate-200",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            p.status === "waiting"
                              ? "bg-amber-500"
                              : p.status === "in-treatment"
                                ? "bg-blue-500"
                                : p.status === "discharged"
                                  ? "bg-emerald-500"
                                  : "bg-slate-400",
                          )}
                        />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {waitTime !== null ? (
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {waitTime} min
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {p.bedAssigned ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          <Bed className="w-3.5 h-3.5 text-slate-500" />
                          {p.bedAssigned}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(p)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                          aria-label={`Edit ${p.fullName}`}
                          title="Edit patient"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:outline-none"
                          aria-label={`Delete ${p.fullName}`}
                          title="Delete patient"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {patients.length > 0 && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
          <span>Showing {patients.length} patients</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
}
