import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, pin, newPassword } = body;

    if (!username || !pin || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 1. Fetch Recovery PIN from settings
    const pinSetting = await prisma.systemSettings.findUnique({
      where: { key: "ADMIN_RECOVERY_PIN" },
    });

    const expectedPin = pinSetting?.value || "8888";

    if (pin !== expectedPin) {
      return NextResponse.json({ error: "Invalid Recovery PIN" }, { status: 400 });
    }

    // 2. Fetch the target user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Restrict reset to ADMIN role only
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Admin passwords can be reset via the Recovery PIN. Staff accounts must be reset by the Admin from the registry." },
        { status: 403 }
      );
    }

    // 4. Update the password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    console.error("FORGOT_PASSWORD_ERR:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
