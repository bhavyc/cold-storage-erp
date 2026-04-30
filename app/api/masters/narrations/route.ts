import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const narrations = await prisma.narrationMaster.findMany({ orderBy: { group: 'asc' } });
  return NextResponse.json(narrations);
}

export async function POST(req: Request) {
  try {
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
