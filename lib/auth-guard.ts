import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export type UserRole = "ADMIN" | "MANAGER" | "OPERATOR" | "GATEKEEPER" | "ACCOUNTANT" | "CUSTOMER";

export function getManagerLevel(name?: string): number {
  if (!name) return 3; // Default to Level 3 (Legacy/Full access)
  if (name.startsWith("[M1]")) return 1;
  if (name.startsWith("[M2]")) return 2;
  if (name.startsWith("[M3]")) return 3;
  return 3;
}

/**
 * Verifies if the logged-in user is authenticated and has one of the allowed roles.
 */
export async function verifyRole(allowedRoles: UserRole[], req?: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 }),
      session: null,
    };
  }

  const userRole = (session.user as any).role as UserRole | undefined;
  const userName = session.user.name || "";

  if (!userRole || !allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden. Access Denied." }, { status: 403 }),
      session,
    };
  }

  // Manager Restrictions
  if (userRole === "MANAGER" && req) {
    const level = getManagerLevel(userName);
    const method = req.method.toUpperCase();
    const urlObj = new URL(req.url);
    const path = urlObj.pathname;

    // Manager 1 (Junior): 
    // - Edit/Delete (PUT, PATCH, DELETE) completely blocked.
    // - Masters creation/modifications completely blocked.
    // - Allowed: GET for all allowed pages, POST for transaction entry (e.g. Inward/Outward MR/GP/Lot)
    if (level === 1) {
      if (method === "DELETE" || method === "PUT" || method === "PATCH") {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: "Forbidden: Manager Level 1 does not have edit or delete permissions." },
            { status: 403 }
          ),
          session,
        };
      }
      if (method === "POST") {
        const isAllowedPost = 
          path.startsWith("/api/inward/mr") || 
          path.startsWith("/api/outward/gp") || 
          path.startsWith("/api/inward/lot");
        if (!isAllowedPost) {
          return {
            authorized: false,
            response: NextResponse.json(
              { error: "Forbidden: Manager Level 1 cannot create master/billing configurations." },
              { status: 403 }
            ),
            session,
          };
        }
      }
    }

    // Manager 2 (Mid-level):
    // - DELETE operations completely blocked.
    if (level === 2) {
      if (method === "DELETE") {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: "Forbidden: Manager Level 2 does not have delete permissions." },
            { status: 403 }
          ),
          session,
        };
      }
    }
  }

  return {
    authorized: true,
    response: null,
    session,
  };
}

/**
 * Verifies if the logged-in user has permission, with specific method-level restrictions.
 * For example: GATEKEEPER is allowed to POST (create) but blocked for PUT/PATCH/DELETE (update/delete).
 */
export async function verifyGatekeeperCreateOnly(req: Request, allowedRoles: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 }),
      session: null,
    };
  }

  const userRole = (session.user as any).role as UserRole | undefined;
  const userName = session.user.name || "";

  if (!userRole) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden. Access Denied." }, { status: 403 }),
      session,
    };
  }

  // Enforce method-level restriction for GATEKEEPER
  if (userRole === "GATEKEEPER") {
    if (req.method !== "POST" && req.method !== "GET") {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Gatekeeper does not have edit or delete permissions." },
          { status: 403 }
        ),
        session,
      };
    }
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden. Access Denied." }, { status: 403 }),
      session,
    };
  }

  // Manager Restrictions
  if (userRole === "MANAGER") {
    const level = getManagerLevel(userName);
    const method = req.method.toUpperCase();
    const urlObj = new URL(req.url);
    const path = urlObj.pathname;

    if (level === 1) {
      if (method === "DELETE" || method === "PUT" || method === "PATCH") {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: "Forbidden: Manager Level 1 does not have edit or delete permissions." },
            { status: 403 }
          ),
          session,
        };
      }
      if (method === "POST") {
        const isAllowedPost = 
          path.startsWith("/api/inward/mr") || 
          path.startsWith("/api/outward/gp") || 
          path.startsWith("/api/inward/lot");
        if (!isAllowedPost) {
          return {
            authorized: false,
            response: NextResponse.json(
              { error: "Forbidden: Manager Level 1 cannot create master/billing configurations." },
              { status: 403 }
            ),
            session,
          };
        }
      }
    }

    if (level === 2) {
      if (method === "DELETE") {
        return {
          authorized: false,
          response: NextResponse.json(
            { error: "Forbidden: Manager Level 2 does not have delete permissions." },
            { status: 403 }
          ),
          session,
        };
      }
    }
  }

  return {
    authorized: true,
    response: null,
    session,
  };
}
