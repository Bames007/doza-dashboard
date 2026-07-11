// app/center/dashboard/panels/DrugVerificationPanel.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";
import {
  AlertCircle,
  FileText,
  Award,
  TrendingUp,
  Shield,
  Loader2,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import logger from "@/app/utils/logger";
import DrugAuthenticityTab from "../components/drug-verification/DrugAuthenticityTab";
import DrugInformationTab from "../components/drug-verification/DrugInformationTab";
import UserPointsDashboard from "../components/drug-verification/UserPointsDashboard";
import VerificationHistory from "../components/drug-verification/VerificationHistory";

// ─── Types ────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  points: number;
}

interface UserPoints {
  totalPoints: number;
  verifiedDrugs: number;
  pendingReview: number;
  level: string;
  achievements: Achievement[];
  lastUpdated: string;
}

interface MedicVerifyResponse {
  success: boolean;
  isMedic: boolean;
  isRegistered?: boolean;
  status?: string;
  points?: {
    totalPoints: number;
    verifiedDrugs: number;
    pendingReview: number;
    level: string;
    achievements: string[] | Achievement[];
    lastUpdated: string;
  };
  error?: string;
}

// ─── Skeleton Components ─────────────────────────────────────────────

const HeaderSkeleton = () => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 animate-pulse">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-1 rounded-full bg-slate-200" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-5 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-10 w-64 bg-slate-200 rounded-lg" />
      <div className="h-5 w-80 bg-slate-100 rounded mt-2" />
    </div>
    <div className="h-16 w-48 bg-slate-200 rounded-xl" />
  </div>
);

const TabsSkeleton = () => (
  <div className="flex gap-1 bg-slate-100 p-1 rounded-lg animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-10 flex-1 bg-slate-200 rounded-md" />
    ))}
  </div>
);

