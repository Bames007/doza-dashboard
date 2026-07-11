// app/api/medics/register/validate-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get, update } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { cache } from "@/app/lib/cache";
import { z } from "zod";
import { DozaInvitation, InvitationsMap } from "@/app/center/type";

// ---------- Zod Schema ----------
const validateTokenSchema = z.object({
  token: z.string().min(1, "Token required"),
  email: z.string().email("Valid email required"),
});

// ---------- Helpers ----------
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const userId = request.headers.get("x-user-id") || ip;
    const rateKey = `medic-validate:${userId}`;
    if (!rateLimiter.check(rateKey, 30, 60)) {
      logger.warn({ ip, userId }, "Medic validate token rate limit exceeded");
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    // Validate query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    try {
      validateTokenSchema.parse({ token, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: "Validation failed", details: error.issues },
          { status: 400 },
        );
      }
    }

    const cacheKey = `medicValidate:${token}:${email}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      logger.debug({ token, email }, "Token validation from cache");
      return NextResponse.json({ success: true, ...cached });
    }

    logger.info({ token, email }, "Validating invitation token");

    // Find invitation
    const invitationsRef = ref(db, "doza_invitations");
    const snapshot = await get(invitationsRef);
    let invitation: DozaInvitation | null = null;
    let invitationId: string | null = null;

    if (snapshot.exists()) {
      const invitations = snapshot.val() as InvitationsMap;
      for (const [id, inv] of Object.entries(invitations)) {
        if (
          inv &&
          typeof inv === "object" &&
          "token" in inv &&
          "email" in inv &&
          "status" in inv
        ) {
          if (inv.token === token && inv.email === email) {
            invitation = inv as DozaInvitation;
            invitationId = id;
            break;
          }
        }
      }
    }

    if (!invitation || !invitationId) {
      const result = {
        error: "Invalid or expired invitation",
        code: "INVITATION_NOT_FOUND",
      };
      cache.set(cacheKey, result, 30); // Cache invalid result briefly
      logger.warn({ token, email }, "Invitation not found");
      return NextResponse.json({ success: false, ...result }, { status: 404 });
    }

    // Check expiration
    const expiresAt = new Date(invitation.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      await update(ref(db, `doza_invitations/${invitationId}`), {
        status: "expired",
      });
      const result = {
        error: "Invitation has expired",
        code: "INVITATION_EXPIRED",
        expiresAt: invitation.expiresAt,
      };
      cache.set(cacheKey, result, 30);
      logger.warn(
        { token, email, expiresAt: invitation.expiresAt },
        "Invitation expired",
      );
      return NextResponse.json({ success: false, ...result }, { status: 410 });
    }

    // Check status
    if (invitation.status !== "pending") {
      const result = {
        error: `Invitation has been ${invitation.status}`,
        code: `INVITATION_${invitation.status.toUpperCase()}`,
        status: invitation.status,
      };
      cache.set(cacheKey, result, 30);
      logger.warn(
        { token, email, status: invitation.status },
        "Invitation already used",
      );
      return NextResponse.json({ success: false, ...result }, { status: 400 });
    }

    // Valid invitation
    const result = {
      valid: true,
      invitation: { ...invitation, id: invitationId },
      centerId: invitation.centerId,
      staffId: invitation.staffId,
      centerName: invitation.centerName,
    };

    cache.set(cacheKey, result, 30);
    logger.info({ token, email, invitationId }, "Token validated successfully");
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Error validating token");
    return NextResponse.json(
      {
        success: false,
        error: "Failed to validate token",
        code: "VALIDATION_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
