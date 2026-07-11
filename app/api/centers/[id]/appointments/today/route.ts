// app/api/centers/[id]/appointments/today/route.ts
// URL: /api/centers/[id]/appointments/today
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

    const rateKey = `${userId}:todayAppointments:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const serviceType =
      request.nextUrl.searchParams.get("serviceType") || "all";
    const cacheKey = `todayAppointments:${centerId}:${serviceType}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug(
        { centerId, serviceType },
        "Today's appointments from cache",
      );
      return NextResponse.json({ success: true, data: cached });
    }

    const appointmentsRef = ref(db, `doza_centers/${centerId}/appointments`);
    const snapshot = await get(appointmentsRef);
    let appointments = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      appointments = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    } else if (process.env.NODE_ENV === "development") {
      appointments = [
        {
          id: "a1",
          patient: "John Doe",
          time: "09:00",
          type: "Consultation",
          serviceType: "optical",
        },
        {
          id: "a2",
          patient: "Jane Smith",
          time: "10:30",
          type: "Eye Exam",
          serviceType: "optical",
        },
      ];
    }

    if (serviceType !== "all") {
      appointments = appointments.filter((a) => a.serviceType === serviceType);
    }

    cache.set(cacheKey, appointments, 30);
    logger.info(
      { centerId, count: appointments.length },
      "Today's appointments fetched",
    );
    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    return handleError(error);
  }
}
