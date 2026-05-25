import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { partyId } = await request.json();

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    // 1. Find the Party first
    const party = await prisma.party.findUnique({
      where: { id: partyId }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // 2. Find all CUSTOMER users associated with this Party ID
    const customerUsers = await prisma.user.findMany({
      where: {
        partyId: partyId,
        role: "CUSTOMER"
      }
    });

    if (customerUsers.length > 0) {
      // 3. Remove all matching usernames (which are the mobile numbers used for login) from the mobiles array
      const usernamesToRemove = customerUsers.map(u => u.username);
      const updatedMobiles = party.mobiles.filter(mobile => !usernamesToRemove.includes(mobile));

      await prisma.party.update({
        where: { id: partyId },
        data: {
          mobiles: updatedMobiles
        }
      });

      // 4. Delete the user records
      await prisma.user.deleteMany({
        where: {
          partyId: partyId,
          role: "CUSTOMER"
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account and associated credentials successfully deleted."
    });

  } catch (error: any) {
    console.error("Account Deletion Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
