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
        // Also send the staff's role as approverRole (optional)
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
      // Reset
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80"
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2
                className={cn(
                  "text-2xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                New Requisition
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                disabled={submitting}
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={cn(
                      "block text-xs font-medium text-slate-700 mb-1",
                      poppins.className,
                    )}
                  >
                    Request Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    required
                  >
                    <option value="clinical">Clinical (Patient Request)</option>
                    <option value="pharmacy-restock">Pharmacy Restock</option>
                    <option value="lab">Lab Reagents</option>
                    <option value="ward-supply">Ward Supplies</option>
                  </select>
                </div>
                <div>
                  <label
                    className={cn(
                      "block text-xs font-medium text-slate-700 mb-1",
                      poppins.className,
                    )}
                  >
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
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
                <label
                  className={cn(
                    "block text-xs font-medium text-slate-700 mb-1",
                    poppins.className,
                  )}
                >
                  Assign to Specific Staff (optional)
                </label>
                <div className="relative">
                  <div className="flex items-center border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition">
                    <User className="w-4 h-4 text-slate-400 ml-3" />
                    <input
                      type="text"
                      placeholder="Search staff by name..."
                      value={staffSearch}
                      onChange={(e) => {
                        setStaffSearch(e.target.value);
                        setIsStaffDropdownOpen(true);
                      }}
                      onFocus={() => setIsStaffDropdownOpen(true)}
                      className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
                    />
                    {selectedStaffId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffId("");
                          setSelectedStaffName("");
                          setStaffSearch("");
                        }}
                        className="pr-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isStaffDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {loadingStaff ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                          Loading staff...
                        </div>
                      ) : filteredStaff.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          No staff members found
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
                              className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-100 last:border-0"
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                  color,
                                )}
                              >
                                {initials}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-800">
                                  {staff.personalInfo.fullName}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {staff.professional.role}
                                </div>
                              </div>
                              {selectedStaffId === staff.id && (
                                <Check className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {selectedStaffId && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
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
                    <span>
                      Assigned to <strong>{selectedStaffName}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Patient name – clinical only */}
              {type === "clinical" && (
                <div>
                  <label
                    className={cn(
                      "block text-xs font-medium text-slate-700 mb-1",
                      poppins.className,
                    )}
                  >
                    Patient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g., John Doe"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  />
                </div>
              )}

              {/* Clinical Notes */}
              <div>
                <label
                  className={cn(
                    "block text-xs font-medium text-slate-700 mb-1",
                    poppins.className,
                  )}
                >
                  Clinical Notes / Justification
                </label>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows={2}
                  placeholder="Reason for request, diagnosis, or any special instructions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Items */}
              {showItems && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4
                      className={cn(
                        "text-sm font-semibold text-slate-700",
                        poppins.className,
                      )}
                    >
                      Items
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 focus:ring-2 focus:ring-emerald-500 rounded"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500">
                              Name *
                            </label>
                            <input
                              value={item.name}
                              onChange={(e) =>
                                handleItemChange(index, "name", e.target.value)
                              }
                              placeholder="Drug/supply name"
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500">
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
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500">
                              Quantity
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
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] font-medium text-slate-500">
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
                                placeholder="tablet"
                                className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-rose-600 hover:text-rose-800 transition disabled:opacity-40"
                              disabled={items.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm">
                  ❌ {errorMessage}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Submit Request
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
