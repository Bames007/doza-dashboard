import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";
import {
  handleError,
  unauthorized,
  tooManyRequests,
} from "@/app/lib/apiHelpers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get("centerId");
    if (!centerId) {
      return NextResponse.json(
        { success: false, error: "centerId is required" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:center-subscriptions`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `centerSubscriptions:${centerId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ success: true, data: cached });
    }

    // ─── Fetch all and filter client‑side (no index needed) ───
    const subsRef = ref(db, "doza_admin/center_subscriptions");
    const snap = await get(subsRef);
    const allSubs = snap.exists() ? Object.values(snap.val()) : [];
    const subscriptions = allSubs.filter((s: any) => s.centerId === centerId);

    const current =
      subscriptions.find((s: any) => s.status === "active") || null;
    const pending =
      subscriptions.find((s: any) =>
        ["pending_approval", "pending_payment"].includes(s.status),
      ) || null;
    const history = subscriptions.filter((s: any) =>
      ["expired", "rejected", "inactive"].includes(s.status),
    );

    const result = { current, pending, history };
    cache.set(cacheKey, result, 30);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleError(error);
  }
}
