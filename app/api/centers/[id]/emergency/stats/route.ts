// URL: /api/centers/[id]/emergency/stats
// Method: GET

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:emergency-stats:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyStats:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // Read from the main patients node
    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const snapshot = await get(patientsRef);
    const patientsData = snapshot.exists() ? snapshot.val() : {};
    const patients = Object.values(patientsData) as any[];

    // Filter emergency patients (status waiting/in-treatment/discharged or have acuity)
    const emergencyPatients = patients.filter(
      (p) =>
        ["waiting", "in-treatment", "discharged"].includes(p.status) ||
        p.acuity,
    );

    const total = emergencyPatients.length;
    const waiting = emergencyPatients.filter(
      (p) => p.status === "waiting",
    ).length;
    const inTreatment = emergencyPatients.filter(
      (p) => p.status === "in-treatment",
    ).length;
    const discharged = emergencyPatients.filter(
      (p) => p.status === "discharged",
    ).length;

    // Calculate average wait time
    const waitTimes = emergencyPatients
      .filter((p) => p.triageTime && p.arrivalTime)
      .map(
        (p) =>
          (new Date(p.triageTime).getTime() -
            new Date(p.arrivalTime).getTime()) /
          60000,
      );
    const avgWait = waitTimes.length
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;

    const stats = {
      totalPatients: total,
      waiting,
      inTreatment,
      discharged,
      avgWaitTime: Math.round(avgWait * 10) / 10,
    };

    cache.set(cacheKey, stats, 30);
    logger.info({ centerId, stats }, "Emergency stats fetched");
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    return handleError(error);
  }
}
