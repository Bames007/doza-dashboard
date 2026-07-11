// app/api/barcode/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ref, get } from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";
import logger from "@/app/utils/logger";
import { rateLimiter } from "@/app/lib/rateLimit";
import { z } from "zod";

// Helper to get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

const barcodeScanSchema = z.object({
  barcode: z.string().min(1, "Barcode is required").trim(),
  centerId: z.string().min(1, "Center ID is required").trim(),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateKey = `barcode:${ip}`;
    if (!rateLimiter.check(rateKey, 10, 60)) {
      logger.warn({ ip }, "Rate limit exceeded for barcode scan");
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const validated = barcodeScanSchema.parse(body);
    const { barcode, centerId, userId } = validated;

    logger.info({ barcode, centerId, userId }, "Barcode scan request");

    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);

    let product = null;
    let productId = null;

    if (snapshot.exists()) {
      const products = snapshot.val();
      for (const [id, p] of Object.entries(products as any)) {
        const prod = p as any;
        if (prod.barcode === barcode || prod.sku === barcode) {
          product = prod;
          productId = id;
          logger.info(
            { productId, productName: prod.name },
            "Product found by barcode",
          );
          break;
        }
      }
    } else {
      logger.warn({ centerId }, "No products found in center");
    }

    let barcodeType = "CUSTOM";
    const cleanBarcode = barcode.trim();
    if (/^\d{13}$/.test(cleanBarcode)) barcodeType = "EAN13";
    else if (/^\d{12}$/.test(cleanBarcode)) barcodeType = "UPC";
    else if (/^\d{8}$/.test(cleanBarcode)) barcodeType = "EAN8";
    else if (/^[0-9A-Z]{8,}$/.test(cleanBarcode)) barcodeType = "CODE128";
    if (cleanBarcode.startsWith("DZ") && cleanBarcode.length >= 8)
      barcodeType = "CUSTOM";

    const responseData = {
      success: true,
      data: {
        barcode: cleanBarcode,
        type: barcodeType,
        product,
        productId,
        timestamp: new Date().toISOString(),
        message: product
          ? `Product found: ${product.name}`
          : "No product found with this barcode",
      },
    };

    logger.info({ barcode, found: !!product }, "Barcode scan completed");
    return NextResponse.json(responseData);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn({ errors: error.issues }, "Barcode validation failed");
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    logger.error(
      { error: error.message, stack: error.stack },
      "Barcode scan error",
    );
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process barcode scan",
      },
      { status: 500 },
    );
  }
}

// GET endpoint for testing (also rate-limited)
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateKey = `barcode:get:${ip}`;
    if (!rateLimiter.check(rateKey, 10, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 },
      );
    }

    const url = new URL(request.url);
    const barcode = url.searchParams.get("barcode");
    const centerId = url.searchParams.get("centerId");

    if (!barcode || !centerId) {
      return NextResponse.json(
        { success: false, error: "Missing barcode or centerId parameter" },
        { status: 400 },
      );
    }

    const productsRef = ref(db, `doza_centers/${centerId}/products`);
    const snapshot = await get(productsRef);
    let product = null,
      productId = null;
    if (snapshot.exists()) {
      const products = snapshot.val();
      for (const [id, p] of Object.entries(products as any)) {
        const prod = p as any;
        if (prod.barcode === barcode || prod.sku === barcode) {
          product = prod;
          productId = id;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        barcode,
        product,
        productId,
        found: !!product,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "GET barcode scan error");
    return NextResponse.json(
      { success: false, error: error.message || "Failed to scan barcode" },
      { status: 500 },
    );
  }
}
