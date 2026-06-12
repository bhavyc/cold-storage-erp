import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyRole } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;

    const users = await prisma.user.findMany({
      where: {
        role: {
          not: "CUSTOMER"
        }
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("GET_USERS_ERR:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;

    const { name, username, password, role } = await req.json();

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: { id: user.id, username: user.username, role: user.role }
    }, { status: 201 });

  } catch (error: any) {
    console.error("CREATE_USER_ERR:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
