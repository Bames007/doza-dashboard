// app/api/centers/[id]/prescriptions/patient/[phone]/route.ts
// URL: /api/centers/[id]/prescriptions/patient/[phone]
// Method: GET

import { NextRequest, NextResponse } from "next/server";
import { ref, get, set } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import {
  unauthorized,
  tooManyRequests,
  handleError,
} from "@/app/lib/apiHelpers";

// ========== TYPE DEFINITIONS ==========
interface RegistrationProfile {
  fname?: string;
  lname?: string;
  phone?: string;
  email?: string;
  gender?: string;
  age?: string;
  selectedImage?: string;
  sosOneName?: string;
  sosOnePhone?: string;
  sosTwoName?: string;
  sosTwoPhone?: string;
  bloodGroup?: string;
  genotype?: string;
}

interface PersonalProfile {
  fname?: string;
  lname?: string;
  phone?: string;
  gender?: string;
  age?: string;
  selectedImage?: string;
  sosOneName?: string;
  sosOnePhone?: string;
  sosTwoName?: string;
  sosTwoPhone?: string;
  bloodGroup?: string;
  genotype?: string;
}

interface MedicalBio {
  bloodGroup?: string;
  genotype?: string;
  height?: string;
  weight?: string;
  sosOneName?: string;
  sosOnePhone?: string;
  sosTwoName?: string;
  sosTwoPhone?: string;
}

interface MedicalProfile {
  allergies?: string;
  asthma?: boolean;
  diabetic?: boolean;
  heartDisease?: boolean;
  hypertension?: boolean;
  smoker?: boolean;
  ulcer?: boolean;
}

interface UserData {
  registrationProfile?: RegistrationProfile;
  personalProfile?: PersonalProfile;
  medicalBio?: MedicalBio;
  medicalProfile?: MedicalProfile;
  encryptedFCMToken?: string;
  [key: string]: any;
}

interface Prescription {
  id: string;
  patientPhone?: string;
  patientName?: string;
  patientGender?: string;
  patientAge?: string;
  createdAt: string;
  medications?: any[];
  status?: string;
  [key: string]: any;
}

interface PrescriptionData {
  prescriptions: Prescription[];
  lastVisit: string | null;
  medicationCount: number;
}

interface ConsentRequest {
  id: string;
  centerId: string;
  medicId: string;
  medicName: string;
  medicAvatar?: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  status: "pending" | "accepted" | "declined";
  requestedAt: number;
  respondedAt?: number;
  message: string;
}

// ========== HELPER FUNCTIONS ==========
function getPhoneVariations(phone: string): string[] {
  const variations = new Set<string>();
  const digitsOnly = phone.replace(/\D/g, "");
  variations.add(digitsOnly);
  if (digitsOnly.length === 10) {
    variations.add("0" + digitsOnly);
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    variations.add(digitsOnly.substring(1));
  }
  return Array.from(variations);
}

const findUserByPhone = async (
  phone: string,
): Promise<[string | null, UserData | null]> => {
  try {
    const searchVariations = getPhoneVariations(phone);
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (!snapshot.exists()) {
      return [null, null];
    }
    const users = snapshot.val() as Record<string, UserData>;
    for (const [userId, userData] of Object.entries(users)) {
      const regPhone = userData.registrationProfile?.phone;
      const personalPhone = userData.personalProfile?.phone;
      if (regPhone) {
        const regPhoneDigits = regPhone.replace(/\D/g, "");
        for (const variation of searchVariations) {
          if (regPhoneDigits === variation) {
            return [userId, userData];
          }
        }
      }
      if (personalPhone) {
        const personalPhoneDigits = personalPhone.replace(/\D/g, "");
        for (const variation of searchVariations) {
          if (personalPhoneDigits === variation) {
            return [userId, userData];
          }
        }
      }
    }
    return [null, null];
  } catch (error) {
    logger.error({ error, phone }, "Error finding user by phone");
    return [null, null];
  }
};

