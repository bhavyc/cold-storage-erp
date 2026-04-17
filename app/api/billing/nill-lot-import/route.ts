import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
 
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) return NextResponse.json({ error: "Party required" }, { status: 400 });

    // 1. Fetch lots that are out (bal: 0) but unbilled
    const lots = await prisma.lot.findMany({
      where: {
        partyId,
        balanceQty: 0,
        uptoDate: null // Kabhi bill nahi bana iska
      },
      include: {
        item: { include: { itemUnits: true } },
        unit: true,
        outwardEntries: { orderBy: { gpDate: 'desc' }, take: 1 }
      }
    });

    const result = lots.map(lot => {
      const config = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
      return {
        lotId: lot.id,
        lotNo: lot.lotNo,
        itemName: lot.item.name,
        itemId: lot.item.id,
        packing: lot.unit.name,
        gpNo: lot.outwardEntries[0]?.gpNo || "Manual",
        mrDate: lot.arrivalDate,
        gpDate: lot.outwardEntries[0]?.gpDate || new Date(),
        qty: lot.receivedQty,
        rentRate: config?.rentRate || 0,
        labRate: config?.labourRate || 0,
        prd: 0, // Frontend calculate karega Period button se
        rentAmt: 0,
        labourAmt: 0
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "API Failed" }, { status: 500 });
  }
}