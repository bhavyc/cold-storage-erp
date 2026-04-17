import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lotNo = searchParams.get("lotNo");

  const lot = await prisma.lot.findUnique({
    where: { lotNo: lotNo as string },
    include: {
      item: true,
      unit: true,
      chamber: true,
    }
  });

  if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lot);
}