"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";
import { usePatients } from "../dashboards/hooks/usePatients";
import { mutate, useSWRConfig } from "swr";
import {
  X,
  RefreshCw,
  Users,
  Activity,
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/app/utils/utils";

// Helper: format JSON for display
const prettyJSON = (obj: any) => JSON.stringify(obj, null, 2);

export default function DebugPanel() {
  const { center, user } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [activeSessionData, setActiveSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<
    "patients" | "sessions" | "firebase"
  >("patients");

  const { patients, refetch } = usePatients(center?.id, user?.id);
  const { cache } = useSWRConfig();

  // Fetch patients directly from API to compare with SWR
  const fetchDirectPatients = async () => {
    if (!center?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/centers/${center.id}/patients`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      setPatientData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active sessions directly
  const fetchActiveSessions = async () => {
    if (!center?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/centers/${center.id}/active-sessions`, {
        headers: { "x-user-id": user?.id || "" },
      });
      const data = await res.json();
      setActiveSessionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh: trigger SWR revalidation and direct fetch
  const handleRefresh = async () => {
    await mutate(`/api/centers/${center?.id}/patients`);
    await mutate(`/api/centers/${center?.id}/patients?emergency`);
    await refetch();
    await fetchDirectPatients();
    await fetchActiveSessions();
  };

  // Toggle debug panel with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        if (!isOpen) {
          fetchDirectPatients();
          fetchActiveSessions();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Auto‑fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchDirectPatients();
      fetchActiveSessions();
    }
  }, [isOpen]);

  if (!isOpen) {
    // Floating trigger button (always visible)
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
        title="Open Debug Panel (Ctrl+Shift+D)"
      >
        <Database className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Debug Panel
            <span className="text-xs font-normal text-slate-500 ml-2">
              (Ctrl+Shift+D to toggle)
            </span>
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 gap-1 bg-slate-50/50">
          {[
            { id: "patients", label: "Patients", icon: Users },
            { id: "sessions", label: "Active Sessions", icon: Activity },
            { id: "firebase", label: "Firebase Check", icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                selectedTab === tab.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 my-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", loading && "animate-spin")}
            />
            {loading ? "Refreshing..." : "Refresh All"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {selectedTab === "patients" && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">
                  Patients from SWR hook ({patients.length})
                </h4>
                <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg overflow-auto max-h-[300px] border border-slate-100">
                  {prettyJSON(patients)}
                </pre>
              </div>
              {patientData && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Direct API Response
                  </h4>
                  <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg overflow-auto max-h-[300px] border border-slate-100">
                    {prettyJSON(patientData)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {selectedTab === "sessions" && (
            <div className="space-y-4">
              {activeSessionData && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Active Sessions (from API)
                  </h4>
                  <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg overflow-auto max-h-[300px] border border-slate-100">
                    {prettyJSON(activeSessionData)}
                  </pre>
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">
                  SWR Cache Keys
                </h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  {Array.from((cache as any).keys()).map((key: unknown) => (
                    <li
                      key={key as string}
                      className="font-mono bg-white px-2 py-1 rounded border border-slate-100"
                    >
                      {key as string}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {selectedTab === "firebase" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Firebase Check
                </p>
                <p className="mt-1 text-xs">
                  To inspect the actual Firebase data, open the Firebase Console
                  and check:
                  <br />
                  <code className="bg-amber-100 px-1 py-0.5 rounded">
                    doza_centers/{center?.id}/patients/
                  </code>
                </p>
                <p className="mt-2 text-xs">
                  Look for the patient’s <strong>status</strong> field. It
                  should be{" "}
                  <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                    "active"
                  </span>
                  .
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-2">
                  Current Center Info
                </h4>
                <pre className="text-xs text-slate-700 bg-white p-3 rounded-lg overflow-auto max-h-[200px] border border-slate-100">
                  {prettyJSON({
                    centerId: center?.id,
                    centerName: center?.centerName,
                    userId: user?.id,
                    userRole: user?.role,
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
