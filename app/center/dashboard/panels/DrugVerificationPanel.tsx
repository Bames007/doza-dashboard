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

// ─── Skeleton ────────────────────────────────────────────────────────

const PanelSkeleton = () => (
  <div className="pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto animate-pulse">
    <div className="mb-3 md:mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-5 w-0.5 bg-slate-200 rounded-full" />
        <div className="h-3 w-32 bg-slate-200 rounded" />
        <div className="h-4 w-20 bg-slate-200 rounded-full" />
      </div>
      <div className="h-7 w-56 bg-slate-200 rounded mb-1" />
      <div className="h-3 w-64 bg-slate-100 rounded" />
    </div>
    <div className="flex gap-1.5 mb-3 md:mb-5 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 w-24 bg-slate-200 rounded-lg shrink-0" />
      ))}
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 p-4 h-64" />
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
      shortName: "Verify",
      icon: Shield,
    },
    {
      id: "information" as const,
      name: "Drug Information",
      shortName: "Info",
      icon: FileText,
    },
    {
      id: "points" as const,
      name: "My Points",
      shortName: "Points",
      icon: Award,
    },
    {
      id: "history" as const,
      name: "History",
      shortName: "History",
      icon: TrendingUp,
    },
  ];

  // ─── Loading ──────────────────────────────────────────────────────

  if (dashboardLoading || (loading && !error)) {
    return <PanelSkeleton />;
  }

  // ─── Not a Medic ──────────────────────────────────────────────────

  if (!isMedic && !error) {
    return (
      <div
        className={cn(
          "pb-24 pt-6 px-3 md:px-6 max-w-3xl mx-auto",
          poppins.className,
        )}
      >
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-10 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 md:w-7 md:h-7 text-amber-600" />
          </div>
          <h2
            className={cn(
              "text-lg md:text-2xl font-bold text-slate-900 mb-2",
              bebasNeue.className,
            )}
          >
            Register as a Doza Medic
          </h2>
          <p className="text-[11px] md:text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
            To access the drug verification system and start earning points, you
            need to register as a Doza medic.
          </p>
          <button
            onClick={handleRegisterMedic}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] md:text-xs uppercase tracking-wide px-5 md:px-6 py-2.5 md:py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Register as Doza Medic
          </button>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className={cn(
          "pb-24 pt-6 px-3 md:px-6 max-w-3xl mx-auto",
          poppins.className,
        )}
      >
        <div className="bg-white rounded-2xl border border-rose-200 p-6 md:p-10 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 md:w-7 md:h-7 text-rose-600" />
          </div>
          <h3
            className={cn(
              "text-lg md:text-xl font-bold text-slate-900 mb-2",
              bebasNeue.className,
            )}
          >
            Something went wrong
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 mb-5 max-w-md mx-auto leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 md:px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={handleRegisterMedic}
              className="px-4 md:px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wide transition-colors"
            >
              Register as Medic
            </button>
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
        "pb-24 pt-3 md:pt-6 px-3 md:px-6 max-w-7xl mx-auto",
        poppins.className,
      )}
    >
      {/* ─── Compact header ─────────────────────────────────── */}
      <header className="mb-3 md:mb-5">
        {/* Row 1: eyebrow + badge + refresh */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-5 w-0.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[10px] md:text-[11px] font-bold text-emerald-600 uppercase tracking-[0.15em] truncate">
              Drug Verification
            </span>
            {isMedic && (
              <span className="inline-flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                <Shield className="w-2.5 h-2.5" />
                Verified
              </span>
            )}
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 md:p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shrink-0"
            aria-label="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        {/* Row 2: title */}
        <h1
          className={cn(
            "text-2xl md:text-4xl text-slate-900 leading-none tracking-tight mb-1",
            bebasNeue.className,
          )}
        >
          Drug Verification
        </h1>
        <p className="text-[11px] md:text-xs text-slate-500">
          Contribute to the drug database and earn rewards
        </p>

        {/* Row 3: points summary — compact pills */}
        <div className="mt-3 md:mt-4 grid grid-cols-3 gap-2 md:gap-2.5">
          <PointsPill
            label="Points"
            value={safeUserPoints.totalPoints}
            tone="emerald"
            icon={Award}
          />
          <PointsPill
            label="Verified"
            value={safeUserPoints.verifiedDrugs}
            tone="emerald"
            icon={Shield}
          />
          <PointsPill
            label="Pending"
            value={safeUserPoints.pendingReview}
            tone="slate"
            icon={RefreshCw}
          />
        </div>

        {/* Level line */}
        <p className="text-[10px] md:text-[11px] text-slate-500 mt-2">
          Level:{" "}
          <span className="font-bold text-emerald-700">
            {safeUserPoints.level || "Beginner"}
          </span>
        </p>
      </header>

      {/* ─── Tabs (horizontal scroll) ───────────────────────── */}
      <div className="-mx-3 px-3 md:mx-0 md:px-0 mb-3 md:mb-4 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[11px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap",
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
              )}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
  );
};

// ─── Points Pill ─────────────────────────────────────────────────────

function PointsPill({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate";
  icon: any;
}) {
  const toneStyles: Record<string, { bg: string; iconBg: string }> = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    slate: {
      bg: "bg-slate-50 border-slate-200 text-slate-700",
      iconBg: "bg-slate-100 text-slate-600",
    },
  };
  const style = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2.5 md:px-3 py-2 rounded-xl border",
        style.bg,
      )}
    >
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate">
          {label}
        </p>
        <p
          className={cn(
            "text-lg md:text-xl font-bold tabular-nums leading-none mt-0.5",
            bebasNeue.className,
          )}
        >
          {value.toLocaleString()}
        </p>
      </div>
      <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export default DrugVerificationPanel;
