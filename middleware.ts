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
    // Exclude error pages
    "/((?!customer/error|customer/invalid-qr|customer/expired-qr).*)",
  ],
};
