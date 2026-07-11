// app/api/medics/[medicId]/points/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";

// ---------- Helpers ----------
function calculateLevel(points: number): string {
  if (points >= 10000) return "Legendary";
  if (points >= 5000) return "Master";
  if (points >= 2500) return "Senior";
  if (points >= 1000) return "Expert";
  if (points >= 500) return "Advanced";
  if (points >= 100) return "Verified";
  if (points >= 10) return "Beginner";
  return "New";
}

function processMedicData(medic: any, medicId: string) {
  const pointsData = medic.verificationPoints || medic.points || {};
  const totalPoints = pointsData.totalPoints || 0;
  const verifiedDrugs = pointsData.verifiedDrugs || 0;
  const pendingReview = pointsData.pendingReview || 0;
  const medicType =
    medic.professionalInfo?.role || medic.professional?.role || "Medic";

  return {
    totalPoints,
    verifiedDrugs,
    pendingReview,
    level: calculateLevel(totalPoints),
    achievements: medic.achievements || [],
    averagePoints: medic.averagePoints || 0,
    completionRate: medic.completionRate || 0,
    medicType,
    lastUpdated: new Date().toISOString(),
    medicInfo: {
      id: medicId,
      name: `${medic?.personalInfo?.firstName || ""} ${medic?.personalInfo?.lastName || ""}`.trim(),
      email: medic?.personalInfo?.email,
      role: medicType,
      status: medic?.status || "pending",
      verified: medic?.verified || false,
      centerId: medic?.centerId || null,
      centerName: medic?.centerName || null,
    },
  };
}

function processStaffData(staff: any, staffId: string, centerId: string) {
  const pointsData = staff.points || {};
  const totalPoints = pointsData.totalPoints || 0;

  return {
    totalPoints,
    verifiedDrugs: 0,
    pendingReview: 0,
    level: calculateLevel(totalPoints),
    achievements: [],
    averagePoints: 0,
    completionRate: 0,
    medicType: staff.professional?.role || "Staff",
    lastUpdated: new Date().toISOString(),
    medicInfo: {
      id: staffId,
      name: staff.personalInfo?.fullName || "Staff Member",
      email: staff.personalInfo?.email,
      role: staff.professional?.role || "Staff",
      status: "active",
      verified: true,
      centerId,
      centerName: staff.centerName || "Healthcare Center",
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ medicId: string }> },
) {
  let medicId = "";
  try {
    const p = await params;
    medicId = p.medicId;
    if (!medicId || medicId === "undefined" || medicId === "null") {
      return NextResponse.json(
        { success: false, error: "Medic ID is required" },
        { status: 400 },
      );
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const rateKey = `${userId}:medic-points:${medicId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ userId, medicId }, "Medic points rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const cacheKey = `medicPoints:${medicId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ medicId }, "Medic points from cache");
      return NextResponse.json({ success: true, ...cached });
    }

    logger.info({ medicId }, "Fetching medic points");

    // 1) Search in doza_medics by ID
    const medicRef = ref(db, `doza_medics/${medicId}`);
    const medicSnapshot = await get(medicRef);

    let result: any = null;
    let isMedic = false;

    if (medicSnapshot.exists()) {
      const medicData = medicSnapshot.val();
      result = processMedicData(medicData, medicId);
      isMedic = true;
    }

    // 2) If not found by direct ID, search by email (if medicId contains @)
    if (!result && medicId.includes("@")) {
      const medicsRef = ref(db, "doza_medics");
      const allMedicsSnapshot = await get(medicsRef);

      if (allMedicsSnapshot.exists()) {
        const medics = allMedicsSnapshot.val();
        for (const [id, medic] of Object.entries(medics) as [string, any][]) {
          if (medic?.personalInfo?.email === medicId) {
            result = processMedicData(medic, id);
            isMedic = true;
            break;
          }
        }
      }
    }

    // 3) If still not found, check staff by email
    if (!result) {
      const staffRef = ref(db, "doza_centers");
      const centersSnapshot = await get(staffRef);

      if (centersSnapshot.exists()) {
        const centers = centersSnapshot.val();
        for (const [centerId, center] of Object.entries(centers) as [
          string,
          any,
        ][]) {
          if (center?.staff && typeof center.staff === "object") {
            for (const [staffId, staff] of Object.entries(center.staff) as [
              string,
              any,
            ][]) {
              if (staff?.personalInfo?.email === medicId) {
                result = processStaffData(staff, staffId, centerId);
                isMedic = true;
                break;
              }
            }
          }
          if (isMedic) break;
        }
      }
    }

    if (!result) {
      logger.warn({ medicId }, "Medic not found");
      return NextResponse.json(
        {
          success: false,
          isMedic: false,
          message: "Not registered as a Doza medic",
          redirectUrl: "/medic",
        },
        { status: 404 },
      );
    }

    const response = {
      success: true,
      isMedic: true,
      data: result,
    };

    cache.set(cacheKey, response, 30);
    logger.info({ medicId, isMedic }, "Medic points fetched");
    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, medicId }, "Error fetching medic points");
    return NextResponse.json(
      {
        success: false,
        error: msg || "Failed to fetch points",
        isMedic: false,
      },
      { status: 500 },
    );
  }
}
