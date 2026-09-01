"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  User,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue } from "@/app/utils/constants";
import { useDashboard } from "../DashboardContext";
import DozaOTPConfirmModal from "./DozaOTPConfirmModal";

interface DozaUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string | null;
  patientStatus?: "active" | "discharged" | "not_linked";
  displayStatus?: "active" | "discharged" | "not_linked";
  patientId?: string | null;
  hasActiveSession?: boolean;
  hasPendingRequest?: boolean; // ✅ NEW
}

interface DozaUserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  centerId: string;
  onSessionStart?: () => void;
  onViewSession?: (patientId: string) => void;
  showPatientType?: boolean;
}

export default function DozaUserSearchModal({
  isOpen,
  onClose,
  centerId,
  onSessionStart,
  onViewSession,
  showPatientType = true,
}: DozaUserSearchModalProps) {
  const { user } = useDashboard();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DozaUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{
    userId: string;
    requestId: string;
    patientName: string;
  } | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
      setError(null);
      setSuccessMessage(null);
      setPendingRequest(null);
      setShowOtpModal(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/centers/search/users?query=${encodeURIComponent(
          query.trim(),
        )}&centerId=${centerId}`,
        {
          headers: {
            "x-user-id": user?.id || "",
            "x-user-role": user?.role || "support",
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        if (data.data.length === 0) {
          setError("No Doza users found matching your search.");
        }
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Initial request
  const handleRequestLink = async (targetUserId: string, fullName: string) => {
    setLinking(targetUserId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/request-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
            "x-user-role": user?.role || "support",
          },
          body: JSON.stringify({ userId: targetUserId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const requestId = data.data.requestId;
        setPendingRequest({
          userId: targetUserId,
          requestId,
          patientName: fullName,
        });
        setSuccessMessage(
          "Request sent! The user will receive the OTP. Now you can start the session.",
        );
        setResults(
          results.map((r) =>
            r.id === targetUserId ? { ...r, _pending: true } : r,
          ),
        );
      } else {
        setError(data.error || "Request failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLinking(null);
    }
  };

  // Resend – if already pending
  const handleResendLink = async (targetUserId: string, fullName: string) => {
    setLinking(targetUserId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/request-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
            "x-user-role": user?.role || "support",
          },
          body: JSON.stringify({ userId: targetUserId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        const requestId = data.data.requestId;
        setPendingRequest({
          userId: targetUserId,
          requestId,
          patientName: fullName,
        });
        setSuccessMessage(`New request sent to ${fullName}!`);
        setResults(
          results.map((r) =>
            r.id === targetUserId ? { ...r, _pending: true } : r,
          ),
        );
      } else {
        setError(data.error || "Resend failed");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLinking(null);
    }
  };

  const handleStartSession = async (targetUserId: string, fullName: string) => {
    setLinking(targetUserId);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `/api/centers/${centerId}/patients/${targetUserId}/start-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id || "",
            "x-user-role": user?.role || "support",
          },
        },
      );
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Session started for ${fullName}!`);
        setResults(
          results.map((r) =>
            r.id === targetUserId ? { ...r, _pending: true } : r,
          ),
        );
        if (onSessionStart) onSessionStart();
        setTimeout(() => onClose(), 1500);
      } else {
        setError(data.error || "Failed to start session");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLinking(null);
    }
  };

  const handleOpenOtpModal = () => {
    if (pendingRequest) setShowOtpModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="doza-search-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2
                id="doza-search-title"
                className={cn(
                  "text-2xl font-bold text-slate-900",
                  bebasNeue.className,
                )}
              >
                Add from Doza
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search for existing Doza users to link with your center.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors focus:ring-2 focus:ring-emerald-500"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-sm text-slate-800 placeholder:text-slate-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                  aria-label="Search Doza users"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || query.trim().length < 2}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
            </div>

            {/* Status messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start Session button for pending OTP request */}
            {pendingRequest && !showOtpModal && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Request sent to{" "}
                    <span className="font-bold">
                      {pendingRequest.patientName}
                    </span>
                  </p>
                  <p className="text-xs text-emerald-600">
                    Ask the patient for the OTP, then start the session.
                  </p>
                </div>
                <button
                  onClick={handleOpenOtpModal}
                  className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Start Session
                </button>
              </motion.div>
            )}

            {/* Results list */}
            {results.length > 0 && (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {results.map((user) => {
                  const isPending = (user as any)._pending;
                  const status =
                    user.displayStatus || user.patientStatus || "not_linked";
                  const isActive = status === "active";
                  const isDischarged = status === "discharged";
                  const isLinked = isActive || isDischarged;
                  const hasActiveSession = user.hasActiveSession || false;
                  const hasPendingRequest = user.hasPendingRequest || false;

                  return (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/60 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 truncate">
                              {user.fullName}
                            </span>
                            {isLinked && (
                              <span
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                                  isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {isActive && hasActiveSession && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                )}
                                {isActive ? "Active" : "Discharged"}
                              </span>
                            )}
                            {hasPendingRequest && !isPending && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            {user.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </span>
                            )}
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </span>
                            )}
                            {!user.email && !user.phone && (
                              <span className="text-slate-400">No contact</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      {isPending ? (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                          Pending
                        </span>
                      ) : hasActiveSession ? (
                        <button
                          onClick={() => {
                            if (onViewSession) {
                              onViewSession(user.id);
                            } else {
                              onClose();
                            }
                          }}
                          className="px-4 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-sm font-medium transition flex items-center gap-1.5"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          View Session
                        </button>
                      ) : hasPendingRequest ? (
                        <button
                          onClick={() =>
                            handleResendLink(user.id, user.fullName)
                          }
                          disabled={linking === user.id}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                        >
                          {linking === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Resend
                        </button>
                      ) : isDischarged ? (
                        <button
                          onClick={() =>
                            handleStartSession(user.id, user.fullName)
                          }
                          disabled={linking === user.id}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                        >
                          {linking === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Re-admit
                        </button>
                      ) : isActive ? (
                        <button
                          onClick={() =>
                            handleStartSession(user.id, user.fullName)
                          }
                          disabled={linking === user.id}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          {linking === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlayCircle className="w-3.5 h-3.5" />
                          )}
                          Start Session
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleRequestLink(user.id, user.fullName)
                          }
                          disabled={linking === user.id}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                        >
                          {linking === user.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="w-3.5 h-3.5" />
                          )}
                          Request Link
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {results.length === 0 &&
              query.trim().length >= 2 &&
              !loading &&
              !error && (
                <div className="text-center text-slate-500 py-8">
                  <User className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium">No Doza users found</p>
                  <p className="text-sm text-slate-400">
                    Try a different search term or check your spelling.
                  </p>
                </div>
              )}
          </div>
        </motion.div>
      </div>

      {/* OTP confirmation modal */}
      {pendingRequest && (
        <DozaOTPConfirmModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          centerId={centerId}
          patientId={pendingRequest.userId}
          requestId={pendingRequest.requestId}
          patientName={pendingRequest.patientName}
          medicId={user?.id || ""}
          medicRole={user?.role || "support"}
          onSuccess={() => {
            if (onSessionStart) onSessionStart();
            setSuccessMessage("Session started successfully!");
            setPendingRequest(null);
            setShowOtpModal(false);
            setTimeout(() => onClose(), 2000);
          }}
          showPatientType={showPatientType}
        />
      )}
    </>
  );
}
