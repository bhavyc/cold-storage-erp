import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const count = await prisma.outwardEntry.groupBy({
    by: ['gpNo'],
  });
  const nextNo = (count.length + 1).toString();
  return NextResponse.json({ nextNo });
}