const extractProfileInfo = (user: UserData | null, phone: string) => {
  if (!user) {
    return {
      name: "Patient (Profile Not Found)",
      avatar: "",
      phone: phone,
      gender: "",
      age: "",
      consentStatus: "none" as const,
    };
  }
  const regProfile = user.registrationProfile || {};
  const personalProfile = user.personalProfile || {};
  const medicalBio = user.medicalBio || {};
  const medicalProfile = user.medicalProfile || {};
  const primaryProfile = personalProfile.fname ? personalProfile : regProfile;
  const name =
    `${primaryProfile.fname || ""} ${primaryProfile.lname || ""}`.trim() ||
    "Doza User";
  return {
    name,
    avatar: primaryProfile.selectedImage || "",
    phone: primaryProfile.phone || phone,
    gender: primaryProfile.gender || "",
    age: primaryProfile.age || "",
    email: regProfile.email || "",
    bloodGroup:
      medicalBio.bloodGroup ||
      personalProfile.bloodGroup ||
      regProfile.bloodGroup ||
      "",
    genotype:
      medicalBio.genotype ||
      personalProfile.genotype ||
      regProfile.genotype ||
      "",
    allergies: medicalProfile.allergies || "",
    medicalConditions: {
      asthma: Boolean(medicalProfile.asthma),
      diabetic: Boolean(medicalProfile.diabetic),
      heartDisease: Boolean(medicalProfile.heartDisease),
      hypertension: Boolean(medicalProfile.hypertension),
      smoker: Boolean(medicalProfile.smoker),
      ulcer: Boolean(medicalProfile.ulcer),
    },
    emergencyContacts: {
      primary: {
        name:
          personalProfile.sosOneName ||
          regProfile.sosOneName ||
          medicalBio.sosOneName ||
          "",
        phone:
          personalProfile.sosOnePhone ||
          regProfile.sosOnePhone ||
          medicalBio.sosOnePhone ||
          "",
      },
      secondary:
        personalProfile.sosTwoName ||
        regProfile.sosTwoName ||
        medicalBio.sosTwoName
          ? {
              name:
                personalProfile.sosTwoName ||
                regProfile.sosTwoName ||
                medicalBio.sosTwoName ||
                "",
              phone:
                personalProfile.sosTwoPhone ||
                regProfile.sosTwoPhone ||
                medicalBio.sosTwoPhone ||
                "",
            }
          : null,
    },
    height: medicalBio.height || "",
    weight: medicalBio.weight || "",
  };
};

const checkConsentStatus = async (
  patientId: string,
  centerId: string,
): Promise<"pending" | "accepted" | "declined" | "none"> => {
  try {
    const consentRef = ref(db, `users/${patientId}/consents/${centerId}`);
    const snapshot = await get(consentRef);
    if (snapshot.exists()) {
      const consent = snapshot.val();
      return consent.status || "none";
    }
    return "none";
  } catch (error) {
    logger.error({ error, patientId, centerId }, "Error checking consent");
    return "none";
  }
};

const createConsentRequest = async (
  centerId: string,
  medicId: string,
  medicName: string,
  patientId: string,
  patientProfile: UserData,
  patientPhone: string,
) => {
  try {
    const displayInfo = extractProfileInfo(patientProfile, patientPhone);
    const consentRequest: ConsentRequest = {
      id: `CONSENT-${Date.now()}`,
      centerId,
      medicId,
      medicName,
      patientId,
      patientName: displayInfo.name,
      patientPhone,
      status: "pending",
      requestedAt: Date.now(),
      message: `${medicName} wants to send you a prescription.`,
    };
    await set(
      ref(db, `users/${patientId}/consents/${centerId}`),
      consentRequest,
    );
    logger.info({ patientId, centerId }, "Consent request created");
  } catch (error) {
    logger.error(
      { error, patientId, centerId },
      "Error creating consent request",
    );
    throw error;
  }
};

