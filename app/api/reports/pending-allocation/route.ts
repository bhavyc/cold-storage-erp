import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");
    const partyId = searchParams.get("partyId");
    const query = searchParams.get("query"); // ✅ Naya Smart Search Param

    const whereClause: any = {
        balanceQty: { gt: 0 } // Sirf wo jinka stock warehouse mein hai
    };

    if (fromLot && toLot) {
        whereClause.lotNo = { gte: fromLot, lte: toLot };
    }
    if (partyId && partyId !== "All") {
        whereClause.partyId = partyId;
    }

    // ✅ SMART FILTER: Name, Item ya Marka se dhoondna
    if (query) {
        whereClause.OR = [
            { lotNo: { contains: query, mode: 'insensitive' } },
            { marka: { contains: query, mode: 'insensitive' } },
            { party: { tradeName: { contains: query, mode: 'insensitive' } } },
            { item: { name: { contains: query, mode: 'insensitive' } } }
        ];
    }

    const lots = await prisma.lot.findMany({
      where: whereClause,
      include: {
        party: { select: { partyCode: true, tradeName: true } },
        item: { select: { code: true, name: true } },
        unit: { select: { code: true, name: true } },
        pallets: { select: { assignedQty: true } } // Allocation check karne ke liye
      },
      orderBy: { lotNo: 'asc' }
    });

    // logic to find only those who have "Pending" bags
    const report = lots.map(lot => {
      const allocatedQty = lot.pallets.reduce((sum, p) => sum + (Number(p.assignedQty) || 0), 0);
      const pendingQty = lot.receivedQty - allocatedQty;

      return {
        partyCode: lot.party.partyCode,
        partyName: lot.party.tradeName,
        lotNo: lot.lotNo,
        itemCode: lot.item.code,
        itemName: lot.item.name,
        unitName: lot.unit.name,
        receivedQty: lot.receivedQty,
        allocatedQty: allocatedQty,
        pendingQty: pendingQty
      };
    }).filter(row => row.pendingQty > 0); // Sirf wahi dikhao jinka allocation bacha hai

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
