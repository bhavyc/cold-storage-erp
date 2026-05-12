import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.accountGroup.findMany({
      orderBy: { code: 'asc' }
    });
    return NextResponse.json(groups);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, reportType, groupType } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Code and Name are required" }, { status: 400 });
    }

    const group = await prisma.accountGroup.create({
      data: { code, name, reportType, groupType: groupType || "Main Group" }
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Group Code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
