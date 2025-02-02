import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

type QRCode = {
  expired_at: string | null;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for error/expired/invalid pages to prevent redirect loops
  if (
    pathname === "/customer/error" ||
    pathname === "/customer/invalid-qr" ||
    pathname === "/customer/expired-qr" ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  // Check if it's an admin route
  if (pathname.startsWith("/admin")) {
    const authenticated =
      request.cookies.get("authenticated")?.value === "true";
    const userRole = request.cookies.get("userRole")?.value;

    if (!authenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Role-based access control
    if (userRole === "staff") {
      if (!["/admin/order", "/admin/menu", "/admin/table"].includes(pathname)) {
        return NextResponse.redirect(new URL("/admin/menu", request.url));
      }
    } else if (userRole === "kitchen") {
      if (pathname !== "/admin/order") {
        return NextResponse.redirect(new URL("/admin/order", request.url));
      }
    } else if (userRole !== "admin") {
      // If role is not recognized, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  // Check if it's a customer path with UUID
  if (pathname.match(/^\/customer\/[a-f0-9-]{36}$/)) {
    const supabase = createMiddlewareClient({
      req: request,
      res: NextResponse.next(),
    });

    // Extract UUID from path
    const orderId = pathname.split("/").pop();

    try {
      const { data: qrCode, error } = await supabase
        .from("qr_codes")
        .select("expired_at")
        .eq("order_id", orderId)
        .single();

      if (error) {
        console.error("Error checking QR code:", error);
        return NextResponse.redirect(
          new URL("/customer/expired-qr", request.url)
        );
      }

      if (!qrCode) {
        return NextResponse.redirect(
          new URL("/customer/invalid-qr", request.url)
        );
      }

      // Check expiration
      if (qrCode.expired_at) {
        const now = new Date();
        const expirationDate = new Date(qrCode.expired_at);

        if (now > expirationDate) {
          return NextResponse.redirect(
            new URL("/customer/expired-qr", request.url)
          );
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      return NextResponse.redirect(new URL("/customer/error", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match UUID pattern in customer routes
    "/customer/:uuid*",
    // Match all admin routes
    "/admin/:path*",
    // Exclude error pages and login page
    "/((?!customer/error|customer/invalid-qr|customer/expired-qr|admin/login).*)",
  ],
};
