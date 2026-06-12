import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth?.token;
    const role = token?.role as string | undefined;
    const { pathname } = req.nextUrl;

    // 1. ADMIN - Full access, no restrictions
    if (role === "ADMIN") {
      return NextResponse.next();
    }

    // 2. MANAGER
    if (role === "MANAGER") {
      // MANAGER cannot access admin settings, billing, accounts, or reports
      if (
        pathname.startsWith("/admin/settings") ||
        pathname.startsWith("/admin/tds") ||
        pathname.startsWith("/admin/narrations") ||
        pathname.startsWith("/admin/users") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/accounts") ||
        pathname.startsWith("/reports")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // 3. OPERATOR
    if (role === "OPERATOR") {
      // OPERATOR cannot access admin utilities, billing, accounting ledger/vouchers, or master configs
      if (
        pathname.startsWith("/admin/settings") ||
        pathname.startsWith("/admin/tds") ||
        pathname.startsWith("/admin/narrations") ||
        pathname.startsWith("/admin/users") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/accounts") ||
        pathname.startsWith("/masters")
      ) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    // 4. GATEKEEPER
    if (role === "GATEKEEPER") {
      // GATEKEEPER can only access weighment screen, gate pass creation, and basic dashboard stats
      const isAllowed =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/api/") ||
        pathname === "/inward/mr-entry" ||
        pathname === "/outward/gp-entry" ||
        pathname === "/outward/simple-gp-summary" ||
        pathname === "/unauthorized";

      if (!isAllowed) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public paths that don't require authentication
        const publicPaths = [
          "/admin/login",
          "/admin/register",
          "/api/admin/register",
          "/api/admin/forgot-password",
          "/unauthorized",
        ];

        // If the current path is public, starts with /api/auth, or starts with /api/client, allow access
        if (
          publicPaths.includes(pathname) || 
          pathname.startsWith("/api/auth") || 
          pathname.startsWith("/api/client")
        ) {
          return true;
        }

        // Otherwise, require a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/admin/login",
    },
  }
);

export const config = {
  matcher: ["/((?!api/auth|api/client|api/admin/register|api/admin/forgot-password|admin/login|admin/register|_next/static|_next/image|favicon.ico).*)"],
};

