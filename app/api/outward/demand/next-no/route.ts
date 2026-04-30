import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const count = await prisma.demand.count();
  return NextResponse.json({ nextNo: (count + 1).toString() });
}
