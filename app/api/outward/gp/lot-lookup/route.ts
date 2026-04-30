import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    // Fetch all lots for this party that have remaining stock
    const lots = await prisma.lot.findMany({
      where: {
        partyId: partyId,
        balanceQty: { gt: 0 }
      },
      include: {
        item: true,
        unit: true,
        chamber: true
      },
      orderBy: { lotNo: "asc" }
    });

    // Format the response for the SearchableSelect component
    // We want a list of lots with descriptive labels
    const formattedLots = lots.map(lot => ({
      id: lot.id,
      lotNo: lot.lotNo,
      itemName: lot.item.name,
      unitName: lot.unit.name,
      balanceQty: lot.balanceQty,
      location: `${lot.chamber?.name || 'NA'}/${lot.floor || '0'}/${lot.pole || '0'}`,
      marka: lot.marka,
      perUnitWgt: Number(lot.perUnitWgt),
      lotValue: Number(lot.lotValue) || 0,
      receivedQty: lot.receivedQty,
      totalNetWgt: Number(lot.totalNetWgt)
    }));

    return NextResponse.json(formattedLots);

  } catch (error: any) {
    console.error("Lot Lookup API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
