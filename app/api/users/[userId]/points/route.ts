// app/api/users/[userId]/points/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase/auth";
import { ref, get } from "firebase/database";
import { app, db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";

// ---------- Zod Schema ----------
const userIdSchema = z.object({
  userId: z.string().min(1, "User ID required"),
});

// ---------- Helpers ----------
function calculateLevel(points: number): string {
  if (points >= 10000) return "Legendary";
  if (points >= 5000) return "Master";
  if (points >= 2500) return "Expert";
  if (points >= 1000) return "Advanced";
  if (points >= 500) return "Intermediate";
  if (points >= 100) return "Beginner";
  return "Newbie";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  let userId = "";
  try {
    const p = await params;
    userId = p.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    // Authentication
    const auth = getAuth(app);
    const currentUser = auth.currentUser;
    const headerUserId = request.headers.get("x-user-id");

    let isAuthorized = false;
    let authenticatedUserId: string | null = null;

    if (currentUser) {
      authenticatedUserId = currentUser.uid;
      if (authenticatedUserId === userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized && headerUserId === userId) {
      isAuthorized = true;
      authenticatedUserId = headerUserId;
    }

    if (!isAuthorized) {
      logger.warn(
        {
          userId,
          authenticatedUserId,
          hasHeader: !!headerUserId,
          hasFirebaseUser: !!currentUser,
        },
        "Unauthorized points access",
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Rate limiting
    const rateKey = `user-points:${authenticatedUserId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn(
        { userId: authenticatedUserId },
        "User points rate limit exceeded",
      );
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `userPoints:${userId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ userId }, "User points from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    logger.info({ userId }, "Fetching user points");

    // Check if user is a medic
    const medicRef = ref(db, `doza_medics/${userId}`);
    const medicSnapshot = await get(medicRef);

    if (!medicSnapshot.exists()) {
      const result = {
        redirectUrl: "/medic",
        message: "User is not registered as a medic",
      };
      logger.warn({ userId }, "User is not a medic");
      return NextResponse.json({ success: false, ...result }, { status: 404 });
    }

    const medicData = medicSnapshot.val();

    // Fetch points
    const pointsRef = ref(db, `userPoints/${userId}`);
    const pointsSnapshot = await get(pointsRef);

    let pointsData = pointsSnapshot.exists()
      ? pointsSnapshot.val()
      : {
          totalPoints: 0,
          verifiedDrugs: 0,
          pendingReview: 0,
          level: "Newbie",
          achievements: [],
          lastUpdated: new Date().toISOString(),
        };

    const level = calculateLevel(pointsData.totalPoints || 0);

    const result = {
      ...pointsData,
      level,
      userInfo: {
        id: userId,
        name:
          medicData.personalInfo?.fullName ||
          `${medicData.personalInfo?.firstName || ""} ${medicData.personalInfo?.lastName || ""}`.trim() ||
          currentUser?.displayName ||
          "Medic User",
        email: medicData.personalInfo?.email || currentUser?.email || "",
      },
    };

    cache.set(cacheKey, result, 10);
    logger.info(
      { userId, totalPoints: pointsData.totalPoints, level },
      "User points fetched",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, userId }, "Error fetching user points");
    return NextResponse.json(
      { success: false, error: msg || "Failed to fetch points" },
      { status: 500 },
    );
  }
}
