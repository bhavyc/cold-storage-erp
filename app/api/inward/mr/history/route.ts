import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentNo = searchParams.get("currentNo");
    const direction = searchParams.get("direction"); // 'back' or 'next'

    if (!currentNo) return NextResponse.json({ error: "Current MR No required" }, { status: 400 });

    let targetMrNo: string | null = null;

    if (direction === "back") {
      // Find the largest mrNo less than currentNo
      const prevLot = await prisma.lot.findFirst({
        where: { 
          mrNo: { lt: currentNo },
        },
        orderBy: { mrNo: "desc" },
        select: { mrNo: true }
      });
      targetMrNo = prevLot?.mrNo || null;
    } else if (direction === "next") {
      // Find the smallest mrNo greater than currentNo
      const nextLot = await prisma.lot.findFirst({
        where: { 
          mrNo: { gt: currentNo },
        },
        orderBy: { mrNo: "asc" },
        select: { mrNo: true }
      });
      targetMrNo = nextLot?.mrNo || null;
    }

    if (!targetMrNo) {
      return NextResponse.json({ message: "No more records in this direction" }, { status: 404 });
    }

    // Fetch the full data for this MR
    // An MR is a collection of Lots that share the same mrNo
    const lots = await prisma.lot.findMany({
      where: { mrNo: targetMrNo },
      include: {
        party: true,
        item: true,
        unit: true,
        inwardEntry: true,
      },
      orderBy: { id: "asc" }
    });

    if (lots.length === 0) {
      return NextResponse.json({ error: "MR not found" }, { status: 404 });
    }

    // Format for frontend
    const header = {
      mrNo: targetMrNo,
      mrDate: lots[0].inwardEntry?.mrDate.toISOString().split('T')[0],
      partyId: lots[0].partyId,
      partyCode: lots[0].party.partyCode,
      truckNo: lots[0].inwardEntry?.truckNo || "---",
      deliveryPerson: lots[0].inwardEntry?.deliveryPerson || "---",
      billingType: lots[0].inwardEntry?.billingType || "Nill Lot",
    };

    const items = lots.map(lot => ({
      id: lot.id,
      itemId: lot.itemId,
      itemName: lot.item.name,
      unitId: lot.unitId,
      unitName: lot.unit.name,
      qty: lot.receivedQty,
      perUnitWgt: lot.perUnitWgt,
      chamberId: lot.chamberId || "",
      floor: lot.floor || "0",
      pillar: lot.pole || "0",
      marka: lot.marka || "---",
      variety: lot.variety || "---",
      lotValue: lot.lotValue,
      lotNo: lot.lotNo
    }));

    return NextResponse.json({ header, items });

  } catch (error: any) {
    console.error("MR History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