const getPatientPrescriptions = async (
  centerId: string,
  phone: string,
): Promise<PrescriptionData> => {
  try {
    const prescriptionsRef = ref(db, `doza_centers/${centerId}/prescriptions`);
    const snapshot = await get(prescriptionsRef);
    if (!snapshot.exists()) {
      return { prescriptions: [], lastVisit: null, medicationCount: 0 };
    }
    const data = snapshot.val();
    const prescriptions: Prescription[] = [];
    let lastVisit: string | null = null;
    let medicationCount = 0;
    const searchVariations = getPhoneVariations(phone);
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      const rxPhoneDigits = value.patientPhone?.replace(/\D/g, "") || "";
      if (searchVariations.includes(rxPhoneDigits)) {
        prescriptions.push({ id: key, ...value });
        if (!lastVisit || new Date(value.createdAt) > new Date(lastVisit)) {
          lastVisit = value.createdAt;
        }
        medicationCount += value.medications?.length || 0;
      }
    });
    prescriptions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      prescriptions: prescriptions.slice(0, 10),
      lastVisit,
      medicationCount,
    };
  } catch (error) {
    logger.error(
      { error, centerId, phone },
      "Error getting patient prescriptions",
    );
    return { prescriptions: [], lastVisit: null, medicationCount: 0 };
  }
};

const initialPrescriptionData: PrescriptionData = {
  prescriptions: [],
  lastVisit: null,
  medicationCount: 0,
};

// ========== MAIN API ROUTE HANDLER ==========
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phone: string }> },
) {
  const { id: centerId, phone: encodedPhone } = await params;
  const phone = decodeURIComponent(encodedPhone);
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return unauthorized();

    if (!phone || phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number" },
        { status: 400 },
      );
    }

    const rateKey = `${userId}:patient-prescription:${centerId}:${phone}`;
    if (!rateLimiter.check(rateKey, 20, 60)) return tooManyRequests();

    const cacheKey = `patientPrescription:${centerId}:${phone}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ centerId, phone }, "Patient prescription data from cache");
      return NextResponse.json({ success: true, data: cached });
    }

    const medicName = request.headers.get("x-medic-name") || "Provider";

    // Find the user
    const [patientId, userData] = await findUserByPhone(phone);
    const isDozaUser = !!patientId && !!userData;

    let consentStatus: "pending" | "accepted" | "declined" | "none" = "none";
    let patientProfile = null;

    // Process Doza user
    if (isDozaUser && patientId) {
      consentStatus = await checkConsentStatus(patientId, centerId);
      patientProfile = extractProfileInfo(userData, phone);
      if (consentStatus === "none" && patientProfile) {
        try {
          await createConsentRequest(
            centerId,
            userId,
            medicName,
            patientId,
            userData,
            phone,
          );
          consentStatus = "pending";
        } catch (error) {
          logger.error(
            { error, centerId, patientId },
            "Failed to create consent request",
          );
        }
      }
    } else {
      patientProfile = {
        name: "Patient (Non-Doza User)",
        avatar: "",
        phone: phone,
        gender: "",
        age: "",
        consentStatus: "none" as const,
      };
    }

    // Get prescriptions (only if allowed)
    let prescriptionData: PrescriptionData;
    if (consentStatus === "accepted" || !isDozaUser) {
      prescriptionData = await getPatientPrescriptions(centerId, phone);
    } else {
      prescriptionData = initialPrescriptionData;
    }

    const response = {
      patientId,
      patientPhone: phone,
      isDozaUser,
      consentStatus,
      patientProfile,
      prescriptions: prescriptionData.prescriptions,
      lastVisit: prescriptionData.lastVisit,
      statistics: {
        totalPrescriptions: prescriptionData.prescriptions.length,
        medicationCount: prescriptionData.medicationCount,
        activePrescriptions: prescriptionData.prescriptions.filter(
          (p) => p.status === "ACTIVE" || p.status === "active",
        ).length,
        completedPrescriptions: prescriptionData.prescriptions.filter(
          (p) => p.status === "COMPLETED" || p.status === "completed",
        ).length,
      },
    };

    cache.set(cacheKey, response, 10);

    logger.info(
      {
        centerId,
        phone,
        isDozaUser,
        patientName: response.patientProfile?.name,
      },
      "Patient prescription data fetched",
    );
    return NextResponse.json({
      success: true,
      data: response,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-user-id, x-medic-name",
    },
  });
}
