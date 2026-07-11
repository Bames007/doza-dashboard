"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<any>; // Accept any return type
}

export default function AddPatientModal({
  isOpen,
  onClose,
  onSave,
}: AddPatientModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    gender: "Male" as const,
    chiefComplaint: "",
    acuity: "3" as const,
    status: "waiting" as const,
    arrivalTime: new Date().toISOString().slice(0, 16),
    needICU: false,
    needVentilator: false,
  });
  const [loading, setLoading] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert age to dateOfBirth (approximate)
      const age = parseInt(formData.age);
      const today = new Date();
      const birthYear = today.getFullYear() - age;
      const birthMonth = today.getMonth();
      const birthDay = today.getDate();
      const dateOfBirth = new Date(birthYear, birthMonth, birthDay)
        .toISOString()
        .split("T")[0];

      const payload = {
        fullName: formData.fullName,
        dateOfBirth,
        gender: formData.gender,
        chiefComplaint: formData.chiefComplaint,
        acuity: formData.acuity,
        status: formData.status,
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        needICU: formData.needICU,
        needVentilator: formData.needVentilator,
        patientType: "outpatient", // default
        email: "",
        phone: "",
        address: "",
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2
            id="modal-title"
            className={cn(
              "text-2xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Add Emergency Patient
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Close modal"
            type="button"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="patient-name"
              className="block text-sm font-medium text-slate-700"
            >
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="patient-name"
              ref={firstInputRef}
              type="text"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
              placeholder="e.g., John Doe"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="patient-age"
                className="block text-sm font-medium text-slate-700"
              >
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                id="patient-age"
                type="number"
                required
                min="0"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition"
                placeholder="e.g., 45"
              />
            </div>
            <div>
              <label
                htmlFor="patient-gender"
                className="block text-sm font-medium text-slate-700"
              >
                Gender
              </label>
              <select
                id="patient-gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white transition"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="chief-complaint"
              className="block text-sm font-medium text-slate-700"
            >
              Chief Complaint <span className="text-rose-500">*</span>
            </label>
            <input
              id="chief-complaint"
              type="text"
              required
              value={formData.chiefComplaint}
              onChange={(e) =>
                setFormData({ ...formData, chiefComplaint: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
              placeholder="e.g., Chest pain, Shortness of breath"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="patient-acuity"
                className="block text-sm font-medium text-slate-700"
              >
                Acuity
              </label>
              <select
                id="patient-acuity"
                value={formData.acuity}
                onChange={(e) =>
                  setFormData({ ...formData, acuity: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white transition"
              >
                <option value="1">1 – Immediate (Critical)</option>
                <option value="2">2 – Emergency</option>
                <option value="3">3 – Urgent</option>
                <option value="4">4 – Semi‑urgent</option>
                <option value="5">5 – Non‑urgent</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="arrival-time"
                className="block text-sm font-medium text-slate-700"
              >
                Arrival Time
              </label>
              <input
                id="arrival-time"
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalTime: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition"
              />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="sr-only">Special care requirements</legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.needICU}
                  onChange={(e) =>
                    setFormData({ ...formData, needICU: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2"
                />
                Need ICU
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.needVentilator}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      needVentilator: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-2"
                />
                Need Ventilator
              </label>
            </div>
          </fieldset>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Add Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
