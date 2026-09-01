// app/api/centers/[id]/prescriptions/patient/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ref, get, query, orderByChild, equalTo } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let centerId = "";
  try {
    const { id } = await params;
    centerId = id;
    if (!centerId) {
      return NextResponse.json(
        { success: false, error: "Center ID is required" },
        { status: 400 },
      );
    }

    const userId = request.headers.get("x-user-id");
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 },
      );
    }

    if (!phone && !name) {
      return NextResponse.json(
        { success: false, error: "Phone or name is required" },
        { status: 400 },
      );
    }

    // Rate limit
    const rateKey = `${userId}:patient-search:${centerId}:${phone || ""}:${name || ""}`;
    if (!rateLimiter.check(rateKey, 20, 60)) {
      logger.warn({ userId, centerId }, "Patient search rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Cache
    const cacheKey = `patientSearch:${centerId}:${phone || ""}:${name || ""}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId }, "Patient search from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    let results: any[] = [];

    // Search in doza/users database
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.entries(users).forEach(([userId, user]: [string, any]) => {
        const regProfile = user.registrationProfile || user.personalProfile;
        if (!regProfile) return;

        const matchesPhone = phone && regProfile.phone?.includes(phone);
        const matchesName =
          name &&
          (regProfile.fname?.toLowerCase().includes(name.toLowerCase()) ||
            regProfile.lname?.toLowerCase().includes(name.toLowerCase()) ||
            `${regProfile.fname || ""} ${regProfile.lname || ""}`
              .toLowerCase()
              .includes(name.toLowerCase()));

        if (matchesPhone || matchesName) {
          results.push({
            id: userId,
            name: `${regProfile.fname || ""} ${regProfile.lname || ""}`.trim(),
            phone: regProfile.phone,
            email: regProfile.email,
            gender: regProfile.gender,
            age: regProfile.age,
            isDozaUser: true,
            profile: {
              avatar: regProfile.selectedImage,
              bloodGroup: user.medicalBio?.bloodGroup,
              genotype: user.medicalBio?.genotype,
              lastVisit: null,
            },
          });
        }
      });
    }

    // Also search existing prescriptions for non-Doza users
    const prescriptionsRef = ref(db, `doza_centers/${centerId}/prescriptions`);
    const prescriptionsSnap = await get(prescriptionsRef);
    if (prescriptionsSnap.exists()) {
      const prescriptions = prescriptionsSnap.val();
      const seenPhones = new Set();
      Object.entries(prescriptions).forEach(
        ([_, prescription]: [string, any]) => {
          const matchesPhone =
            phone && prescription.patientPhone?.includes(phone);
          const matchesName =
            name &&
            prescription.patientName
              ?.toLowerCase()
              .includes(name.toLowerCase());
          if ((matchesPhone || matchesName) && !prescription.isDozaUser) {
            const patientPhone = prescription.patientPhone;
            if (!seenPhones.has(patientPhone)) {
              seenPhones.add(patientPhone);
              results.push({
                id: `non-dozauser-${patientPhone}`,
                name: prescription.patientName,
                phone: patientPhone,
                email: prescription.patientEmail,
                gender: prescription.patientGender,
                age: prescription.patientAge,
                isDozaUser: false,
                profile: {
                  lastVisit: prescription.createdAt,
                  prescriptionCount: 0,
                },
              });
            }
          }
        },
      );
    }

    // Calculate prescription count for each patient
    await Promise.all(
      results.map(async (patient) => {
        const presQuery = query(
          ref(db, `doza_centers/${centerId}/prescriptions`),
          orderByChild("patientPhone"),
          equalTo(patient.phone),
        );
        const presSnap = await get(presQuery);
        if (presSnap.exists()) {
          patient.profile.prescriptionCount = Object.keys(
            presSnap.val(),
          ).length;
          const prescriptions = Object.values(presSnap.val()) as any[];
          if (prescriptions.length > 0) {
            const latest = prescriptions.reduce((latest, current) =>
              new Date(current.createdAt) > new Date(latest.createdAt)
                ? current
                : latest,
            );
            patient.profile.lastVisit = latest.createdAt;
          }
        }
      }),
    );

    // Cache for 30 seconds
    cache.set(cacheKey, results, 30);
    logger.info(
      { centerId, count: results.length },
      "Patient search completed",
    );
    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        dozaUsers: results.filter((r) => r.isDozaUser).length,
        nonDozaUsers: results.filter((r) => !r.isDozaUser).length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, centerId }, "Error searching patients");
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
