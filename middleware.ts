// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type QRCode = {
  expired_at: string | null;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for error/expired/invalid pages to prevent redirect loops
  if (
    pathname === "/customer/error" ||
    pathname === "/customer/invalid-qr" ||
    pathname === "/customer/expired-qr"
  ) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match UUID pattern in customer routes
    "/customer/:uuid*",
    // Match all admin routes
    "/admin/:path*",
    // Exclude error pages
    "/((?!customer/error|customer/invalid-qr|customer/expired-qr).*)",
  ],
};
