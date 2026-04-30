import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
     // Database se saare Account Groups (G01, G02, etc.) nikalna
    const groups = await prisma.accountGroup.findMany({
      orderBy: { code: 'asc' }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("GROUPS_FETCH_ERR:", error);
    return NextResponse.json({ error: "Failed to fetch account groups" }, { status: 500 });
  }
}
