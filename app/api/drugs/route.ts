// app/api/drugs/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, set, push } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { writeAuditLog, getClientIp } from "@/app/lib/auditLogger";

// ---------- Types ----------
interface Drug {
  id: string;
  genericName: string;
  brandNames?: string[];
  strength: string;
  dosageForm: string;
  manufacturer: string;
  nafdacNumber?: string;
  barcode?: string;
  status: string;
  confidenceScore?: number;
  tags?: string[];
  drugClass?: string[];
  verifiedBy?: {
    medicId: string;
    medicName: string;
    centerId?: string | null;
    centerName?: string | null;
    verificationDate: string;
  };
  [key: string]: any;
}

interface MedicPoints {
  totalPoints: number;
  verifiedDrugs: number;
  pendingReview: number;
  level: string;
  achievements: string[];
  lastUpdated: string;
}

interface DrugStats {
  totalDrugs: number;
  verifiedDrugs: number;
  pendingReview: number;
  needsMoreInfo: number;
  lastUpdated: string;
}

// ---------- Zod Schemas ----------
const drugCreateSchema = z.object({
  drugData: z
    .object({
      genericName: z.string().min(1, "Generic name required"),
      strength: z.string().min(1, "Strength required"),
      dosageForm: z.string().min(1, "Dosage form required"),
      drugClass: z.array(z.string()).optional(),
      // Allow any other fields
    })
    .passthrough(),
  submissionType: z
    .enum(["manual_verification", "bulk_import"])
    .optional()
    .default("manual_verification"),
});

// ---------- Helpers ----------
function calculateConfidenceScore(drugData: any): number {
  const requiredFields = [
    "genericName",
    "strength",
    "dosageForm",
    "manufacturer",
    "drugClass",
    "mechanismOfAction",
    "indications",
    "dosage",
    "sideEffects",
  ];
  const fieldWeights: Record<string, number> = {
    genericName: 15,
    strength: 10,
    dosageForm: 10,
    manufacturer: 10,
    drugClass: 8,
    mechanismOfAction: 12,
    indications: 12,
    contraindications: 8,
    sideEffects: 12,
    warnings: 6,
    interactions: 6,
    dosage: 12,
    administration: 8,
    "pharmacology.pharmacokinetics": 8,
    "pharmacology.pharmacodynamics": 8,
    storage: 5,
    pregnancyCategory: 5,
    breastfeedingSafety: 5,
    monitoringParameters: 5,
    references: 8,
  };
  let score = 0,
    totalWeight = 0;
  requiredFields.forEach((field) => {
    totalWeight += fieldWeights[field] || 10;
    const value = field.split(".").reduce((acc, part) => acc?.[part], drugData);
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value) && value.length > 0)
        score += fieldWeights[field] || 10;
      else if (!Array.isArray(value) && String(value).trim().length > 0)
        score += fieldWeights[field] || 10;
    }
  });
  return Math.min(100, Math.round((score / totalWeight) * 100));
}

