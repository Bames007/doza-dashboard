import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Paths that require authentication
  const protectedPaths = ["/center", "/staff"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const authToken = request.cookies.get("authToken")?.value;
    const userSession = request.cookies.get("userSession")?.value;

    // If no auth token or session, redirect to login
    if (!authToken || !userSession) {
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Parse session to check expiration
      const session = JSON.parse(userSession);
      const expiresAt = session.user?.expiresAt || session.expiresAt;

      if (expiresAt && Date.now() > expiresAt) {
        // Session expired
        const loginUrl = new URL("/", request.url);
        loginUrl.searchParams.set("expired", "true");
        const response = NextResponse.redirect(loginUrl);

        // Clear cookies
        response.cookies.delete("authToken");
        response.cookies.delete("userSession");

        return response;
      }
    } catch (error) {
      // Invalid session format
      const loginUrl = new URL("/", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/center/:path*", "/staff/:path*", "/dashboard/:path*"],
};
