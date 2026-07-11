// app/api/check/route.ts
import { NextResponse } from "next/server";
import logger from "@/app/utils/logger";

export async function GET() {
  try {
    logger.info("Health check requested");
    return NextResponse.json({
      success: true,
      message: "API is healthy and running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Health check failed");
    return NextResponse.json(
      {
        success: false,
        error: "API check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
