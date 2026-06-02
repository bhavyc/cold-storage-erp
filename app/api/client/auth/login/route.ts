import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and OTP are required" }, { status: 400 });
    }

    // Treat 'username' as mobile number and 'password' as OTP
    const mobile = username;
    const otp = password;

    // Hardcoded bypass for Google Play Store Reviewer
    const isGoogleReviewer = mobile === "1234567890" && otp === "123456";

    if (!isGoogleReviewer) {
      // 1. Verify OTP in OtpVerification
      const verification = await prisma.otpVerification.findUnique({
        where: { mobile: mobile }
      });

      if (!verification || verification.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP. Please try again." }, { status: 401 });
      }

      if (new Date() > verification.expiresAt) {
        return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 401 });
      }
    }

    // 2. Try to find an existing User record
    let user = await prisma.user.findUnique({
      where: { username: mobile },
      include: { party: true }
    });

    // 3. If User not found, check if it's a new Farmer trying to login with Mobile No
    if (!user) {
      // Look for a Party that has this mobile number in their mobiles array
      const party = await prisma.party.findFirst({
        where: {
          mobiles: { has: mobile }
        }
      });

      if (party) {
        // AUTO-CREATE a User record for this party
        user = await prisma.user.create({
          data: {
            name: party.tradeName,
            username: mobile,
            password: "otp_authenticated", // Placeholder
            role: "CUSTOMER",
            partyId: party.id,
            status: true
          },
          include: { party: true }
        });
      }
    }

    // 4. Final validation
    if (!user) {
      return NextResponse.json({ error: "Mobile number is not registered." }, { status: 401 });
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Access denied. Only customers can login here." }, { status: 403 });
    }

    // 5. Delete OTP verification record after successful validation
    await prisma.otpVerification.delete({
      where: { mobile: mobile }
    }).catch(() => {});

    // 6. Return success with Party ID for session management
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
