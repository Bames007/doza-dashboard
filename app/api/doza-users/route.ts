// app/api/doza-users/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  push,
  update,
} from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";

// ---------- Types ----------
type DozaUser = {
  id: string;
  centerId: string;
  fullName: string;
  phone: string;
  email?: string;
  dozaCode: string;
  creditLimit: number;
  currentBalance: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

// ---------- Zod Schema ----------
const dozaUserCreateSchema = z.object({
  centerId: z.string().min(1, "Center ID required"),
  fullName: z.string().min(1, "Full name required"),
  phone: z.string().min(1, "Phone required"),
  email: z.string().email("Invalid email").optional().default(""),
  dozaCode: z.string().optional(),
  creditLimit: z.coerce.number().nonnegative().default(50000),
  currentBalance: z.coerce.number().nonnegative().default(0),
});

async function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") || null;
}

// ---------- GET (read‑only, no audit) ----------
export async function GET(request: NextRequest) {
  let centerId = "";
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search")?.toLowerCase() || "";
    const centerIdParam = searchParams.get("centerId");
    const phone = searchParams.get("phone");

    if (!centerIdParam) {
      return NextResponse.json(
        { success: false, error: "Center ID is required" },
        { status: 400 },
      );
    }
    centerId = centerIdParam;

    // Rate limit
    const rateKey = `${userId}:doza-users:${centerId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ userId, centerId }, "Doza users rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `dozaUsers:${centerId}:${searchTerm}:${phone || ""}`;
    const cached = cache.get<DozaUser[]>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Doza users from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    // Firebase query
    const dozaUsersRef = ref(db, "doza_users");
    const q = query(dozaUsersRef, orderByChild("centerId"), equalTo(centerId));
    const snapshot = await get(q);

    let dozaUsers: DozaUser[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const user = child.val() as DozaUser;
        if (user.isActive !== false) {
          dozaUsers.push({
            ...user,
            id: child.key as string,
          });
        }
      });
    }

    // Client‑side filtering
    if (searchTerm) {
      dozaUsers = dozaUsers.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm) ||
          user.phone?.includes(searchTerm) ||
          user.dozaCode?.toLowerCase().includes(searchTerm),
      );
    }
    if (phone) {
      dozaUsers = dozaUsers.filter((user) => user.phone === phone);
    }

    cache.set(cacheKey, dozaUsers, 30);
    logger.info({ centerId, count: dozaUsers.length }, "Doza users fetched");
    return NextResponse.json({ success: true, data: dozaUsers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, centerId }, "Error fetching Doza users");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- POST (mutation – with audit) ----------
export async function POST(request: NextRequest) {
  let centerId = "";
  let userId = "";
  try {
    const userIdHeader = await getUserId(request);
    if (!userIdHeader) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }
    userId = userIdHeader;

    const body = await request.json();
    const validated = dozaUserCreateSchema.parse(body);
    const {
      centerId: cId,
      fullName,
      phone,
      email,
      dozaCode,
      creditLimit,
      currentBalance,
    } = validated;
    centerId = cId;

    // Rate limit
    const rateKey = `${userId}:doza-user-create:${centerId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ userId, centerId }, "Doza user create rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Check existing user
    const dozaUsersRef = ref(db, "doza_users");
    const snapshot = await get(dozaUsersRef);
    let existingUser: DozaUser | null = null;
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        const user = child.val() as DozaUser;
        if (
          (user.phone === phone || user.dozaCode === dozaCode) &&
          user.centerId === centerId
        ) {
          existingUser = { ...user, id: child.key as string };
        }
      });
    }

    if (existingUser) {
      logger.info({ centerId, phone }, "Doza user already exists");
      return NextResponse.json({
        success: true,
        data: existingUser,
        message: "Doza user already exists",
      });
    }

    // Generate Doza code if not provided
    let finalDozaCode = dozaCode;
    if (!finalDozaCode) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      finalDozaCode = `DZ${randomNum}`;
    }

    const timestamp = new Date().toISOString();
    const dozaUserData: Omit<DozaUser, "id"> = {
      centerId,
      fullName,
      phone,
      email: email || "",
      dozaCode: finalDozaCode,
      creditLimit: Number(creditLimit),
      currentBalance: Number(currentBalance),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const newRef = push(dozaUsersRef);
    await update(ref(db), {
      [`doza_users/${newRef.key}`]: dozaUserData,
    });

    // Invalidate cache for this center
    cache.set(`dozaUsers:${centerId}:*`, null, 0);

    // Audit log
    await writeAuditLog({
      centerId,
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "staff",
      action: "create",
      resource: "doza-user",
      resourceId: newRef.key,
      details: `Created Doza user: ${fullName} (${phone})`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    logger.info(
      { centerId, userId: newRef.key, fullName },
      "Doza user created",
    );
    return NextResponse.json({
      success: true,
      data: { ...dozaUserData, id: newRef.key },
      message: "Doza user created successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, centerId, userId }, "Error creating Doza user");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
