"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { bebasNeue, poppins } from "@/app/utils/constants";
import { cn } from "@/app/utils/utils";

interface NoteModalProps {
  patientId: string;
  type: "doctor" | "nurse";
  noteContent: string;
  setNoteContent: (content: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function NoteModal({
  patientId,
  type,
  noteContent,
  setNoteContent,
  onSave,
  onClose,
}: NoteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/80"
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 flex items-center justify-between">
          <h3
            className={cn(
              "text-lg font-bold text-slate-800",
              bebasNeue.className,
            )}
          >
            Add {type === "doctor" ? "Doctor's" : "Nursing"} Note
          </h3>
          <button
            onClick={onClose}
            className="p-2 -m-1 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={5}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 text-sm text-slate-800 placeholder:text-slate-400"
            placeholder={`Write your ${type} note here...`}
          />
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200/80 mt-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!noteContent.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-200/50 transition-all text-sm font-medium disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
