// URL: /api/centers/[id]/emergency/critical
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

    const rateKey = `${userId}:emergency-critical:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `emergencyCritical:${centerId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const snapshot = await get(patientsRef);
    const patientsData = snapshot.exists() ? snapshot.val() : {};
    const patients = Object.values(patientsData) as any[];

    // Filter critical patients: acuity 1 or 2, OR needICU, OR needVentilator, OR unstable vitals
    const criticalPatients = patients.filter((p) => {
      const acuity = parseInt(p.acuity || "5");
      const hasCriticalVital =
        p.vitals &&
        ((p.vitals.bloodPressureSystolic &&
          p.vitals.bloodPressureSystolic > 180) ||
          (p.vitals.heartRate && p.vitals.heartRate > 120) ||
          (p.vitals.oxygenSaturation && p.vitals.oxygenSaturation < 90));
      return acuity <= 2 || p.needICU || p.needVentilator || hasCriticalVital;
    });

    const count = criticalPatients.length;
    const icuRequired = criticalPatients.filter((p) => p.needICU).length;

    const list = criticalPatients.map((p) => ({
      id: p.id,
      name: p.fullName,
      age: p.age || 0,
      gender: p.gender || "Unknown",
      condition: p.chiefComplaint || "Unknown",
      vitalSigns: p.vitals || {},
      arrivalTime: p.arrivalTime
        ? new Date(p.arrivalTime).toLocaleTimeString()
        : "N/A",
      needICU: p.needICU || false,
      needVentilator: p.needVentilator || false,
    }));

    const criticalData = { count, icuRequired, list };

    cache.set(cacheKey, criticalData, 30);
    logger.info({ centerId, criticalData }, "Critical patients fetched");
    return NextResponse.json({ success: true, data: criticalData });
  } catch (error) {
    return handleError(error);
  }
}
