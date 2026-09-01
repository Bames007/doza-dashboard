// app/api/centers/[id]/pending-requests/route.ts
// GET – returns pending requests for a given center (no OTP)

import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
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

    // (Optional) role check – reuse logic from search endpoint

    const rateKey = `${userId}:center-pending:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    // Fetch all users
    const usersRef = ref(db, "doza/users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results: any[] = [];
    const users = snapshot.val();

    for (const [uid, userData] of Object.entries(users) as any) {
      const pending = userData.pendingRequests || {};
      for (const [reqId, req] of Object.entries(pending) as any) {
        if (req.centerId === centerId && req.status === "pending") {
          const profile = userData.personalProfile || {};
          results.push({
            requestId: reqId,
            userId: uid,
            centerName: req.centerName,
            requestedAt: req.requestedAt,
            otpExpires: req.otpExpires,
            fullName:
              `${profile.fname || ""} ${profile.lname || ""}`.trim() ||
              "Unknown",
            email: profile.email || "",
            phone: profile.phone || "",
            avatar: profile.selectedImage || null,
          });
        }
      }
    }

    results.sort((a, b) => b.requestedAt - a.requestedAt);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    return handleError(error);
  }
}
