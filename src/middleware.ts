import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/",
  "/tools",
  "/tools/dashboard",
  "/categories",
  "/search",
  "/blog",
  "/companies",
  "/compare",
  "/collections",
  "/tags",
  "/use-cases",
  "/pricing",
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/api",
  "/api/tools/analytics",
  "/api/affiliate",
  "/go",
];
const AUTH_PATHS = ["/auth/signin", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/error"];
const ADMIN_PATHS = ["/admin"];
const MERCHANT_ANALYTICS_PATH = "/admin/merchant-analytics";

// Strict admin-only routes (financial data, user management, system settings)
const STRICT_ADMIN_ROUTES = [
  "/admin/revenue",
  "/admin/users",
  "/admin/roles",
  "/admin/settings",
  "/admin/subscriptions",
  "/admin/affiliates",
  "/admin/ads",
  "/admin/coupons",
  "/admin/seo",
  "/admin/seo-pages",
  "/admin/notifications",
  "/admin/media",
  "/admin/growth-report",
  "/admin/analytics",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await auth();
  const user = session?.user;

  // Allow public API paths
  if (pathname.startsWith("/api") && PUBLIC_PATHS.includes("/api")) {
    return NextResponse.next();
  }

  // Allow merchant analytics with token (token-based auth, no session required)
  if (pathname.startsWith(MERCHANT_ANALYTICS_PATH) && !pathname.includes("/api/")) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // Check if it's an admin path
    if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      if (!user) {
        return NextResponse.redirect(new URL("/auth/signin", request.url));
      }
      
      const userRole = user.role || "USER";
      
      // Strict admin routes - only ADMIN role can access
      if (STRICT_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
        if (userRole !== "ADMIN") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
      } else {
        // Regular admin routes - ADMIN or EDITOR can access
        if (userRole !== "ADMIN" && userRole !== "EDITOR") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Auth paths - redirect if already logged in
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected paths - require authentication
  if (!user) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};