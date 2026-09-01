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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const userRole = request.headers.get("x-user-role") || "support";
    const allowed = ["doctor", "nurse", "admin", "admin", "center_owner"];
    if (!allowed.some((r) => userRole.toLowerCase().includes(r))) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const centerId = searchParams.get("centerId") || "";
    if (query.trim().length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const rateKey = `${userId}:search-users:${query}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const cacheKey = `search-users:${query}:${centerId}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    const usersRef = ref(db, "doza/users/");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const allUsers = snapshot.val();
    const results = [];
    const qLower = query.trim().toLowerCase();

    let centerPatients: any = {};
    let activeSessions: any = {};
    if (centerId) {
      const patientsRef = ref(db, `doza_centers/${centerId}/patients`);
      const patientsSnap = await get(patientsRef);
      if (patientsSnap.exists()) centerPatients = patientsSnap.val();

      const activeRef = ref(db, `doza_centers/${centerId}/activeSessions`);
      const activeSnap = await get(activeRef);
      if (activeSnap.exists()) activeSessions = activeSnap.val();
    }

    for (const [id, data] of Object.entries(allUsers) as [string, any][]) {
      const profile = data.personalProfile || data.profile || {};
      const fname = (
        profile.fname ||
        profile.firstName ||
        profile.first_name ||
        ""
      ).trim();
      const lname = (
        profile.lname ||
        profile.lastName ||
        profile.last_name ||
        ""
      ).trim();
      const fullName = fname + (lname ? " " + lname : "");
      const email = (profile.email || data.email || "").trim();
      const phone = (
        profile.phone ||
        data.phone ||
        profile.phoneNumber ||
        ""
      ).trim();
      const avatar =
        profile.selectedImage || profile.avatar || data.avatar || null;

      const match =
        fullName.toLowerCase().includes(qLower) ||
        email.toLowerCase().includes(qLower) ||
        phone.includes(query.trim());

      if (match) {
        let patientStatus = "not_linked";
        let displayStatus = patientStatus;
        let patientId = null;
        let hasActiveSession = false;
        let hasPendingRequest = false;

        if (centerId && centerPatients[id]) {
          const storedStatus = centerPatients[id].status || "active";
          patientStatus = storedStatus;
          patientId = id;
          hasActiveSession = !!activeSessions[id];
          displayStatus = hasActiveSession ? "active" : storedStatus;
        }

        // ✅ Check for pending request
        if (centerId) {
          const pendingRef = ref(db, `doza/users/${id}/pendingRequests`);
          const pendingSnap = await get(pendingRef);
          if (pendingSnap.exists()) {
            const pendingData = pendingSnap.val();
            for (const [key, req] of Object.entries(pendingData) as [
              string,
              any,
            ][]) {
              if (req.status === "pending" && req.otpExpires > Date.now()) {
                hasPendingRequest = true;
                break;
              }
            }
          }
        }

        results.push({
          id,
          fullName: fullName || "Unknown User",
          email,
          phone,
          avatar,
          patientStatus,
          displayStatus,
          patientId,
          hasActiveSession,
          hasPendingRequest, // ✅ new flag
        });
      }
      if (results.length >= 20) break;
    }

    cache.set(cacheKey, results, 30);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return handleError(error);
  }
}
