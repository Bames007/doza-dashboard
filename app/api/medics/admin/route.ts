// app/api/medics/admin/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, update, push, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";

// ---------- Zod Schema ----------
const bulkActionSchema = z.object({
  medicIds: z.array(z.string()).min(1, "At least one medic ID required"),
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

// ---------- Helpers ----------
function formatMedicForList(medic: any, id: string) {
  return {
    id,
    name:
      `${medic.personalInfo?.firstName || ""} ${medic.personalInfo?.lastName || ""}`.trim() ||
      "Unknown",
    email: medic.personalInfo?.email || "",
    phone: medic.personalInfo?.phone || "",
    role: medic.professionalInfo?.role || "Unspecified",
    specialties: medic.professionalInfo?.specialties || [],
    licenseNumber: medic.professionalInfo?.licenseNumber || "",
    status: medic.status || "pending",
    verified: medic.credentials?.verified || false,
    createdAt: medic.createdAt || new Date().toISOString(),
    lastUpdated: medic.lastUpdated || new Date().toISOString(),
    documentsCount: medic.credentials?.documents?.length || 0,
    location: medic.location
      ? `${medic.location.city || ""}, ${medic.location.state || ""}`.trim()
      : "",
    rejectionReason: medic.rejectionReason || "",
    verificationNotes: medic.verificationNotes || "",
  };
}

function calculateStats(medics: any[]) {
  const stats: any = {
    total: medics.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
    byRole: {},
    byLocation: {},
  };

  medics.forEach((m) => {
    const status = m.status || "pending";
    stats[status] = (stats[status] || 0) + 1;

    const role = m.professionalInfo?.role || "Unspecified";
    stats.byRole[role] = (stats.byRole[role] || 0) + 1;

    const location = m.location?.state || "Unknown";
    stats.byLocation[location] = (stats.byLocation[location] || 0) + 1;
  });

  return stats;
}

// ---------- GET (read‑only, no audit) ----------
export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search")?.toLowerCase();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const rateKey = `${adminId}:medics-admin-list`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ adminId }, "Medics admin list rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const cacheKey = `medicsAdmin:${JSON.stringify({ page, limit, status, role, search, startDate, endDate })}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ adminId }, "Medics admin list from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);

    let allMedics: any[] = [];
    if (snapshot.exists()) {
      const medicsData = snapshot.val();
      allMedics = Object.keys(medicsData).map((key) => ({
        id: key,
        ...medicsData[key],
      }));

      // Filters
      if (status && status !== "all") {
        allMedics = allMedics.filter((m) => m.status === status);
      }
      if (role && role !== "all") {
        allMedics = allMedics.filter((m) => m.professionalInfo?.role === role);
      }
      if (search) {
        allMedics = allMedics.filter((m) => {
          const fullName =
            `${m.personalInfo?.firstName || ""} ${m.personalInfo?.lastName || ""}`.toLowerCase();
          const email = (m.personalInfo?.email || "").toLowerCase();
          const license = (
            m.professionalInfo?.licenseNumber || ""
          ).toLowerCase();
          const id = (m.id || "").toLowerCase();
          return (
            fullName.includes(search) ||
            email.includes(search) ||
            license.includes(search) ||
            id.includes(search)
          );
        });
      }
      if (startDate) {
        const start = new Date(startDate);
        allMedics = allMedics.filter((m) => new Date(m.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        allMedics = allMedics.filter((m) => new Date(m.createdAt) <= end);
      }

      allMedics.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    const total = allMedics.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = allMedics.slice(startIndex, startIndex + limit);

    const formatted = paginated.map((m) => formatMedicForList(m, m.id));
    const stats = calculateStats(allMedics);

    const result = {
      medics: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      statistics: stats,
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { adminId, count: formatted.length },
      "Medics admin list fetched",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error fetching medic list");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- POST (Bulk Actions – with audit) ----------
export async function POST(request: NextRequest) {
  let adminId = "";
  try {
    const adminIdHeader = request.headers.get("x-admin-id");
    if (!adminIdHeader) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 },
      );
    }
    adminId = adminIdHeader;

    const rateKey = `${adminId}:medics-bulk-action`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ adminId }, "Medics bulk action rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = bulkActionSchema.parse(body);
    const { medicIds, action, reason, notes } = validated;

    const results = { successful: 0, failed: 0, details: [] as any[] };
    const timestamp = new Date().toISOString();

    for (const medicId of medicIds) {
      try {
        const medicRef = ref(db, `doza_medics/${medicId}`);
        const snapshot = await get(medicRef);
        if (!snapshot.exists()) {
          results.failed++;
          results.details.push({
            medicId,
            success: false,
            error: "Medic not found",
          });
          continue;
        }

        const currentData = snapshot.val();
        const newStatus =
          action === "approve"
            ? "approved"
            : action === "reject"
              ? "rejected"
              : "suspended";

        const updates: any = {
          status: newStatus,
          lastUpdated: timestamp,
        };

        if (action === "approve") {
          updates.verified = true;
          updates.verificationDate = timestamp;
          updates.verificationNotes = notes || "Bulk approved by admin";
          updates.assignedVerifier = adminId;
        } else {
          updates[`${action}Reason`] = reason || `Bulk ${action} by admin`;
          updates.verificationNotes = notes || `Bulk ${action}ed by admin`;
          updates.assignedVerifier = adminId;
        }

        await update(medicRef, updates);

        // Audit log (main)
        await writeAuditLog({
          centerId: currentData.centerId || "unknown",
          userId: adminId,
          userName: request.headers.get("x-user-name") || "Admin",
          userRole: "admin",
          action: "bulk_update",
          resource: "medic",
          resourceId: medicId,
          details: `Bulk ${action} medic: ${currentData.personalInfo?.email || medicId}`,
          status: "success",
          ipAddress: getClientIp(request),
          userAgent: request.headers.get("user-agent") || "unknown",
        });

        // Detailed audit in dedicated node
        const auditLog = {
          medicId,
          action: `BULK_${newStatus.toUpperCase()}`,
          timestamp,
          adminId,
          details: {
            previousStatus: currentData.status,
            newStatus,
            reason,
            notes,
          },
        };
        const auditRef = ref(db, "auditLogs/bulkActions");
        const newAuditRef = push(auditRef);
        await set(newAuditRef, auditLog);

        results.successful++;
        results.details.push({ medicId, success: true, newStatus });
      } catch (error: any) {
        results.failed++;
        results.details.push({ medicId, success: false, error: error.message });
      }
    }

    // Invalidate cache
    cache.clear();

    logger.info(
      {
        adminId,
        action,
        successful: results.successful,
        failed: results.failed,
      },
      "Bulk action completed",
    );
    return NextResponse.json({
      success: true,
      data: results,
      message: `Bulk action completed: ${results.successful} successful, ${results.failed} failed`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, adminId }, "Error processing bulk action");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
