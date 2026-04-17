import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const itemId = searchParams.get("itemId");
    const chamberId = searchParams.get("chamberId");

    // Dynamic Filter logic
  const whereClause: any = {
      date: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate   ? new Date(toDate)   : undefined,
      },
    };

    // Filter by Party/Item/Chamber inside the related Lot
    if (partyId && partyId !== "All") whereClause.lot = { ...whereClause.lot, partyId: partyId };
    if (itemId && itemId !== "All") whereClause.lot = { ...whereClause.lot, itemId: itemId };
    if (chamberId && chamberId !== "All") whereClause.lot = { ...whereClause.lot, chamberId: chamberId };

    const shiftingLogs = await prisma.stockShifting.findMany({
      where: whereClause,
      include: {
        lot: {
          include: {
            party: { select: { tradeName: true } },
            item: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(shiftingLogs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shifting logs" }, { status: 500 });
  }
}