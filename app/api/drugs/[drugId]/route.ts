// app/api/drugs/[drugId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";

// ---------- Zod Schemas ----------
const drugUpdateSchema = z.object({
  drugData: z.record(z.string(), z.any()).optional(),
  reason: z.string().optional(),
  status: z
    .enum(["pending_review", "verified", "needs_more_info", "rejected"])
    .optional(),
});

const reviewSchema = z.object({
  comment: z.string().optional().default(""),
  rating: z.number().min(0).max(5).optional().default(0),
  feedback: z.record(z.string(), z.any()).optional().default({}),
});

async function getUserId(req: NextRequest) {
  return req.headers.get("x-user-id") || null;
}

// ---------- Confidence Score Helper ----------
function calculateConfidenceScore(drug: any): number {
  const requiredFields = [
    "genericName",
    "strength",
    "dosageForm",
    "manufacturer",
    "drugClass",
    "mechanismOfAction",
    "indications",
    "dosage",
    "pharmacology.pharmacokinetics",
    "pharmacology.pharmacodynamics",
    "sideEffects",
  ];
  const fieldWeights: Record<string, number> = {
    genericName: 10,
    strength: 5,
    dosageForm: 5,
    manufacturer: 5,
    drugClass: 5,
    mechanismOfAction: 10,
    indications: 10,
    contraindications: 5,
    sideEffects: 10,
    warnings: 5,
    interactions: 5,
    dosage: 10,
    administration: 5,
    "pharmacology.pharmacokinetics": 5,
    "pharmacology.pharmacodynamics": 5,
    "pharmacology.halfLife": 3,
    "pharmacology.proteinBinding": 3,
    "pharmacology.metabolism": 3,
    "pharmacology.excretion": 3,
    storage: 3,
    pregnancyCategory: 3,
    breastfeedingSafety: 3,
    monitoringParameters: 3,
    references: 3,
  };
  let score = 0,
    totalWeight = 0;
  requiredFields.forEach((field) => {
    totalWeight += fieldWeights[field] || 5;
    const value = field.split(".").reduce((acc, part) => acc?.[part], drug);
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value) && value.length > 0)
        score += fieldWeights[field] || 5;
      else if (!Array.isArray(value) && String(value).trim().length > 0)
        score += fieldWeights[field] || 5;
    }
  });
  return Math.min(100, Math.round((score / totalWeight) * 100));
}

