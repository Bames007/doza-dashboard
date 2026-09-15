// app/api/centers/[id]/emergency/route.ts
// Methods: GET
//
// Base emergency department overview endpoint.
// Returns aggregated counts and summary stats for the emergency department.
// Sub-resources (patients, census, stats, critical, ambulance) have their own routes.

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

interface EmergencyOverview {
  centerId: string;
  totalPatients: number;
  waiting: number;
  inTreatment: number;
  discharged: number;
  critical: number;
  needICU: number;
  needVentilator: number;
  avgWaitTime: number;
  lastUpdated: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;

  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:emergency-overview:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyOverview:${centerId}`;
    const cached = cache.get<EmergencyOverview>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // Fetch patients from the emergency sub-node
    const patientsRef = ref(db, `doza_centers/${centerId}/emergency/patients`);
    const snapshot = await get(patientsRef);
    const data = snapshot.exists() ? snapshot.val() : {};

    const patients = Object.entries(data).map(([id, val]) => ({
      id,
      ...(val as any),
    }));

    // Compute aggregated stats
    const totalPatients = patients.length;
    const waiting = patients.filter((p) => p.status === "waiting").length;
    const inTreatment = patients.filter(
      (p) => p.status === "in-treatment",
    ).length;
    const discharged = patients.filter((p) => p.status === "discharged").length;
    const critical = patients.filter(
      (p) => p.acuity === "1" || p.acuity === "2",
    ).length;
    const needICU = patients.filter((p) => p.needICU === true).length;
    const needVentilator = patients.filter(
      (p) => p.needVentilator === true,
    ).length;

    // Average wait time = triageTime - arrivalTime (minutes)
    const triaged = patients.filter((p) => p.triageTime && p.arrivalTime);
    const avgWaitTime =
      triaged.length > 0
        ? Math.round(
            triaged.reduce((acc, p) => {
              const wait =
                (new Date(p.triageTime!).getTime() -
                  new Date(p.arrivalTime!).getTime()) /
                60000;
              return acc + (isNaN(wait) ? 0 : wait);
            }, 0) / triaged.length,
          )
        : 0;

    const overview: EmergencyOverview = {
      centerId,
      totalPatients,
      waiting,
      inTreatment,
      discharged,
      critical,
      needICU,
      needVentilator,
      avgWaitTime,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 30 seconds (matches patients route pattern)
    cache.set(cacheKey, overview, 30);

    logger.info(
      { centerId, totalPatients, critical },
      "Emergency overview fetched",
    );

    return NextResponse.json({ success: true, data: overview });
  } catch (error) {
    return handleError(error);
  }
}
