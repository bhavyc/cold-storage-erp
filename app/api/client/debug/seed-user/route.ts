import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const parties = await prisma.party.findMany({ take: 1 });
    if (parties.length === 0) {
      return NextResponse.json({ error: "No parties found in DB. Please create a party first." }, { status: 400 });
    }
    const party = parties[0];

    const testMobile = "9876543210";

    // 1. Update Party mobiles
    await prisma.party.update({
      where: { id: party.id },
      data: {
        mobiles: { set: [testMobile] }
      }
    });

    // 2. Check if User already exists with this username
    const existingUser = await prisma.user.findUnique({
      where: { username: testMobile }
    });

    if (existingUser) {
      // Update password to match mobile number
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: testMobile }
      });
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          name: party.tradeName,
          username: testMobile,
          password: testMobile,
          role: "CUSTOMER",
          partyId: party.id,
          status: true
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Login Ready! Use Mobile: ${testMobile} (Password is same as mobile)`,
      party: party.tradeName
    });
  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