// ---------- GET (search – read‑only, no audit) ----------
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("search") || "";
    const field = searchParams.get("field") || "name";

    if (!searchTerm.trim()) {
      return NextResponse.json(
        { success: false, error: "Search term is required" },
        { status: 400 },
      );
    }

    // Rate limit
    const rateKey = `${userId}:drugs-search:${searchTerm}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ userId, searchTerm }, "Drugs search rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `drugs:${searchTerm}:${field}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ searchTerm, field }, "Drugs search from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    // Field mapping
    const fieldMap: Record<string, string> = {
      name: "genericName",
      manufacturer: "manufacturer",
      nafdac: "nafdacNumber",
      barcode: "barcode",
    };
    const dbField = fieldMap[field] || field;

    const drugsRef = ref(db, "doza_drugsdb/drugs");
    const snapshot = await get(drugsRef);

    let drugList: Drug[] = [];
    if (snapshot.exists()) {
      const drugs = snapshot.val() as Record<string, Drug>;
      for (const [key, drugData] of Object.entries(drugs)) {
        const { id: _, ...rest } = drugData;
        drugList.push({
          id: key,
          ...rest,
        });
      }
    }

    // Filter
    const searchLower = searchTerm.toLowerCase();
    const filteredDrugs = drugList.filter((drug) => {
      const value = (drug as any)[dbField];
      if (!value) return false;
      if (Array.isArray(value)) {
        return value.some((item) =>
          item.toString().toLowerCase().includes(searchLower),
        );
      } else if (typeof value === "object" && value !== null) {
        return Object.values(value).some((val) =>
          val?.toString().toLowerCase().includes(searchLower),
        );
      } else {
        return value.toString().toLowerCase().includes(searchLower);
      }
    });

    filteredDrugs.sort(
      (a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0),
    );

    const result = {
      drugs: filteredDrugs,
      count: filteredDrugs.length,
      searchTerm,
      field,
    };

    cache.set(cacheKey, result, 30);
    logger.info(
      { searchTerm, count: filteredDrugs.length },
      "Drugs search completed",
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error searching drugs");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ---------- POST (mutation – with audit) ----------
export async function POST(request: NextRequest) {
  let medicId = "";
  let medicName = "";
  let centerId = "";
  try {
    const medicIdHeader = request.headers.get("x-medic-id");
    const medicNameHeader = request.headers.get("x-medic-name");
    const centerIdHeader = request.headers.get("x-center-id");

    if (!medicIdHeader || !medicNameHeader) {
      return NextResponse.json(
        { success: false, error: "Medic authentication required" },
        { status: 401 },
      );
    }
    medicId = medicIdHeader;
    medicName = medicNameHeader;
    centerId = centerIdHeader || "unknown";

    // Rate limit per medic
    const rateKey = `${medicId}:drug-create`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ medicId }, "Drug create rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = drugCreateSchema.parse(body);
    const { drugData, submissionType } = validated;

    const confidenceScore = calculateConfidenceScore(drugData);
    const drugId = uuidv4();
    const timestamp = new Date().toISOString();

    const manufacturer = String(drugData.manufacturer || "");

    const finalDrugData: Drug = {
      ...drugData,
      id: drugId,
      verifiedBy: {
        medicId,
        medicName,
        centerId: centerId || null,
        centerName: request.headers.get("x-center-name") || null,
        verificationDate: timestamp,
      },
      status: confidenceScore >= 70 ? "pending_review" : "needs_more_info",
      confidenceScore,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [
        drugData.drugClass?.[0] || "Uncategorized",
        drugData.dosageForm,
        ...(drugData.drugClass?.slice(1) || []),
      ],
      isActive: true,
      submissionType: submissionType || "manual_verification",
      manufacturer,
    };

    // Save drug
    const drugRef = ref(db, `doza_drugsdb/drugs/${drugId}`);
    await set(drugRef, finalDrugData);

    // Submission record for medic
    await set(ref(db, `doza_medics/${medicId}/submissions/${drugId}`), {
      drugId,
      drugName: drugData.genericName,
      submittedAt: timestamp,
      confidenceScore,
      status: finalDrugData.status,
      type: submissionType || "manual_verification",
      requiresReview: confidenceScore < 70,
    });

    // Update medic points
    const pointsRef = ref(db, `doza_medics/${medicId}/verificationPoints`);
    const pointsSnap = await get(pointsRef);
    let currentPoints: MedicPoints;
    if (pointsSnap.exists()) {
      const p = pointsSnap.val();
      currentPoints = {
        totalPoints: p.totalPoints || 0,
        verifiedDrugs: p.verifiedDrugs || 0,
        pendingReview: p.pendingReview || 0,
        level: p.level || "Beginner",
        achievements: p.achievements || [],
        lastUpdated: p.lastUpdated || timestamp,
      };
    } else {
      currentPoints = {
        totalPoints: 0,
        verifiedDrugs: 0,
        pendingReview: 0,
        level: "Beginner",
        achievements: [],
        lastUpdated: timestamp,
      };
    }
    await set(pointsRef, {
      ...currentPoints,
      pendingReview: (currentPoints.pendingReview || 0) + 1,
      lastUpdated: timestamp,
    });

    // Update drug stats
    const statsRef = ref(db, "doza_drugsdb/_stats");
    const statsSnap = await get(statsRef);
    let currentStats: DrugStats;
    if (statsSnap.exists()) {
      const s = statsSnap.val();
      currentStats = {
        totalDrugs: s.totalDrugs || 0,
        verifiedDrugs: s.verifiedDrugs || 0,
        pendingReview: s.pendingReview || 0,
        needsMoreInfo: s.needsMoreInfo || 0,
        lastUpdated: s.lastUpdated || timestamp,
      };
    } else {
      currentStats = {
        totalDrugs: 0,
        verifiedDrugs: 0,
        pendingReview: 0,
        needsMoreInfo: 0,
        lastUpdated: timestamp,
      };
    }
    await set(statsRef, {
      ...currentStats,
      totalDrugs: (currentStats.totalDrugs || 0) + 1,
      pendingReview: (currentStats.pendingReview || 0) + 1,
      lastUpdated: timestamp,
    });

    // Audit log
    await writeAuditLog({
      centerId,
      userId: medicId,
      userName: medicName,
      userRole: request.headers.get("x-user-role") || "medic",
      action: "create",
      resource: "drug",
      resourceId: drugId,
      details: `Created drug: ${drugData.genericName}`,
      status: "success",
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // Detailed audit log in dedicated node
    await push(ref(db, `auditLogs/drugVerifications/${drugId}`), {
      action: "DRUG_SUBMITTED",
      medicId,
      medicName,
      timestamp,
      status: finalDrugData.status,
      confidenceScore,
      details: {
        submissionType: submissionType || "manual_verification",
        hasImages: Array.isArray(drugData.images) && drugData.images.length > 0,
        hasReferences:
          Array.isArray(drugData.references) && drugData.references.length > 0,
      },
    });

    logger.info(
      { drugId, medicId, status: finalDrugData.status },
      "Drug created",
    );
    return NextResponse.json({
      success: true,
      data: {
        drugId,
        ...finalDrugData,
        message:
          confidenceScore >= 70
            ? "Drug submitted for review. Our team will verify it shortly."
            : "Drug submitted. Please provide more complete information for faster approval.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, medicId, centerId }, "Error creating drug");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
