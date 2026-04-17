import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");

    if (!fromLot || !toLot) {
      return NextResponse.json({ error: "Please provide Lot Range" }, { status: 400 });
    }

    // Logic: Range search for Lot Numbers
    const lots = await prisma.lot.findMany({
      where: {
        lotNo: {
          gte: fromLot,
          lte: toLot
        }
      },
      include: {
        party: { select: { tradeName: true } },
        item: { select: { name: true } },
        unit: { select: { name: true } }
      },
      orderBy: { lotNo: 'asc' }
    });

    return NextResponse.json(lots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch label data" }, { status: 500 });
  }
}