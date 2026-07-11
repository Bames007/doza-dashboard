// app/center/dashboard/components/drug-verification/UserPointsDashboard.tsx

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Award,
  TrendingUp,
  Star,
  Target,
  Trophy,
  Zap,
  Shield,
  Crown,
  BarChart3,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/app/utils/utils";
import { bebasNeue, poppins } from "@/app/utils/constants";
import logger from "@/app/utils/logger";

interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  points: number;
}

interface UserPointsDashboardProps {
  points: {
    totalPoints: number;
    verifiedDrugs: number;
    pendingReview: number;
    level: string;
    achievements: Achievement[];
    lastUpdated: string;
  };
}

const UserPointsDashboard: React.FC<UserPointsDashboardProps> = ({
  points,
}) => {
  // Safety defaults
  const safePoints = {
    totalPoints: points?.totalPoints || 0,
    verifiedDrugs: points?.verifiedDrugs || 0,
    pendingReview: points?.pendingReview || 0,
    level: points?.level || "Beginner",
    achievements: points?.achievements || [],
    lastUpdated: points?.lastUpdated || new Date().toISOString(),
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "Master Pharmacist":
        return <Crown className="w-6 h-6 text-yellow-600" />;
      case "Senior Pharmacist":
        return <Trophy className="w-6 h-6 text-purple-600" />;
      case "Expert":
        return <Shield className="w-6 h-6 text-blue-600" />;
      case "Advanced":
        return <Zap className="w-6 h-6 text-green-600" />;
      case "Intermediate":
        return <Target className="w-6 h-6 text-cyan-600" />;
      default:
        return <Star className="w-6 h-6 text-slate-400" />;
    }
  };

  const getNextLevel = (currentLevel: string) => {
    const levels = [
      "Beginner",
      "Intermediate",
      "Advanced",
      "Expert",
      "Senior Pharmacist",
      "Master Pharmacist",
    ];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const getPointsForNextLevel = (currentLevel: string) => {
    const levelPoints: Record<string, number> = {
      Beginner: 10,
      Intermediate: 50,
      Advanced: 100,
      Expert: 250,
      "Senior Pharmacist": 500,
      "Master Pharmacist": 1000,
    };
    return levelPoints[currentLevel] || 0;
  };

  const nextLevel = getNextLevel(safePoints.level);
  const pointsNeeded = nextLevel
    ? Math.max(0, getPointsForNextLevel(nextLevel) - safePoints.totalPoints)
    : 0;

  const levelProgress = () => {
    if (!nextLevel) return 100;
    const currentThreshold = getPointsForNextLevel(safePoints.level);
    const nextThreshold = getPointsForNextLevel(nextLevel);
    const progress =
      ((safePoints.totalPoints - currentThreshold) /
        (nextThreshold - currentThreshold)) *
      100;
    return Math.min(100, Math.max(0, progress));
  };

  const stats = [
    {
      label: "Total Points",
      value: safePoints.totalPoints,
      icon: Award,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "up",
    },
    {
      label: "Verified Drugs",
      value: safePoints.verifiedDrugs,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "up",
    },
    {
      label: "Pending Review",
      value: safePoints.pendingReview,
      icon: BarChart3,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "neutral",
    },
    {
      label: "Achievements",
      value: safePoints.achievements.length,
      icon: Trophy,
      color: "text-purple-600",
      bg: "bg-purple-50",
      trend: "up",
    },
  ];

  return (
    <div className={cn("p-4 md:p-6", poppins.className)}>
      {/* ─── Header ────────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.25em]">
              Points Dashboard
            </span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              Level {safePoints.level}
            </span>
          </div>
          <h1
            className={cn(
              "text-3xl md:text-4xl lg:text-5xl text-slate-900 leading-[1.1] tracking-tight",
              bebasNeue.className,
            )}
          >
            Verification Points
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-md">
            Track your contributions and rewards
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-200/80 shadow-sm">
          Updated: {new Date(safePoints.lastUpdated).toLocaleDateString()}
        </div>
      </header>

      {/* ─── Stats Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold text-slate-800",
                    bebasNeue.className,
                  )}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            {stat.trend !== "neutral" && (
              <div className="mt-2 flex items-center gap-1">
                {stat.trend === "up" ? (
                  <ChevronUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-rose-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    stat.trend === "up" ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {stat.trend === "up" ? "+12%" : "-5%"}
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ─── Level Progress ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border border-emerald-200/60 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            {getLevelIcon(safePoints.level)}
            <div>
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Current Level
              </h3>
              <p
                className={cn(
                  "text-2xl font-bold text-slate-800",
                  bebasNeue.className,
                )}
              >
                {safePoints.level}
              </p>
            </div>
          </div>

          {nextLevel && (
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Next Level
              </p>
              <p
                className={cn(
                  "text-xl font-bold text-emerald-600",
                  bebasNeue.className,
                )}
              >
                {nextLevel}
              </p>
            </div>
          )}
        </div>

        {nextLevel ? (
          <>
            <div className="flex justify-between text-sm text-slate-600 mb-1.5">
              <span>{safePoints.totalPoints} points</span>
              <span>{getPointsForNextLevel(nextLevel)} points needed</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress()}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {pointsNeeded} more points needed to reach {nextLevel}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg shadow-amber-200/50">
              <Crown className="w-5 h-5" />
              <span className="font-bold">Maximum Level Achieved!</span>
            </div>
            <p className="text-slate-600 mt-2 text-sm">
              You've reached the highest level. Continue contributing to
              maintain your status.
            </p>
          </div>
        )}
      </div>

      {/* ─── Achievements ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 shadow-sm">
        <h3
          className={cn(
            "text-lg font-bold text-slate-800 mb-4 flex items-center gap-2",
            bebasNeue.className,
          )}
        >
          <Trophy className="w-5 h-5 text-amber-500" />
          Achievements Earned
        </h3>

        {safePoints.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {safePoints.achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.06 }}
                className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 hover:border-amber-200/60 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 truncate">
                      {achievement.name}
                    </h4>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        {new Date(achievement.earnedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        +{achievement.points} pts
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-300" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">
              No Achievements Yet
            </h4>
            <p className="text-sm text-slate-500">
              Start verifying drugs to earn your first achievement!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPointsDashboard;
