import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
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
  matcher: ["/((?!api/auth|api/client|api/admin/register|admin/login|admin/register|_next/static|_next/image|favicon.ico).*)"],
};

