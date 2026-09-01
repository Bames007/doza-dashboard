// app/center/dashboard/components/patient_panel/PatientList.tsx

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronRight, Users, ArrowUpDown } from "lucide-react";
import { cn } from "@/app/utils/utils";
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../utils/helpers";
import type { ExtendedPatient } from "../../types/hospital_patient";

interface PatientListProps {
  patients: ExtendedPatient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

type FilterType = "all" | "ongoing" | "pending_discharge" | "discharged";
type SortType = "newest" | "oldest" | "name" | "type";

const statusOrder: Record<string, number> = {
  active: 0,
  discharge_pending: 1,
  discharged: 2,
};

export default function PatientList({
  patients,
  selectedPatientId,
  onSelectPatient,
  searchTerm,
  setSearchTerm,
}: PatientListProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  const filteredAndSorted = useMemo(() => {
    let filtered = patients;

    switch (filter) {
      case "ongoing":
        filtered = filtered.filter((p) => p.status === "active");
        break;
      case "pending_discharge":
        filtered = filtered.filter((p) => p.status === "discharge_pending");
        break;
      case "discharged":
        filtered = filtered.filter((p) => p.status === "discharged");
        break;
      default:
        break;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.fullName.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          p.email?.toLowerCase().includes(term) ||
          p.phone?.includes(term),
      );
    }

    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case "type":
        filtered.sort((a, b) =>
          (a.patientType || "").localeCompare(b.patientType || ""),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.registeredAt).getTime() -
            new Date(b.registeredAt).getTime(),
        );
        break;
      case "newest":
      default:
        filtered.sort((a, b) => {
          const statusDiff =
            (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          if (statusDiff !== 0) return statusDiff;
          return (
            new Date(b.registeredAt).getTime() -
            new Date(a.registeredAt).getTime()
          );
        });
        break;
    }

    return filtered;
  }, [patients, filter, sortBy, searchTerm]);

  const counts = {
    all: patients.length,
    ongoing: patients.filter((p) => p.status === "active").length,
    pending_discharge: patients.filter((p) => p.status === "discharge_pending")
      .length,
    discharged: patients.filter((p) => p.status === "discharged").length,
  };

  const sortLabels: Record<SortType, string> = {
    newest: "Newest First",
    oldest: "Oldest First",
    name: "A–Z",
    type: "By Type",
  };

  // ─── Update menu position on open ──────────────────────────────
  useEffect(() => {
    if (showSortMenu && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showSortMenu]);

  // ─── Close menu on outside click ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showSortMenu &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(e.target as Node)
      ) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu]);

  return (
    <div className="lg:col-span-1 bg-white flex flex-col rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Patients
          </span>
          <span className="flex items-center justify-center bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-inset ring-slate-200">
            {filteredAndSorted.length}
          </span>
        </div>

        {/* ─── Sort Button ──────────────────────────────────────── */}
        <button
          ref={sortButtonRef}
          onClick={() => setShowSortMenu((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          aria-label="Sort patients"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500">{sortLabels[sortBy]}</span>
        </button>
      </div>

      {/* ─── Filter Tabs ────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-100 bg-white/50 backdrop-blur-sm flex gap-1 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "ongoing", label: "Ongoing" },
          { key: "pending_discharge", label: "Pending" },
          { key: "discharged", label: "Discharged" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
              filter === key
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
            )}
          >
            {label}
            <span
              className={cn(
                "ml-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                filter === key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {counts[key as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Search ────────────────────────────────────────────── */}
      <div className="p-3 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 placeholder:text-slate-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
            aria-label="Search patients"
          />
        </div>
      </div>

      {/* ─── Patient List ───────────────────────────────────────── */}
      <div className="max-h-[550px] overflow-y-auto flex-1 divide-y divide-slate-50">
        {filteredAndSorted.length === 0 ? (
          <div className="p-8 m-4 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              No patients found
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or search
            </p>
          </div>
        ) : (
          filteredAndSorted.map((patient) => {
            const isSelected = selectedPatientId === patient.id;
            const isActive = patient.status === "active";
            const isDischargePending = patient.status === "discharge_pending";
            const isDischarged = patient.status === "discharged";
            const hasAllergies =
              patient.allergies && patient.allergies.length > 0;

            const statusLabel =
              patient.status === "discharge_pending"
                ? "Pending"
                : getStatusLabel(patient.status);

            return (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient.id)}
                className={cn(
                  "w-full relative text-left px-4 py-3.5 transition-all duration-200 group flex items-start gap-3.5 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
                  isSelected
                    ? "bg-emerald-50/50"
                    : "bg-white hover:bg-slate-50",
                  isDischarged && "opacity-60 hover:opacity-80",
                )}
                aria-current={isSelected ? "true" : undefined}
              >
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full shadow-[1px_0_4px_rgba(16,185,129,0.4)]" />
                )}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform duration-300",
                      isDischarged
                        ? "bg-slate-400"
                        : isDischargePending
                          ? "bg-amber-500"
                          : "bg-gradient-to-br from-emerald-500 to-teal-600",
                    )}
                  >
                    {patient.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={cn(
                      "absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm",
                      isActive
                        ? "bg-emerald-400"
                        : isDischargePending
                          ? "bg-amber-400 animate-pulse"
                          : "bg-slate-400",
                    )}
                  />
                  {hasAllergies && (
                    <div
                      className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-sm"
                      title="Has Allergies"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={cn(
                        "font-bold text-sm truncate transition-colors",
                        isSelected
                          ? "text-emerald-900"
                          : "text-slate-900 group-hover:text-emerald-700",
                        isDischarged && "line-through text-slate-500",
                      )}
                    >
                      {patient.fullName}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0 border",
                        getStatusColor(patient.status),
                      )}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600">
                    <span className="font-mono font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded">
                      #{patient.id.slice(-6)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span
                      className={cn(
                        "font-medium",
                        patient.patientType === "inpatient"
                          ? "text-amber-700"
                          : "text-blue-700",
                      )}
                    >
                      {patient.patientType || "OPD"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-slate-500">
                      {patient.registeredAt
                        ? formatDate(patient.registeredAt)
                        : "N/A"}
                    </span>
                  </div>
                  {hasAllergies && (
                    <div className="mt-2 flex">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        ALLERGIES NOTED
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight
                  className={cn(
                    "w-4 h-4 mt-3 shrink-0 transition-all duration-300",
                    isSelected
                      ? "text-emerald-500 translate-x-1"
                      : "text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                  )}
                />
              </button>
            );
          })
        )}
      </div>

      {/* ─── Sort Menu Portal ──────────────────────────────────── */}
      {showSortMenu &&
        createPortal(
          <div
            className="fixed bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[9999] py-1 min-w-[180px]"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            {(["newest", "oldest", "name", "type"] as SortType[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setSortBy(key);
                  setShowSortMenu(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors",
                  sortBy === key
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700",
                )}
              >
                {sortLabels[key]}
                {sortBy === key && (
                  <span className="float-right text-emerald-600">✓</span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
