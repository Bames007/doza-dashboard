"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Loader2, User, Check } from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { useDashboard } from "../../DashboardContext";
import { getAvatarColor } from "@/app/utils/utils";

interface RequisitionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export function RequisitionModal({
  open,
  onClose,
  onSave,
}: RequisitionModalProps) {
  const { user, center } = useDashboard();

  const [type, setType] = useState<string>("clinical");
  const [priority, setPriority] = useState<string>("routine");
  const [patientName, setPatientName] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { name: "", strength: "", quantity: 1, unit: "tablet", form: "Tablet" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Staff selection
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedStaffName, setSelectedStaffName] = useState<string>("");
  const [staffSearch, setStaffSearch] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const showItems = type !== "clinical";

  useEffect(() => {
    if (open && center?.id) {
      const fetchStaff = async () => {
        setLoadingStaff(true);
        try {
          const res = await fetch(`/api/centers/${center.id}/staff`, {
            headers: { "x-user-id": user.id },
          });
          const result = await res.json();
          if (result.success) setStaffList(result.data);
        } catch (err) {
          console.error("Failed to load staff", err);
        } finally {
          setLoadingStaff(false);
        }
      };
      fetchStaff();
    }
  }, [open, center, user.id]);

  const filteredStaff = staffList.filter((s) =>
    s.personalInfo.fullName.toLowerCase().includes(staffSearch.toLowerCase()),
  );

  const handleSelectStaff = (staff: any) => {
    setSelectedStaffId(staff.id);
    setSelectedStaffName(staff.personalInfo.fullName);
    setStaffSearch(
      staff.personalInfo.fullName + " (" + staff.professional.role + ")",
    );
    setIsStaffDropdownOpen(false);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { name: "", strength: "", quantity: 1, unit: "tablet", form: "Tablet" },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (showItems && items.some((item) => !item.name.trim())) {
      alert("Please fill in all item names");
      return;
    }

    let itemsToSend;
    if (showItems) {
      itemsToSend = items.map((item) => ({
        name: item.name.trim(),
        strength: item.strength || "",
        form: item.form || "Tablet",
        quantity: Number(item.quantity),
        unit: item.unit || "unit",
      }));
    } else {
      itemsToSend = [
        {
          name: "Clinical Consultation",
          strength: "",
          form: "Service",
          quantity: 1,
          unit: "session",
        },
      ];
    }

    const payload: any = {
      type,
      priority,
      clinicalNotes: clinicalNotes || undefined,
      items: itemsToSend,
      ...(selectedStaffId && {
        assignedToUserId: selectedStaffId,
        assignedToName: selectedStaffName,
        approverRole: staffList.find((s) => s.id === selectedStaffId)
          ?.professional?.role,
      }),
    };

    if (type === "clinical" && patientName.trim()) {
      payload.patientName = patientName.trim();
    }

    setSubmitting(true);
    try {
      await onSave(payload);
      // Reset form
      setType("clinical");
      setPriority("routine");
      setPatientName("");
      setClinicalNotes("");
      setSelectedStaffId("");
      setSelectedStaffName("");
      setStaffSearch("");
      setItems([
        { name: "", strength: "", quantity: 1, unit: "tablet", form: "Tablet" },
      ]);
      onClose();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar for mobile */}
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
                New Requisition
              </h2>
              <button
                onClick={onClose}
                disabled={submitting}
                className="p-1.5 -m-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
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
              {/* Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Request Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition truncate"
                    required
                  >
                    <option value="clinical">Clinical (Patient)</option>
                    <option value="pharmacy-restock">Pharmacy Restock</option>
                    <option value="lab">Lab Reagents</option>
                    <option value="ward-supply">Ward Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Priority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 outline-none transition truncate"
                    required
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Immediate)</option>
                  </select>
                </div>
              </div>

              {/* Staff selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Assign to Staff (optional)
                </label>
                <div className="relative">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500 transition">
                    <User className="w-3.5 h-3.5 text-slate-400 ml-3 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search staff by name…"
                      value={staffSearch}
                      onChange={(e) => {
                        setStaffSearch(e.target.value);
                        setIsStaffDropdownOpen(true);
                      }}
                      onFocus={() => setIsStaffDropdownOpen(true)}
                      className="flex-1 px-3 py-2.5 bg-transparent outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    {selectedStaffId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffId("");
                          setSelectedStaffName("");
                          setStaffSearch("");
                        }}
                        className="pr-3 text-slate-400 hover:text-slate-600 shrink-0"
                        aria-label="Clear"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isStaffDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {loadingStaff ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                          Loading…
                        </div>
                      ) : filteredStaff.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No staff found
                        </div>
                      ) : (
                        filteredStaff.map((staff) => {
                          const color = getAvatarColor(
                            staff.personalInfo.fullName,
                          );
                          const initials = staff.personalInfo.fullName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2);
                          return (
                            <button
                              key={staff.id}
                              type="button"
                              onClick={() => handleSelectStaff(staff)}
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2.5 border-b border-slate-100 last:border-0"
                            >
                              <div
                                className={cn(
                                  "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                                  color,
                                )}
                              >
                                {initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate">
                                  {staff.personalInfo.fullName}
                                </div>
                                <div className="text-[9px] text-slate-500 truncate">
                                  {staff.professional.role}
                                </div>
                              </div>
                              {selectedStaffId === staff.id && (
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedStaffId && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0",
                        getAvatarColor(selectedStaffName),
                      )}
                    >
                      {selectedStaffName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <span className="truncate">
                      Assigned to{" "}
                      <strong className="font-bold">{selectedStaffName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Patient name — clinical only */}
              {type === "clinical" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Patient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition"
                  />
                </div>
              )}

              {/* Clinical Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Clinical Notes / Justification
                </label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for request, diagnosis, or special instructions…"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition resize-none"
                />
              </div>

              {/* Items */}
              {showItems && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Items{" "}
                      <span className="text-slate-400 font-semibold">
                        ({items.length})
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 rounded-xl p-2.5 border border-slate-200"
                      >
                        {/* Item header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            Item {index + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 -m-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Item fields */}
                        <div className="space-y-2">
                          {/* Name — full width */}
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                              Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              placeholder="Drug or supply name"
                              className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                              required
                            />
                          </div>

                          {/* Strength + Qty + Unit */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Strength
                              </label>
                              <input
                                value={item.strength || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "strength",
                                    e.target.value,
                                  )
                                }
                                placeholder="500mg"
                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Qty
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 tabular-nums focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                                Unit
                              </label>
                              <input
                                value={item.unit || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                placeholder="tab"
                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-[11px] text-rose-700">
                  <span className="shrink-0">⚠️</span>
                  <span className="truncate">{errorMessage}</span>
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-full sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="requisition-form"
                onClick={handleSubmit as any}
                disabled={submitting}
                className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {submitting ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
