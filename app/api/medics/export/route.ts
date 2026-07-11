// app/api/medics/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import { Parser } from "@json2csv/plainjs/index.js";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";

// ---------- Zod Schema ----------
const exportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).optional().default("json"),
  status: z.string().optional(),
});

// ---------- Helpers ----------
function flattenMedicForCSV(medic: any) {
  return {
    "Medic ID": medic.id || "",
    "First Name": medic.personalInfo?.firstName || "",
    "Last Name": medic.personalInfo?.lastName || "",
    Email: medic.personalInfo?.email || "",
    Phone: medic.personalInfo?.phone || "",
    "Date of Birth": medic.personalInfo?.dateOfBirth || "",
    Gender: medic.personalInfo?.gender || "",
    "Professional Role": medic.professionalInfo?.role || "",
    "License Number": medic.professionalInfo?.licenseNumber || "",
    "Years of Experience": medic.professionalInfo?.yearsOfExperience || "",
    Specialties: medic.professionalInfo?.specialties?.join(", ") || "",
    Qualifications: medic.professionalInfo?.qualifications?.join(", ") || "",
    "Hourly Rate (NGN)": medic.practiceInfo?.hourlyRate || "",
    "Consultation Types": medic.practiceInfo?.consultationTypes
      ? Object.keys(medic.practiceInfo.consultationTypes)
          .filter((key) => medic.practiceInfo.consultationTypes[key])
          .join(", ")
      : "",
    "Available Days": medic.practiceInfo?.availability?.days?.join(", ") || "",
    Languages: medic.practiceInfo?.languages?.join(", ") || "",
    Address: medic.location?.address || "",
    City: medic.location?.city || "",
    State: medic.location?.state || "",
    Country: medic.location?.country || "",
    "Service Radius (km)": medic.location?.serviceRadius || "",
    Status: medic.status || "",
    Verified: medic.credentials?.verified || false,
    "Created At": medic.createdAt || "",
    "Last Updated": medic.lastUpdated || "",
    "Rejection Reason": medic.rejectionReason || "",
    "Verification Notes": medic.verificationNotes || "",
  };
}

// ---------- GET ----------
export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 },
      );
    }

    // Validate query params
    const { searchParams } = new URL(request.url);
    const params = {
      format: searchParams.get("format") || "json",
      status: searchParams.get("status") || undefined,
    };

    let validated: { format: "json" | "csv"; status?: string };
    try {
      validated = exportQuerySchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }
      throw error;
    }

    const { format, status } = validated;

    // Rate limit: 20 requests per minute (exports are heavier)
    const rateKey = `${adminId}:medics-export`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ adminId }, "Medics export rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache JSON responses (CSV is not cached because it's a download)
    const cacheKey = `medicsExport:${JSON.stringify({ status, format })}`;
    if (format === "json") {
      const cached = cache.get<any>(cacheKey);
      if (cached) {
        logger.debug({ adminId }, "Medics export (JSON) from cache");
        return NextResponse.json({ success: true, ...cached, fromCache: true });
      }
    }

    logger.info({ adminId, format, status }, "Exporting medic data");

    // Fetch medics
    const medicsRef = ref(db, "doza_medics");
    const snapshot = await get(medicsRef);

    let medics: any[] = [];
    if (snapshot.exists()) {
      const medicsData = snapshot.val();
      medics = Object.keys(medicsData).map((key) => ({
        id: key,
        ...medicsData[key],
      }));

      if (status && status !== "all") {
        medics = medics.filter((m) => m.status === status);
      }
    }

    const exportedAt = new Date().toISOString();

    if (format === "csv") {
      const flattened = medics.map(flattenMedicForCSV);
      const parser = new Parser();
      const csv = parser.parse(flattened);

      logger.info(
        { adminId, count: medics.length },
        "Medics CSV export completed",
      );
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="medics_export_${exportedAt.split("T")[0]}.csv"`,
        },
      });
    }

    // JSON response
    const jsonResult = {
      data: medics,
      count: medics.length,
      exportedAt,
    };

    if (format === "json") {
      cache.set(cacheKey, jsonResult, 30);
    }

    logger.info(
      { adminId, count: medics.length },
      "Medics JSON export completed",
    );
    return NextResponse.json({ success: true, ...jsonResult });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error exporting medic data");
    return NextResponse.json(
      { success: false, error: msg || "Failed to export medic data" },
      { status: 500 },
    );
  }
}
