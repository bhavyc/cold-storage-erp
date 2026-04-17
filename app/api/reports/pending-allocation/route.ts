import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");
    const partyId = searchParams.get("partyId");

   const  whereClause: any = {};

    if (fromLot && toLot) {
        whereClause.lotNo = { gte: fromLot, lte: toLot };
    }
    if (partyId && partyId !== "All") {
        whereClause.partyId = partyId;
    }

    // 1. FIXED: include mein 'palletAllocations' ki jagah 'pallets' use kiya
    const lots = await prisma.lot.findMany({
      where: whereClause,
      include: {
        party: { select: { partyCode: true, tradeName: true } },
        item: { select: { code: true, name: true } },
        unit: { select: { code: true, name: true } },
        pallets: true // <--- Yahan 'palletAllocations' ko 'pallets' kar diya
      },
      orderBy: { lotNo: 'asc' }
    });

    // 2. Math Logic Update
    const report = lots.map(lot => {
      // Yahan bhi lot.pallets use hoga
      const allocatedQty = lot.pallets.reduce((sum, p) => sum + (Number(p.assignedQty) || 0), 0);
      const pendingQty = lot.receivedQty - allocatedQty;

      return {
        partyCode: lot.party.partyCode,
        partyName: lot.party.tradeName,
        lotNo: lot.lotNo,
        itemCode: lot.item.code,
        itemName: lot.item.name,
        unitCode: lot.unit.code,
        unitName: lot.unit.name,
        receivedQty: lot.receivedQty,
        allocatedQty: allocatedQty,
        pendingQty: pendingQty
      };
    }).filter(row => row.pendingQty > 0);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("PRISMA_ERROR:", error.message);
    return NextResponse.json({ error: "Report fetch failed" }, { status: 500 });
  }
}