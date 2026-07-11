// app/api/centers/[id]/customers/route.ts
// URL: /api/centers/[id]/customers
// Methods: GET, POST

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

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const centerId = searchParams.get("centerId") || "";

    const rateKey = `${userId}:customers:${centerId}:${search}`;
    if (!rateLimiter.check(rateKey, 30, 60)) return tooManyRequests();

    const cacheKey = `customers:${centerId}:${search}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId, search }, "Customers from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const usersRef = ref(db, "doza_users");
    const usersSnapshot = await get(usersRef);
    let users: any[] = [];
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      users = Object.entries(usersData)
        .map(([id, data]: [string, any]) => ({ id, ...data }))
        .filter((user) => {
          if (user.isActive === false) return false;
          if (search) {
            const s = search.toLowerCase();
            return (
              user.fullName?.toLowerCase().includes(s) ||
              user.phone?.includes(search) ||
              user.dozaCode?.toLowerCase().includes(s) ||
              user.email?.toLowerCase().includes(s)
            );
          }
          return true;
        })
        .sort((a, b) => b.createdAt?.localeCompare(a.createdAt) || 0);
    }

    cache.set(cacheKey, users, 30);
    logger.info({ count: users.length }, "Doza users loaded");
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    const rateKey = `${userId}:customerLookup`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const body = await request.json();
    const { dozaCode, phone, fullName, centerId } = body;
    if (!dozaCode && !phone) {
      return NextResponse.json(
        { success: false, error: "Doza code or phone required" },
        { status: 400 },
      );
    }

    const usersRef = ref(db, "doza_users");
    const usersSnapshot = await get(usersRef);
    if (usersSnapshot.exists()) {
      const usersData = usersSnapshot.val();
      const user = Object.entries(usersData)
        .map(([id, data]: [string, any]) => ({ id, ...data }))
        .find(
          (u) =>
            (dozaCode && u.dozaCode === dozaCode) ||
            (phone && u.phone === phone),
        );

      if (user) {
        if (user.isActive === false) {
          return NextResponse.json(
            { success: false, error: "Doza user account is inactive" },
            { status: 400 },
          );
        }
        if (user.allowedCenters && !user.allowedCenters.includes(centerId)) {
          return NextResponse.json(
            {
              success: false,
              error: "Doza user does not have access to this center",
            },
            { status: 403 },
          );
        }
        return NextResponse.json({ success: true, data: user });
      }
    }
    return NextResponse.json(
      { success: false, error: "Doza user not found" },
      { status: 404 },
    );
  } catch (error) {
    return handleError(error);
  }
}
