// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin")) {
    const authenticated = request.cookies.get("authenticated")?.value;
    const userRole = request.cookies.get("userRole")?.value;

    if (authenticated !== "true" || userRole !== "admin") {
      return NextResponse.redirect(new URL("/adminLogin", request.url));
    }
    return NextResponse.next();
  }

  if (path.startsWith("/customer")) {
    const deviceId = request.cookies.get("device_id")?.value;
    if (!deviceId) {
      return NextResponse.redirect(new URL("/customerLogin", request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*"],
};
