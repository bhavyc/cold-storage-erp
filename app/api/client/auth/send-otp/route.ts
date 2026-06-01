import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { mobile } = await request.json();

    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    // 1. Search if there's a Party with this mobile number in their mobiles array
    const party = await prisma.party.findFirst({
      where: {
        mobiles: { has: mobile }
      }
    });

    if (!party) {
      return NextResponse.json({ error: "Mobile number is not registered as a customer." }, { status: 404 });
    }

    if (!party.email || party.email.trim() === "") {
      return NextResponse.json({ 
        error: "Your email is not registered. Please contact manager to register your email." 
      }, { status: 400 });
    }

    // 2. Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes from now

    // 3. Save OTP in the database (Upsert on mobile)
    await prisma.otpVerification.upsert({
      where: { mobile: mobile },
      update: {
        otp: otp,
        expiresAt: expiresAt
      },
      create: {
        mobile: mobile,
        otp: otp,
        expiresAt: expiresAt
      }
    });

    // 4. Send Email using Nodemailer
    const emailHost = process.env.SMTP_HOST;
    const emailPort = parseInt(process.env.SMTP_PORT || "587");
    const emailUser = process.env.SMTP_USER;
    const emailPass = process.env.SMTP_PASS;
    const emailFrom = process.env.SMTP_FROM || `"Cold Storage Portal" <noreply@example.com>`;

    let emailSent = false;

    console.log(`\n=================== OTP GENERATED ===================`);
    console.log(`Mobile: ${mobile}`);
    console.log(`Email: ${party.email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`=====================================================\n`);

    if (emailHost && emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: emailPort === 465,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });

        await transporter.sendMail({
          from: emailFrom,
          to: party.email,
          subject: "Cold Storage Login OTP",
          text: `Your OTP for logging into Cold Storage Portal is: ${otp}. It is valid for 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <h2 style="color: #2E7D32; text-align: center;">Cold Storage Portal</h2>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p>Hello <strong>${party.tradeName}</strong>,</p>
              <p>You requested a One-Time Password (OTP) to log into the Cold Storage Customer Portal.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 12px; text-align: center;">This OTP is valid for 5 minutes. Please do not share this OTP with anyone.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Nodemailer error:", err);
      }
    } else {
      console.log("SMTP not configured. Logging OTP to console only.");
    }

    // Mask the email for response security (e.g. bh***a@gmail.com)
    const emailParts = party.email.split("@");
    const name = emailParts[0];
    const domain = emailParts[1];
    const maskedName = name.length > 2 
      ? name.substring(0, 2) + "*".repeat(name.length - 2)
      : name + "*";
    const maskedEmail = `${maskedName}@${domain}`;

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "OTP has been sent to your registered email address."
        : "OTP generated (SMTP not configured, checked server console logs).",
      email: maskedEmail,
      devMode: !emailSent
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
