// // app/api/centers/[id]/patients/request-link/route.ts
// // URL: /api/centers/[id]/patients/request-link
// // Method: POST

// import { NextRequest, NextResponse } from "next/server";
// import { ref, get, push, set } from "firebase/database";
// import { db } from "@/app/utils/firebaseConfig";
// import logger from "@/app/utils/logger";
// import { rateLimiter } from "@/app/lib/rateLimit";
// import { cache } from "@/app/lib/cache";
// import {
//   unauthorized,
//   tooManyRequests,
//   handleError,
// } from "@/app/lib/apiHelpers";

// export async function POST(
//   request: NextRequest,
//   { params }: { params: Promise<{ id: string }> },
// ) {
//   const { id: centerId } = await params;
//   try {
//     // 1. Authentication
//     const userId = request.headers.get("x-user-id");
//     if (!userId) {
//       return NextResponse.json(
//         { success: false, error: "Unauthorized" },
//         { status: 401 },
//       );
//     }

//     // 2. Authorization – only medics/admins can request links
//     const userRole = request.headers.get("x-user-role") || "support";
//     const allowed = [
//       "doctor",
//       "nurse",
//       "admin",
//       "admin",
//       "center_owner",
//     ];
//     if (!allowed.some((r) => userRole.toLowerCase().includes(r))) {
//       return NextResponse.json(
//         { success: false, error: "Permission denied" },
//         { status: 403 },
//       );
//     }

//     // 3. Parse body
//     const body = await request.json();
//     const { userId: targetUserId } = body;
//     if (!targetUserId) {
//       return NextResponse.json(
//         { success: false, error: "userId is required" },
//         { status: 400 },
//       );
//     }

//     // 4. Rate limit (5 requests per 5 minutes per target user)
//     const rateKey = `${userId}:request-link:${targetUserId}`;
//     if (!rateLimiter.check(rateKey, 5, 300)) {
//       return tooManyRequests();
//     }

//     // 5. Check if target user exists
//     const userSnap = await get(ref(db, `doza/users/${targetUserId}`));
//     if (!userSnap.exists()) {
//       return NextResponse.json(
//         { success: false, error: "User not found" },
//         { status: 404 },
//       );
//     }

//     // 6. Check if already linked
//     const linkCheck = await get(
//       ref(db, `doza/users/${targetUserId}/linkedCenters/${centerId}`),
//     );
//     if (linkCheck.exists()) {
//       return NextResponse.json(
//         { success: false, error: "User already linked to this center" },
//         { status: 400 },
//       );
//     }

//     // 7. Generate OTP (6-digit)
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

//     // 8. Store pending request in user's node
//     const pendingRef = ref(db, `doza/users/${targetUserId}/pendingRequests`);
//     const newRequestRef = push(pendingRef);
//     const requestId = newRequestRef.key;

//     // Get center name
//     const centerNameSnapshot = await get(
//       ref(db, `doza_centers/${centerId}/centerName`),
//     );
//     const centerName = centerNameSnapshot.val() || "Unknown Center";

//     await set(newRequestRef, {
//       centerId,
//       centerName,
//       requestedAt: Date.now(),
//       otp,
//       otpExpires: expiresAt,
//       status: "pending",
//       requestedBy: userId,
//     });

//     // 9. Invalidate cache for pending requests
//     cache.set(`pending-requests:${targetUserId}`, null, 0);

//     // 10. Log the action
//     logger.info(
//       { centerId, targetUserId, requestId },
//       "Patient link request initiated",
//     );

//     // 11. Return success (OTP is NOT returned – it will be sent via push notification)
//     // In production, you would trigger a push notification here (e.g., via FCM).
//     // For now, we just return a success message.
//     return NextResponse.json({
//       success: true,
//       data: {
//         requestId,
//         expiresAt,
//       },
//       message:
//         "Link request sent successfully. The user will receive a notification with an OTP.",
//     });
//   } catch (error) {
//     logger.error({ error: String(error) }, "Request link error");
//     return handleError(error);
//   }
// }

// app/api/centers/[id]/patients/request-link/route.ts
// Extended OTP expiry to 20 minutes and conditionally returns OTP in dev

import { NextRequest, NextResponse } from "next/server";
import { ref, get, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: centerId } = await params;
  try {
    // 1. Authentication
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Authorization – only medics/admins can request links
    const userRole = request.headers.get("x-user-role") || "support";
    const allowed = ["doctor", "nurse", "admin", "admin", "center_owner"];
    if (!allowed.some((r) => userRole.toLowerCase().includes(r))) {
      return NextResponse.json(
        { success: false, error: "Permission denied" },
        { status: 403 },
      );
    }

    // 3. Parse body
    const body = await request.json();
    const { userId: targetUserId } = body;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 },
      );
    }

    // 4. Rate limit (5 requests per 5 minutes per target user)
    const rateKey = `${userId}:request-link:${targetUserId}`;
    if (!rateLimiter.check(rateKey, 5, 300)) {
      return tooManyRequests();
    }

    // 5. Check if target user exists
    const userSnap = await get(ref(db, `doza/users/${targetUserId}`));
    if (!userSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // 6. Check if already linked
    const linkCheck = await get(
      ref(db, `doza/users/${targetUserId}/linkedCenters/${centerId}`),
    );
    if (linkCheck.exists()) {
      return NextResponse.json(
        { success: false, error: "User already linked to this center" },
        { status: 400 },
      );
    }

    // 7. Generate OTP (6-digit) – 20 minutes expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 20 * 60 * 1000; // 20 minutes

    // 8. Store pending request in user's node
    const pendingRef = ref(db, `doza/users/${targetUserId}/pendingRequests`);
    const newRequestRef = push(pendingRef);
    const requestId = newRequestRef.key;

    // Get center name
    const centerNameSnapshot = await get(
      ref(db, `doza_centers/${centerId}/centerName`),
    );
    const centerName = centerNameSnapshot.val() || "Unknown Center";

    await set(newRequestRef, {
      centerId,
      centerName,
      requestedAt: Date.now(),
      otp,
      otpExpires: expiresAt,
      status: "pending",
      requestedBy: userId,
    });

    // 9. Invalidate cache for pending requests
    cache.set(`pending-requests:${targetUserId}`, null, 0);

    // 10. Log the action
    logger.info(
      { centerId, targetUserId, requestId },
      "Patient link request initiated",
    );

    // 11. Return success – OTP is conditionally included in dev
    const responseData: any = {
      success: true,
      data: {
        requestId,
        expiresAt,
        ...(process.env.NODE_ENV === "development" && { otp }),
      },
      message:
        "Link request sent successfully. The user will receive a notification with an OTP.",
    };
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error({ error: String(error) }, "Request link error");
    return handleError(error);
  }
}
