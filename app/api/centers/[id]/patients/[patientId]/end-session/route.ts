import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, remove, push, set } from "firebase/database";
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

    // ─── Get optional status from query string ───────────────────
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "discharged";

    const sessionIdRef = ref(
      db,
      `doza_centers/${centerId}/activeSessions/${userId}`,
    );
    const sessionIdSnap = await get(sessionIdRef);
    if (!sessionIdSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "No active session" },
        { status: 400 },
      );
    }
    const sessionId = sessionIdSnap.val();

    const sessionSnap = await get(ref(db, `doza/sessions/${sessionId}`));
    const sessionData = sessionSnap.exists() ? sessionSnap.val() : {};

    // Update session status
    await update(ref(db, `doza/sessions/${sessionId}`), {
      status: "ended",
      endedAt: Date.now(),
      endedBy: medicId,
    });

    // Remove center's active session
    await remove(sessionIdRef);
    await remove(ref(db, `doza_centers/${centerId}/activeSessions/${userId}`));

    // ✅ Remove user's active session entry
    await remove(ref(db, `doza/users/${userId}/activeSessions/${centerId}`));

    // ─── Update patient status ────────────────────────────────────
    await update(ref(db, `doza_centers/${centerId}/patients/${userId}`), {
      status: statusParam,
      ...(statusParam !== "discharged"
        ? {
            dischargeDate: null,
            dischargeRequested: false,
            dischargeSummary: null,
          }
        : {}),
    });

    // Save session history
    const userSessionsRef = ref(db, `doza/users/${userId}/sessions`);
    const newSessionRef = push(userSessionsRef);
    await set(newSessionRef, {
      sessionId,
      centerId,
      centerName: sessionData.centerName || "Unknown Center",
      startTime: sessionData.startTime || Date.now(),
      endTime: Date.now(),
      status: "ended",
      endedBy: medicId,
    });

    // ─── Invalidate caches ────────────────────────────────────────
    // Patient detail & list caches
    cache?.set(`patient:${centerId}:${userId}`, null, 0);
    cache?.set(`patients:${centerId}:all`, null, 0);

    // ✅ Invalidate ALL search‑cache entries for this center
    // The cache key format is "search-users:${query}:${centerId}"
    // We'll delete all keys that start with "search-users:" and contain the centerId.
    if (cache && typeof cache === "object") {
      try {
        // If cache is a Map
        if (cache instanceof Map) {
          for (const key of cache.keys()) {
            if (
              typeof key === "string" &&
              key.startsWith("search-users:") &&
              key.includes(`:${centerId}`)
            ) {
              cache.delete(key);
            }
          }
        } else {
          // Fallback: try to get keys using a `keys()` method or fallback to Object.keys
          const keys =
            typeof (cache as any).keys === "function"
              ? (cache as any).keys()
              : Object.keys(cache);
          for (const key of keys) {
            if (
              typeof key === "string" &&
              key.startsWith("search-users:") &&
              key.includes(`:${centerId}`)
            ) {
              if (typeof (cache as any).delete === "function") {
                (cache as any).delete(key);
              } else {
                // Set to null/expire immediately
                (cache as any)[key] = null;
              }
            }
          }
        }
        logger.info({ centerId }, "Search cache invalidated for center");
      } catch (err) {
        logger.warn({ centerId, error: err }, "Failed to clear search cache");
      }
    }

    logger.info(
      { userId, centerId, sessionId, newStatus: statusParam },
      "Session ended and caches cleared",
    );

    return NextResponse.json({ success: true, message: "Session ended" });
  } catch (error) {
    return handleError(error);
  }
}