// ---------- GET (read‑only, no audit) ----------
export async function GET(
  request: NextRequest,
  context: { params: { drugId: string } },
) {
  let drugId = "";
  try {
    const p = await context.params;
    drugId = p.drugId;
    if (!drugId) {
      return NextResponse.json(
        { success: false, error: "Drug ID is required" },
        { status: 400 },
      );
    }

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const rateKey = `${userId}:drug:${drugId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const cacheKey = `drug:${drugId}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ drugId }, "Drug from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const drugRef = ref(db, `doza_drugsdb/drugs/${drugId}`);
    const snapshot = await get(drugRef);

    if (!snapshot.exists()) {
      logger.warn({ drugId }, "Drug not found");
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const drugData = snapshot.val();
    const result = { id: drugId, ...drugData };
    cache.set(cacheKey, result, 30);
    logger.info({ drugId }, "Drug fetched");
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, drugId }, "Error fetching drug");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- PUT (mutation – with audit) ----------
export async function PUT(
  request: NextRequest,
  context: { params: { drugId: string } },
) {
  let drugId = "";
  let userId = "";
  let userName = "";
  try {
    const p = await context.params;
    drugId = p.drugId;
    if (!drugId) {
      return NextResponse.json(
        { success: false, error: "Drug ID is required" },
        { status: 400 },
      );
    }

    const userIdHeader = await getUserId(request);
    const userNameHeader = request.headers.get("x-user-name");
    if (!userIdHeader || !userNameHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }
    userId = userIdHeader;
    userName = userNameHeader;

    const rateKey = `${userId}:drug-update:${drugId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = drugUpdateSchema.parse(body);
    const { drugData, reason, status } = validated;

    const drugRef = ref(db, `doza_drugsdb/drugs/${drugId}`);
    const snapshot = await get(drugRef);
    if (!snapshot.exists()) {
      logger.warn({ drugId }, "Drug not found for update");
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();
    const timestamp = new Date().toISOString();

    // Permission check
    const isOriginalVerifier = existing.verifiedBy?.userId === userId;
    const userRole = request.headers.get("x-user-role");
    const isAdmin = userRole === "super_admin" || userRole === "hospital_admin";

    if (!isOriginalVerifier && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You can only edit drugs you verified",
          requiresAdmin: true,
        },
        { status: 403 },
      );
    }

    // Build update object
    const updateData: any = {
      ...existing,
      ...drugData,
      updatedAt: timestamp,
      updatedBy: {
        userId,
        userName,
        updatedAt: timestamp,
        reason: reason || "Updated by user",
      },
    };

    if (drugData && Object.keys(drugData).length > 0) {
      updateData.confidenceScore = calculateConfidenceScore(updateData);
    }

    if (status) {
      updateData.status = status;
      // Award points if status becomes verified
      if (status === "verified" && existing.status !== "verified") {
        const pointsToAward = 10;
        const verifierId = existing.verifiedBy?.userId;
        if (verifierId) {
          const userPointsRef = ref(
            db,
            `doza_medics/${verifierId}/verificationPoints`,
          );
          const pointsSnap = await get(userPointsRef);
          const currentPoints = pointsSnap.exists()
            ? pointsSnap.val()
            : { totalPoints: 0, verifiedDrugs: 0 };
          await set(userPointsRef, {
            ...currentPoints,
            totalPoints: (currentPoints.totalPoints || 0) + pointsToAward,
            verifiedDrugs: (currentPoints.verifiedDrugs || 0) + 1,
            lastUpdated: timestamp,
          });
          await set(
            ref(db, `doza_medics/${verifierId}/verificationHistory/${drugId}`),
            {
              drugId,
              drugName: updateData.genericName || existing.genericName,
              pointsEarned: pointsToAward,
              status: "verified",
              confidenceScore:
                updateData.confidenceScore || existing.confidenceScore,
              verifiedAt: timestamp,
              action: "REVIEW_APPROVED",
            },
          );
          logger.info(
            { verifierId, pointsToAward },
            "Awarded points for verification",
          );
        }
      }
    }

    await set(drugRef, updateData);

    // Audit log via shared utility
    await writeAuditLog({
      centerId:
        existing.centerId || request.headers.get("x-center-id") || "unknown",
      userId,
      userName,
      userRole: request.headers.get("x-user-role") || "staff",
      action: "update",
      resource: "drug",
      resourceId: drugId,
      details: `Updated drug: ${existing.genericName || drugId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Also store detailed audit in dedicated node
    await set(ref(db, `doza_drugsdb/${drugId}/auditLogs/${Date.now()}`), {
      action: "UPDATE",
      userId,
      userName,
      timestamp,
      changes: Object.keys(drugData || {}),
      reason,
      previousData: existing,
      newData: updateData,
    });

    // Invalidate cache
    cache.set(`drug:${drugId}`, null, 0);

    logger.info({ drugId, userId }, "Drug updated");
    return NextResponse.json({
      success: true,
      data: { id: drugId, ...updateData },
      message: "Drug updated successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, drugId, userId }, "Error updating drug");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- DELETE (mutation – with audit) ----------
export async function DELETE(
  request: NextRequest,
  context: { params: { drugId: string } },
) {
  let drugId = "";
  let userId = "";
  try {
    const p = await context.params;
    drugId = p.drugId;
    if (!drugId) {
      return NextResponse.json(
        { success: false, error: "Drug ID is required" },
        { status: 400 },
      );
    }

    const userIdHeader = await getUserId(request);
    const userRole = request.headers.get("x-user-role");
    if (!userIdHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }
    userId = userIdHeader;

    const rateKey = `${userId}:drug-delete:${drugId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    if (userRole !== "super_admin" && userRole !== "hospital_admin") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Insufficient permissions. Only administrators can delete drugs.",
        },
        { status: 403 },
      );
    }

    const drugRef = ref(db, `doza_drugsdb/drugs/${drugId}`);
    const snapshot = await get(drugRef);
    if (!snapshot.exists()) {
      logger.warn({ drugId }, "Drug not found for deletion");
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();
    const timestamp = new Date().toISOString();

    // Soft delete
    const deleteData = {
      ...existing,
      status: "deleted",
      deletedAt: timestamp,
      deletedBy: userId,
      isActive: false,
      updatedAt: timestamp,
    };
    await set(drugRef, deleteData);

    // Audit log via shared utility
    await writeAuditLog({
      centerId:
        existing.centerId || request.headers.get("x-center-id") || "unknown",
      userId,
      userName: request.headers.get("x-user-name") || "Unknown",
      userRole: request.headers.get("x-user-role") || "admin",
      action: "delete",
      resource: "drug",
      resourceId: drugId,
      details: `Deleted drug: ${existing.genericName || drugId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Detailed audit
    await set(ref(db, `doza_drugsdb/${drugId}/auditLogs/${Date.now()}`), {
      action: "DELETE",
      userId,
      userRole,
      timestamp,
      reason: "Admin deletion",
      previousData: existing,
    });

    // Update stats
    const statsRef = ref(db, "doza_drugsdb/_stats");
    const statsSnap = await get(statsRef);
    const currentStats = statsSnap.exists()
      ? statsSnap.val()
      : { deletedDrugs: 0 };
    await set(statsRef, {
      ...currentStats,
      deletedDrugs: (currentStats.deletedDrugs || 0) + 1,
      lastUpdated: timestamp,
    });

    // Invalidate cache
    cache.set(`drug:${drugId}`, null, 0);

    logger.info({ drugId, userId }, "Drug soft-deleted");
    return NextResponse.json({
      success: true,
      message: "Drug marked as deleted successfully",
      data: { drugId, deletedAt: timestamp, deletedBy: userId },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, drugId, userId }, "Error deleting drug");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- POST (Review – mutation with audit) ----------
export async function POST(
  request: NextRequest,
  context: { params: { drugId: string } },
) {
  let drugId = "";
  let userId = "";
  let userName = "";
  try {
    const p = await context.params;
    drugId = p.drugId;
    if (!drugId) {
      return NextResponse.json(
        { success: false, error: "Drug ID is required" },
        { status: 400 },
      );
    }

    const userIdHeader = await getUserId(request);
    const userNameHeader = request.headers.get("x-user-name");
    if (!userIdHeader || !userNameHeader) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }
    userId = userIdHeader;
    userName = userNameHeader;

    const rateKey = `${userId}:drug-review:${drugId}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = reviewSchema.parse(body);
    const { comment, rating, feedback } = validated;

    const drugRef = ref(db, `doza_drugsdb/drugs/${drugId}`);
    const snapshot = await get(drugRef);
    if (!snapshot.exists()) {
      logger.warn({ drugId }, "Drug not found for review");
      return NextResponse.json(
        { success: false, error: "Drug not found" },
        { status: 404 },
      );
    }

    const existing = snapshot.val();
    const timestamp = new Date().toISOString();
    const reviewId = `review_${Date.now()}`;
    const reviewData = {
      id: reviewId,
      drugId,
      userId,
      userName,
      comment,
      rating,
      feedback,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await set(
      ref(db, `doza_drugsdb/${drugId}/reviews/${reviewId}`),
      reviewData,
    );

    // Update drug review stats
    const updatedDrug = {
      ...existing,
      reviewCount: (existing.reviewCount || 0) + 1,
      averageRating: existing.averageRating
        ? (existing.averageRating * (existing.reviewCount || 0) + rating) /
          ((existing.reviewCount || 0) + 1)
        : rating,
      updatedAt: timestamp,
    };
    await set(drugRef, updatedDrug);

    // Audit log
    await writeAuditLog({
      centerId:
        existing.centerId || request.headers.get("x-center-id") || "unknown",
      userId,
      userName,
      userRole: request.headers.get("x-user-role") || "staff",
      action: "review",
      resource: "drug",
      resourceId: drugId,
      details: `Added review for drug: ${existing.genericName || drugId}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Invalidate cache
    cache.set(`drug:${drugId}`, null, 0);

    logger.info({ drugId, reviewId, userId }, "Review added");
    return NextResponse.json({
      success: true,
      data: reviewData,
      message: "Review added successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, drugId, userId }, "Error adding review");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
