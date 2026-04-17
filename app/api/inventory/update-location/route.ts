import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. GET: Fetch Lots in a range (Image 85 Top Bar)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");

    if (!fromLot || !toLot) {
      return NextResponse.json({ error: "Please provide Lot Range" }, { status: 400 });
    }

    const lots = await prisma.lot.findMany({
      where: {
        lotNo: { gte: fromLot, lte: toLot }
      },
      include: {
        party: { select: { tradeName: true } },
        item: { select: { name: true } },
        unit: { select: { name: true } },
        inwardEntry: true
      },
      orderBy: { lotNo: 'asc' }
    });

    return NextResponse.json(lots);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

// 2. PATCH: Bulk Update Stock Metadata (Image 85 Red Update Button)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { updates } = body; // Array of lot changes

    const result = await prisma.$transaction(
      updates.map((item: any) => 
        prisma.lot.update({
          where: { id: item.id },
          data: {
            chamberId: item.chamberId,
            floor: item.floor,
            pole: item.pole,
            marka: item.marka,
            pMarka: item.pMarka,
            variety: item.variety,
            // rate, labour, weight logic if needed based on Image 85 columns
            perUnitWgt: new Prisma.Decimal(item.perUnitWgt),
          }
        })
      )
    );

    return NextResponse.json({ message: "Stock Locations Synchronized", count: result.length });
  } catch (error: any) {
    return NextResponse.json({ error: "Update failed", details: error.message }, { status: 400 });
  }
}