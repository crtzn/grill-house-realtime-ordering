import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

// Define allowed paths for each role
const roleRoutes = {
  kitchen: ["/admin/order"],
  staff: ["/admin/order", "/admin/menu", "/admin/table", "/admin/activity"],
  admin: [
    "/admin",
    "/admin/order",
    "/admin/menu",
    "/admin/table",
    "/admin/activity",
    "/admin/setting",
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle admin routes
  if (pathname.startsWith("/admin")) {
    try {
      // Get the stored admin user from cookie
      const adminUserJson = request.cookies.get("adminUser")?.value;

      if (!adminUserJson) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const adminUser = JSON.parse(adminUserJson);

      if (!adminUser || !adminUser.role) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const userRole = adminUser.role as keyof typeof roleRoutes;
      const allowedRoutes = roleRoutes[userRole] || [];

      // Check if user has access to the requested path
      const hasAccess = allowedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );

      if (!hasAccess) {
        // Redirect to the first allowed route for their role
        return NextResponse.redirect(new URL(allowedRoutes[0], request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Skip middleware for error/expired/invalid pages to prevent redirect loops
  if (
    pathname === "/customer/expired-qr" ||
    pathname === "/customer/expired-qr" ||
    pathname === "/customer/expired-qr"
  ) {
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
          new URL("/customer/expired-qr", request.url)
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
      return NextResponse.redirect(
        new URL("/customer/expired-qr", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match admin routes
    "/admin/:path*",
    // Match UUID pattern in customer routes
    "/customer/:uuid*",
    // Exclude error pages
    "/((?!customer/error|customer/invalid-qr|customer/expired-qr).*)",
  ],
};
