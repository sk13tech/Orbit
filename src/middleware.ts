import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // ── Security Headers (belt + suspenders with next.config.ts) ──
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // ── API route protection ──
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // CORS: block cross-origin requests to API
    if (origin && host && !origin.includes(host)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
      );
    }

    // CSRF: block non-GET requests without proper origin
    const method = request.method;
    if (method !== "GET" && method !== "HEAD") {
      if (!origin) {
        return NextResponse.json(
          { error: "Missing origin" },
          { status: 403, headers: { "X-Content-Type-Options": "nosniff" } }
        );
      }
    }

    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
