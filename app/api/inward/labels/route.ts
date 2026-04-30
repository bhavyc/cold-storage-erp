import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const itemId = searchParams.get("itemId");

    // Build Dynamic Filter
    const where: any = {};

    if (fromLot && toLot) {
      where.lotNo = { gte: fromLot, lte: toLot };
    }

    if (fromDate && toDate) {
      where.arrivalDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate + 'T23:59:59Z')
      };
    }

    if (partyId && partyId !== "All") {
      where.partyId = partyId;
    }

    if (itemId && itemId !== "All") {
      where.itemId = itemId;
    }

    // Fallback: If no filters provided, don't return everything (safety)
    if (Object.keys(where).length === 0) {
      return NextResponse.json({ error: "Please apply at least one filter" }, { status: 400 });
    }

    const lots = await prisma.lot.findMany({
      where,
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
