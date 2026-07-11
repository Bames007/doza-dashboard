"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { Patient } from "../../hooks/usePatients";

interface EditPatientModalProps {
  isOpen: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<any>; // Allow any return
}

export default function EditPatientModal({
  isOpen,
  patient,
  onClose,
  onSave,
}: EditPatientModalProps) {
  const [formData, setFormData] = useState<any>({});
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

  useEffect(() => {
    if (patient) {
      // Calculate age from dateOfBirth
      let age = "";
      if (patient.dateOfBirth) {
        const birth = new Date(patient.dateOfBirth);
        const now = new Date();
        let a = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) a--;
        age = a.toString();
      }
      setFormData({
        fullName: patient.fullName || "",
        age,
        gender: patient.gender || "Male",
        chiefComplaint: patient.chiefComplaint || "",
        acuity: patient.acuity || "3",
        status: patient.status || "waiting",
        bedAssigned: patient.bedAssigned || "",
        needICU: patient.needICU || false,
        needVentilator: patient.needVentilator || false,
        vitals: patient.vitals || {
          bp: "",
          hr: "",
          rr: "",
          o2sat: "",
          temp: "",
        },
      });
    }
  }, [patient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
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
        bedAssigned: formData.bedAssigned || undefined,
        needICU: formData.needICU,
        needVentilator: formData.needVentilator,
        vitals: {
          bp: formData.vitals.bp,
          hr: formData.vitals.hr ? parseInt(formData.vitals.hr) : undefined,
          rr: formData.vitals.rr ? parseInt(formData.vitals.rr) : undefined,
          o2sat: formData.vitals.o2sat
            ? parseInt(formData.vitals.o2sat)
            : undefined,
          temp: formData.vitals.temp
            ? parseFloat(formData.vitals.temp)
            : undefined,
        },
      };
      await onSave(patient.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2
            id="edit-modal-title"
            className={cn(
              "text-2xl font-bold text-slate-900",
              bebasNeue.className,
            )}
          >
            Edit Patient
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
              htmlFor="edit-patient-name"
              className="block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>
            <input
              id="edit-patient-name"
              ref={firstInputRef}
              type="text"
              value={formData.fullName || ""}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-patient-age"
                className="block text-sm font-medium text-slate-700"
              >
                Age
              </label>
              <input
                id="edit-patient-age"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 transition"
              />
            </div>
            <div>
              <label
                htmlFor="edit-patient-gender"
                className="block text-sm font-medium text-slate-700"
              >
                Gender
              </label>
              <select
                id="edit-patient-gender"
                value={formData.gender || "Male"}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
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
              htmlFor="edit-chief-complaint"
              className="block text-sm font-medium text-slate-700"
            >
              Chief Complaint
            </label>
            <input
              id="edit-chief-complaint"
              type="text"
              value={formData.chiefComplaint || ""}
              onChange={(e) =>
                setFormData({ ...formData, chiefComplaint: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="edit-patient-acuity"
                className="block text-sm font-medium text-slate-700"
              >
                Acuity
              </label>
              <select
                id="edit-patient-acuity"
                value={formData.acuity || "3"}
                onChange={(e) =>
                  setFormData({ ...formData, acuity: e.target.value })
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
                htmlFor="edit-patient-status"
                className="block text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="edit-patient-status"
                value={formData.status || "waiting"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 bg-white transition"
              >
                <option value="waiting">Waiting</option>
                <option value="in-treatment">In Treatment</option>
                <option value="discharged">Discharged</option>
              </select>
            </div>
          </div>
          <div>
            <label
              htmlFor="edit-bed-assigned"
              className="block text-sm font-medium text-slate-700"
            >
              Bed Assigned
            </label>
            <input
              id="edit-bed-assigned"
              type="text"
              value={formData.bedAssigned || ""}
              onChange={(e) =>
                setFormData({ ...formData, bedAssigned: e.target.value })
              }
              placeholder="e.g., B-12"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 transition"
            />
          </div>
          <fieldset className="border-t border-slate-200 pt-3">
            <legend className="text-sm font-semibold text-slate-700">
              Vital Signs
            </legend>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label
                  htmlFor="edit-bp"
                  className="block text-xs text-slate-600"
                >
                  BP
                </label>
                <input
                  id="edit-bp"
                  type="text"
                  value={formData.vitals?.bp || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        bp: e.target.value,
                      },
                    })
                  }
                  placeholder="120/80"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-hr"
                  className="block text-xs text-slate-600"
                >
                  HR
                </label>
                <input
                  id="edit-hr"
                  type="number"
                  value={formData.vitals?.hr || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        hr: e.target.value,
                      },
                    })
                  }
                  placeholder="72"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-rr"
                  className="block text-xs text-slate-600"
                >
                  RR
                </label>
                <input
                  id="edit-rr"
                  type="number"
                  value={formData.vitals?.rr || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        rr: e.target.value,
                      },
                    })
                  }
                  placeholder="16"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-o2sat"
                  className="block text-xs text-slate-600"
                >
                  O₂ Sat
                </label>
                <input
                  id="edit-o2sat"
                  type="number"
                  value={formData.vitals?.o2sat || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vitals: {
                        ...formData.vitals,
                        o2sat: e.target.value,
                      },
                    })
                  }
                  placeholder="98"
                  className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="sr-only">Special care requirements</legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.needICU || false}
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
                  checked={formData.needVentilator || false}
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
              {loading ? "Saving..." : "Update Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
