// app/api/centers/[id]/bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
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

    const rateKey = `${userId}:center-bills:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `center-bills:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) return NextResponse.json({ success: true, data: cached });

    const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
    const patientsSnap = await get(patientsRef);
    const patientsData = patientsSnap.exists() ? patientsSnap.val() : {};

    let allBills: any[] = [];
    const patientIds = Object.keys(patientsData);
    for (const patientId of patientIds) {
      const billsRef = ref(db, `doza_centers/${centerId}/bills/${patientId}`);
      const billsSnap = await get(billsRef);
      if (billsSnap.exists()) {
        const billsData = billsSnap.val();
        const bills = Object.entries(billsData).map(([id, bill]) => ({
          id,
          patientId,
          patientName: patientsData[patientId]?.fullName || "Unknown",
          ...(bill as any),
        }));
        allBills.push(...bills);
      }
    }

    allBills.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    cache.set(cacheKey, allBills, 30);
    return NextResponse.json({ success: true, data: allBills });
  } catch (error) {
    return handleError(error);
  }
}
