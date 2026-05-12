import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // 1. Try to find an existing User record
    let user = await prisma.user.findUnique({
      where: { username: username },
      include: { party: true }
    });

    // 2. If User not found, check if it's a new Farmer trying to login with Mobile No
    if (!user) {
      // Check if username and password are same (Mobile No logic)
      if (username === password) {
        // Look for a Party that has this mobile number in their mobiles array
        const party = await prisma.party.findFirst({
          where: {
            mobiles: { has: username }
          }
        });

        if (party) {
          // AUTO-CREATE a User record for this party
          user = await prisma.user.create({
            data: {
              name: party.tradeName,
              username: username,
              password: password, // In production, use bcrypt hashing!
              role: "CUSTOMER",
              partyId: party.id,
              status: true
            },
            include: { party: true }
          });
        }
      }
    }

    // 3. Final validation
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid Mobile Number or Password" }, { status: 401 });
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Access denied. Only customers can login here." }, { status: 403 });
    }

    // 4. Return success with Party ID for session management
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        partyId: user.partyId,
        username: user.username,
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
