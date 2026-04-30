import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

 
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const itemId = searchParams.get("itemId");
    const chamberId = searchParams.get("chamberId");

    // Dynamic Filter logic
    const whereClause: any = {};

    // 1. Date Range Filter
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date.gte = new Date(fromDate);
      if (toDate) whereClause.date.lte = new Date(toDate);
    }

    // 2. Nested Filters (Lot -> Party/Item/Chamber)
    // Filter by Party/Item inside the related Lot
    if ((partyId && partyId !== "All") || (itemId && itemId !== "All") || (chamberId && chamberId !== "All")) {
      whereClause.lot = {
        is: {
           ...(partyId && partyId !== "All" ? { partyId: partyId } : {}),
           ...(itemId && itemId !== "All" ? { itemId: itemId } : {}),
           ...(chamberId && chamberId !== "All" ? { chamberId: chamberId } : {}),
        }
      };
    }

    const shiftingLogs = await prisma.stockShifting.findMany({
      where: whereClause,
      include: {
        lot: {
          include: {
            party: { select: { tradeName: true, partyCode: true } },
            item: { select: { name: true } },
            unit: { select: { name: true } }
          }
        }
      },
      orderBy: { date: 'desc' } // Latest movement first
    });

    return NextResponse.json(shiftingLogs);
  } catch (error: any) {
    console.error("SHIFT_REPORT_ERR:", error);
    return NextResponse.json({ error: "Failed to fetch shifting logs" }, { status: 500 });
  }
}
