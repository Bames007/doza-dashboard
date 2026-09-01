import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { unauthorized, handleError } from "@/app/lib/apiHelpers";
import { cache } from "@/app/lib/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; patientId: string }> },
) {
  const { id: centerId, patientId: userId } = await params;
  try {
    const medicId = request.headers.get("x-user-id");
    if (!medicId) return unauthorized();

    logger.info(
      { centerId, userId, medicId },
      "Start session request received",
    );

    // 1. Check patient exists
    const patientRef = ref(db, `doza_centers/${centerId}/patients/${userId}`);
    const patientSnap = await get(patientRef);
    if (!patientSnap.exists()) {
      logger.warn({ centerId, userId }, "Patient not found");
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }
    const beforeStatus = patientSnap.val()?.status;
    logger.info(
      { centerId, userId, beforeStatus },
      "Patient status before update",
    );

    // 2. Check active session
    const activeSessionRef = ref(
      db,
      `doza_centers/${centerId}/activeSessions/${userId}`,
    );
    const activeSnap = await get(activeSessionRef);
    if (activeSnap.exists()) {
      logger.warn({ centerId, userId }, "Active session already exists");
      return NextResponse.json(
        { success: false, error: "Patient already has an active session" },
        { status: 400 },
      );
    }

    // 3. Get center name
    const centerRef = ref(db, `doza_centers/${centerId}`);
    const centerSnap = await get(centerRef);
    const centerName = centerSnap.exists()
      ? centerSnap.val().centerName || "Unknown Center"
      : "Unknown Center";

    // 4. Create session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionRef = ref(db, `doza/sessions/${sessionId}`);
    await set(sessionRef, {
      sessionId,
      centerId,
      centerName,
      patientId: userId,
      startTime: Date.now(),
      status: "active",
      startedBy: medicId,
      startedByRole: request.headers.get("x-user-role") || "staff",
    });
    logger.info({ sessionId }, "Session created");

    // 5. Add to center's active sessions
    await set(activeSessionRef, sessionId);
    logger.info(
      { centerId, userId, sessionId },
      "Added to center activeSessions",
    );

    // 6. ✅ ALWAYS set patient status to "active" and clear discharge fields
    try {
      await update(patientRef, {
        status: "active",
        admissionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dischargeDate: null,
        dischargeRequested: false,
        dischargeSummary: null,
      });
      logger.info({ centerId, userId }, "Patient update executed successfully");
    } catch (updateError) {
      logger.error(
        { centerId, userId, error: updateError },
        "Failed to update patient status",
      );
      // Re-throw so that the overall request fails
      throw updateError;
    }

    // 7. Verify the update by reading back
    const afterSnap = await get(patientRef);
    const afterStatus = afterSnap.val()?.status;
    logger.info(
      { centerId, userId, beforeStatus, afterStatus },
      "Patient status after update verification",
    );

    if (afterStatus !== "active") {
      logger.error(
        { centerId, userId, afterStatus },
        "Patient status was NOT updated to active!",
      );
      // Optionally, you can still return success but flag the issue
    }

    // 8. ✅ Also set user's active session (so DozaPanel sees it)
    await set(ref(db, `doza/users/${userId}/activeSessions/${centerId}`), {
      sessionId,
      centerName,
      startTime: Date.now(),
    });
    logger.info({ userId, centerId }, "User active session set");

    // 9. Invalidate server caches
    cache.set(`patient:${centerId}:${userId}`, null, 0);
    cache.set(`patients:${centerId}:all`, null, 0);
    cache.set(`patients:${centerId}:emergency`, null, 0);

    logger.info(
      { userId, centerId, sessionId, newStatus: "active" },
      "Session started – patient status set to active",
    );

    return NextResponse.json({
      success: true,
      data: { sessionId },
      message: "Session started successfully",
    });
  } catch (error) {
    logger.error(
      { error: String(error), stack: (error as any)?.stack },
      "Error in start-session",
    );
    return handleError(error);
  }
}
