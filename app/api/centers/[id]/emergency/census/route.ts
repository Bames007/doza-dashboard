// URL: /api/centers/[id]/emergency/census
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

    const rateKey = `${userId}:emergency-census:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyCensus:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const snapshot = await get(patientsRef);
    const patientsData = snapshot.exists() ? snapshot.val() : {};
    const patients = Object.values(patientsData) as any[];

    // Filter emergency patients
    const emergencyPatients = patients.filter(
      (p) =>
        ["waiting", "in-treatment", "discharged"].includes(p.status) ||
        p.acuity,
    );

    const current = emergencyPatients.length;
    const waiting = emergencyPatients.filter(
      (p) => p.status === "waiting",
    ).length;
    const boarding = emergencyPatients.filter(
      (p) => p.bedAssigned && p.status !== "discharged",
    ).length;
    const avgWaitTime =
      emergencyPatients
        .filter((p) => p.triageTime && p.arrivalTime)
        .reduce((acc, p) => {
          const wait =
            (new Date(p.triageTime).getTime() -
              new Date(p.arrivalTime).getTime()) /
            60000;
          return acc + wait;
        }, 0) /
      (emergencyPatients.filter((p) => p.triageTime && p.arrivalTime).length ||
        1);

    // Build patient list for census view
    const patientList = emergencyPatients.map((p) => ({
      id: p.id,
      name: p.fullName,
      acuity: p.acuity || "3",
      chiefComplaint: p.chiefComplaint || "Not specified",
      arrivalTime: p.arrivalTime
        ? new Date(p.arrivalTime).toLocaleTimeString()
        : "N/A",
      waitTime:
        p.triageTime && p.arrivalTime
          ? Math.round(
              (new Date(p.triageTime).getTime() -
                new Date(p.arrivalTime).getTime()) /
                60000,
            )
          : 0,
      bedAssigned: p.bedAssigned || "",
    }));

    const censusData = {
      current,
      capacity: 30, // you can store this in a config node
      waiting,
      boarding,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10,
      waitTimeChange: 0, // you can compute from historical data
      patients: patientList,
    };

    cache.set(cacheKey, censusData, 30);
    logger.info({ centerId, censusData }, "Emergency census fetched");
    return NextResponse.json({ success: true, data: censusData });
  } catch (error) {
    return handleError(error);
  }
}
