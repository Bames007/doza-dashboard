// app/api/debug/route.ts
import { NextRequest, NextResponse } from "next/server";
import logger from "@/app/utils/logger";

export async function GET(request: NextRequest) {
  try {
    logger.info("Debug endpoint called");
    return NextResponse.json({
      success: true,
      message: "Debug endpoint working",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg }, "Debug endpoint failed");
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 },
    );
  }
}