const ContentSkeleton = () => (
  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 animate-pulse">
    <div className="space-y-4">
      <div className="h-6 w-48 bg-slate-200 rounded" />
      <div className="h-4 w-full bg-slate-100 rounded" />
      <div className="h-4 w-3/4 bg-slate-100 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-slate-100 rounded" />
        <div className="h-20 bg-slate-100 rounded" />
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────

const DrugVerificationPanel: React.FC = () => {
  const {
    user,
    center,
    isLoading: dashboardLoading,
    isSessionValid,
  } = useDashboard();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "authenticity" | "information" | "points" | "history"
  >("authenticity");
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMedic, setIsMedic] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkMedicStatusAndFetchPoints = useCallback(async () => {
    if (!user?.email) {
      logger.warn("Cannot check medic status: missing user email");
      setError("User email is required");
      setIsMedic(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      logger.debug({ email: user.email }, "Checking medic status for email");

      const response = await fetch(
        `/api/medics/verify?email=${encodeURIComponent(user.email)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: MedicVerifyResponse = await response.json();

      if (data.success && data.isMedic) {
        logger.info({ userId: user.id }, "User is a verified medic");

        setIsMedic(true);

        // Transform achievements to the correct shape
        const rawAchievements = data.points?.achievements || [];
        const achievements: Achievement[] = rawAchievements.map(
          (ach, index) => {
            if (typeof ach === "string") {
              return {
                id: `ach-${index}`,
                name: ach,
                description: "Earned for drug verification contributions",
                earnedAt: new Date().toISOString(),
                points: 10,
              };
            }
            return {
              id: ach.id || `ach-${index}`,
              name: ach.name || `Achievement ${index + 1}`,
              description:
                ach.description || "Earned for verification contributions",
              earnedAt: ach.earnedAt || new Date().toISOString(),
              points: ach.points || 10,
            };
          },
        );

        setUserPoints({
          totalPoints: data.points?.totalPoints || 0,
          verifiedDrugs: data.points?.verifiedDrugs || 0,
          pendingReview: data.points?.pendingReview || 0,
          level: data.points?.level || "Beginner",
          achievements,
          lastUpdated: data.points?.lastUpdated || new Date().toISOString(),
        });
      } else {
        setIsMedic(false);
        setUserPoints({
          totalPoints: 0,
          verifiedDrugs: 0,
          pendingReview: 0,
          level: "Beginner",
          achievements: [],
          lastUpdated: new Date().toISOString(),
        });

        if (data.isRegistered && !data.isMedic) {
          const statusMsg = data.status ? ` (${data.status})` : "";
          logger.info("User is registered but not yet a medic");
          setError(
            `Your medic account is ${data.status || "pending"}. Please wait for approval.`,
          );
        } else {
          logger.debug({ email: user.email }, "User is not a medic");
        }
      }
    } catch (error: any) {
      logger.error("Error checking medic status", error);
      setError("Unable to check medic status. Please try again later.");
      setIsMedic(false);
      setUserPoints({
        totalPoints: 0,
        verifiedDrugs: 0,
        pendingReview: 0,
        level: "Beginner",
        achievements: [],
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    if (dashboardLoading) return;

    if (!isSessionValid) {
      logger.warn("Session expired or invalid");
      setError("Session expired. Please log in again.");
      setLoading(false);
      setIsMedic(false);
      setUserPoints({
        totalPoints: 0,
        verifiedDrugs: 0,
        pendingReview: 0,
        level: "Beginner",
        achievements: [],
        lastUpdated: new Date().toISOString(),
      });
      return;
    }

    if (!user?.id) {
      logger.warn("No user ID found");
      setError("User not found. Please log in again.");
      setLoading(false);
      setIsMedic(false);
      setUserPoints({
        totalPoints: 0,
        verifiedDrugs: 0,
        pendingReview: 0,
        level: "Beginner",
        achievements: [],
        lastUpdated: new Date().toISOString(),
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkMedicStatusAndFetchPoints();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    dashboardLoading,
    isSessionValid,
    user?.id,
    checkMedicStatusAndFetchPoints,
  ]);

  const handleRetry = () => {
    setError(null);
    checkMedicStatusAndFetchPoints();
  };

  const handleRegisterMedic = () => {
    logger.debug("Navigating to medic registration page");
    router.push("/medic");
  };

  const handleRefresh = () => {
    checkMedicStatusAndFetchPoints();
  };

  const tabs = [
    {
      id: "authenticity" as const,
      name: "Drug Authenticity",
      icon: Shield,
      description: "Verify drug authenticity",
    },
    {
      id: "information" as const,
      name: "Drug Information",
      icon: FileText,
      description: "Create comprehensive drug info",
    },
    {
      id: "points" as const,
      name: "My Points",
      icon: Award,
      description: "Track verification points",
    },
    {
      id: "history" as const,
      name: "History",
      icon: TrendingUp,
      description: "View verification history",
    },
  ];

  // ─── Loading State ──────────────────────────────────────────────────

  if (dashboardLoading || (loading && !error)) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8 px-4 sm:px-0",
          poppins.className,
        )}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <HeaderSkeleton />
          <TabsSkeleton />
          <ContentSkeleton />
        </div>
      </div>
    );
  }

  // ─── Not a Medic State ─────────────────────────────────────────────

  if (!isMedic && !error) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8 px-4 sm:px-0",
          poppins.className,
        )}
      >
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-amber-200/50">
              <UserPlus className="w-12 h-12 text-amber-600" />
            </div>
            <h2
              className={cn(
                "text-2xl md:text-3xl font-bold text-slate-800 mb-3",
                bebasNeue.className,
              )}
            >
              Register as a Doza Medic
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              To access the drug verification system and start earning points,
              you need to register as a Doza medic.
            </p>
            <button
              onClick={handleRegisterMedic}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-emerald-200/50 transition-all inline-flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Register as Doza Medic
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className={cn(
          "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8 px-4 sm:px-0",
          poppins.className,
        )}
      >
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-rose-200/80 shadow-sm p-8 md:p-12 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-rose-200/50">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h3
              className={cn(
                "text-2xl font-bold text-slate-800 mb-3",
                bebasNeue.className,
              )}
            >
              Something went wrong
            </h3>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={handleRegisterMedic}
                className="px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-all"
              >
                Register as Medic
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────

  const safeUserPoints: UserPoints = userPoints || {
    totalPoints: 0,
    verifiedDrugs: 0,
    pendingReview: 0,
    level: "Beginner",
    achievements: [],
    lastUpdated: new Date().toISOString(),
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-[#F8FAFC] pb-20 pt-4 md:pt-8 px-4 sm:px-0",
        poppins.className,
      )}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ─── Header ────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
                Drug Verification
              </span>
              {isMedic && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Verified Medic
                </span>
              )}
            </div>
            <h1
              className={cn(
                "text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-[1.1] tracking-tight",
                bebasNeue.className,
              )}
            >
              Drug Verification System
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md">
              Contribute to the drug database and earn rewards
            </p>
          </div>

          {/* Points Summary */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm min-w-[160px] flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-md shadow-emerald-200/50">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                Total Points
              </p>
              <p
                className={cn(
                  "text-2xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                {safeUserPoints.totalPoints?.toLocaleString() || "0"}
              </p>
              <p className="text-[10px] text-slate-500">
                Level: {safeUserPoints.level || "Beginner"}
              </p>
            </div>
          </div>
        </header>

        {/* ─── Tabs ──────────────────────────────────────────────────── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/60 shadow-sm">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200/50"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">
                    {tab.id === "authenticity"
                      ? "Verify"
                      : tab.id === "information"
                        ? "Info"
                        : tab.id === "points"
                          ? "Points"
                          : "History"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Content ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {activeTab === "authenticity" && user && (
            <DrugAuthenticityTab user={user} center={center} />
          )}

          {activeTab === "information" && user && (
            <DrugInformationTab
              user={user}
              center={center}
              onVerificationComplete={handleRefresh}
            />
          )}

          {activeTab === "points" && (
            <UserPointsDashboard points={safeUserPoints} />
          )}

          {activeTab === "history" && user && (
            <VerificationHistory medicId={user.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DrugVerificationPanel;
