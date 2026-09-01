// app/api/centers/[id]/patients/confirm-otp/route.ts
// URL: /api/centers/[id]/patients/confirm-otp
// Method: POST
// Description: Center staff verifies OTP, creates a patient link, and starts a session.
// Now accepts patientType to set the patient's type (inpatient/outpatient).

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, set, push } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";
import { cache } from "@/app/lib/cache";

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  otp: z.string().length(6),
  patientType: z
    .enum(["inpatient", "outpatient"])
    .optional()
    .default("outpatient"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    const medicId = request.headers.get("x-user-id");
    if (!medicId) return unauthorized();

    const body = await request.json();
    const { userId, requestId, otp, patientType } = schema.parse(body);

    const rateKey = `${medicId}:confirm-otp:${userId}`;
    if (!rateLimiter.check(rateKey, 5, 300)) return tooManyRequests();

    const reqRef = ref(db, `doza/users/${userId}/pendingRequests/${requestId}`);
    const snap = await get(reqRef);
    if (!snap.exists()) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }
    const reqData = snap.val();

    if (reqData.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Request already processed" },
        { status: 400 },
      );
    }
    if (Date.now() > reqData.otpExpires) {
      return NextResponse.json(
        { success: false, error: "OTP expired" },
        { status: 400 },
      );
    }
    if (reqData.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 },
      );
    }

    const centerNameSnap = await get(
      ref(db, `doza_centers/${centerId}/centerName`),
    );
    const centerName = centerNameSnap.val() || "Healthcare Center";

    await update(reqRef, { status: "confirmed", confirmedAt: Date.now() });

    const linkRef = ref(db, `doza/users/${userId}/linkedCenters/${centerId}`);
    const linkSnap = await get(linkRef);
    if (!linkSnap.exists()) {
      await set(linkRef, { linkedAt: Date.now(), status: "active" });
    }

    const patientRef = ref(db, `doza_centers/${centerId}/patients/${userId}`);
    const patientSnap = await get(patientRef);
    if (!patientSnap.exists()) {
      const profileSnap = await get(
        ref(db, `doza/users/${userId}/personalProfile`),
      );
      const profile = profileSnap.val() || {};
      await set(patientRef, {
        fullName:
          `${profile.fname || ""} ${profile.lname || ""}`.trim() || "Unknown",
        email: profile.email || "",
        phone: profile.phone || "",
        linkedAt: Date.now(),
        registeredAt: new Date().toISOString(),
        userId,
        isLinked: true,
        status: "active",
        patientType: patientType,
      });
    } else {
      // ✅ Update status to active and patientType
      await update(patientRef, {
        patientType: patientType,
        status: "active",
        updatedAt: new Date().toISOString(),
      });
    }

    const sessionRef = push(ref(db, "doza/sessions"));
    const sessionId = sessionRef.key!;
    await set(sessionRef, {
      centerId,
      centerName,
      userId,
      startedBy: medicId,
      startTime: Date.now(),
      status: "active",
      requestId,
    });

    await update(ref(db, `doza/users/${userId}/activeSessions`), {
      [centerId]: {
        sessionId,
        centerName,
        startTime: Date.now(),
      },
    });
    await update(ref(db, `doza_centers/${centerId}/activeSessions`), {
      [userId]: sessionId,
    });

    // ✅ Invalidate caches
    cache.set(`patients:${centerId}:all`, null, 0);
    cache.set(`patients:${centerId}:emergency`, null, 0);
    cache.set(`patient:${centerId}:${userId}`, null, 0);

    logger.info(
      { userId, centerId, sessionId, centerName, patientType },
      "Session started via OTP",
    );

    return NextResponse.json({
      success: true,
      data: { sessionId, startTime: Date.now() },
      message: "Session started successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 },
      );
    }
    return handleError(error);
  }
}
