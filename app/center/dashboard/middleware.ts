import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userSession = request.cookies.get("userSession")?.value;
  const authToken = request.cookies.get("authToken")?.value;

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!userSession || !authToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Protect API routes if needed
  if (request.nextUrl.pathname.startsWith("/api/secure")) {
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/secure/:path*"],
};
