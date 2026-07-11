"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  User,
  Building2,
  Mail,
  Crown,
  ChevronRight,
  Save,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/constants/constants";

interface SettingsSection {
  title: string;
  icon: React.ElementType;
  items: Array<{
    label: string;
    description?: string;
    action?: string;
    danger?: boolean;
  }>;
}

// ------------------------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------------------------
export default function SettingsPanel() {
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Mock settings sections – replace with real data from API
  const settingsSections: SettingsSection[] = [
    {
      title: "Profile & Account",
      icon: User,
      items: [
        {
          label: "Personal Information",
          description: "Update your name, email, phone",
        },
        { label: "Change Password", description: "Secure your account" },
        {
          label: "Two-Factor Authentication",
          description: "Add an extra layer of security",
        },
      ],
    },
    {
      title: "Center Management",
      icon: Building2,
      items: [
        {
          label: "Center Information",
          description: "Name, address, contact details",
        },
        { label: "Operating Hours", description: "Set your daily schedule" },
        {
          label: "Staff Management",
          description: "Add or remove staff members",
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Email Notifications",
          description: "Receive updates via email",
        },
        {
          label: "SMS Alerts",
          description: "Get important alerts on your phone",
        },
        {
          label: "Push Notifications",
          description: "Real-time in-app notifications",
        },
      ],
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      items: [
        { label: "Data Sharing", description: "Control what data is shared" },
        { label: "Session Management", description: "View active sessions" },
        { label: "Audit Logs", description: "Review account activity" },
      ],
    },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsDirty(false);
  };

  const handleItemClick = (item: any) => {
    // Handle navigation or modal opening
    console.log("Clicked:", item.label);
    setIsDirty(true);
  };

  // ----------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-40 pt-6",
        poppins.className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 md:px-6"
      >
        {/* --- HEADER --- */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
              System Preferences
            </span>
          </div>
          <h1
            className={cn(
              "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
              bebasNeue.className,
            )}
          >
            Center <span className="text-emerald-600">Settings</span>
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Manage your center preferences and team configurations
          </p>
        </header>

        {/* --- SUBSCRIPTION / MEMBERSHIP CARD (Enhanced Premium Look) --- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-6 md:p-8 text-white shadow-2xl overflow-hidden group mb-10"
        >
          {/* Background glow */}
          <div className="absolute -right-12 -bottom-12 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl transition-all group-hover:bg-emerald-500/30 group-hover:scale-110 duration-700" />
          <div className="absolute -left-12 -top-12 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex gap-5 items-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[28px] flex items-center justify-center border border-white/15 shadow-inner shadow-white/5">
                <Crown className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-0.5 flex items-center gap-2">
                  Active Plan
                </p>
                <h3
                  className={cn(
                    "text-3xl md:text-4xl leading-none",
                    bebasNeue.className,
                  )}
                >
                  Premium Suite
                </h3>
                <p className="text-emerald-200/70 text-sm mt-1.5">
                  Full access to all center features
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full md:w-auto bg-white text-slate-900 px-7 py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-[0.15em] hover:bg-emerald-50 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-black/20"
            >
              Manage Plan <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.section>

        {/* --- SETTINGS SECTIONS --- */}
        <div className="space-y-6">
          {settingsSections.map((section, index) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index + 0.15, duration: 0.4 }}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center gap-3.5 mb-6">
                <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl text-emerald-600 shadow-sm shadow-emerald-200/20">
                  <section.icon size={20} strokeWidth={2} />
                </div>
                <h2
                  className={cn(
                    "text-xl md:text-2xl text-slate-800 font-semibold tracking-tight",
                    bebasNeue.className,
                  )}
                >
                  {section.title}
                </h2>
              </div>

              <div className="space-y-3">
                {section.items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl cursor-pointer",
                      "hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200/60 transition-all group",
                      item.danger &&
                        "hover:bg-rose-50/60 hover:border-rose-200/60",
                    )}
                  >
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold text-slate-800",
                          item.danger && "text-rose-700",
                        )}
                      >
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight
                      size={18}
                      className={cn(
                        "text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all",
                        item.danger &&
                          "text-rose-400 group-hover:text-rose-600",
                      )}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* --- DANGER ZONE (Enhanced) --- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-6 bg-white rounded-3xl border-2 border-rose-200/60 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500">
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
            <h2
              className={cn(
                "text-xl md:text-2xl text-rose-700 font-semibold tracking-tight",
                bebasNeue.className,
              )}
            >
              Danger Zone
            </h2>
          </div>
          <div
            onClick={() =>
              handleItemClick({ label: "Delete Center Account", danger: true })
            }
            className="flex items-center justify-between p-4 bg-rose-50/40 rounded-2xl cursor-pointer hover:bg-rose-100/60 transition-all border border-transparent hover:border-rose-300/60 group"
          >
            <div>
              <p className="text-sm font-bold text-rose-700">
                Delete Center Account
              </p>
              <p className="text-xs text-rose-600/70 mt-0.5">
                Permanently remove all data – this action cannot be undone.
              </p>
            </div>
            <ArrowRight
              size={18}
              className="text-rose-400 group-hover:translate-x-1 group-hover:text-rose-700 transition-all"
            />
          </div>
        </motion.section>

        {/* --- FLOATING SAVE BUTTON (Improved) --- */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed bottom-10 left-0 right-0 px-4 z-[60] pointer-events-none"
            >
              <div className="max-w-md mx-auto pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-[28px] shadow-2xl shadow-slate-400/30 hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center gap-4 group"
                >
                  {isSaving ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-black uppercase tracking-[0.25em]">
                        Save Changes
                      </span>
                      <Save className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
