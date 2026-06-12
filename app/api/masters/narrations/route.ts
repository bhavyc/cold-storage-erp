import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR"]);
    if (guard.response) return guard.response as Response;

    const narrations = await prisma.narrationMaster.findMany({ orderBy: { group: 'asc' } });
    return NextResponse.json(narrations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch narrations" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;

    const body = await req.json();
    const narration = await prisma.narrationMaster.create({
      data: {
        code: body.code,
        group: body.group,
        vocType: body.vocType,
        description: body.description,
      }
    });
    return NextResponse.json(narration, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save narration" }, { status: 400 });
  }
}
