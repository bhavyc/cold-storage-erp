import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const currentNo = searchParams.get("currentNo");
    const direction = searchParams.get("direction"); // 'back' or 'next'

    if (!currentNo) return NextResponse.json({ error: "Current GP No required" }, { status: 400 });

    let targetGPNo: string | null = null;

    if (direction === "back") {
      const prevGP = await prisma.outwardEntry.findFirst({
        where: { gpNo: { lt: currentNo } },
        orderBy: { gpNo: "desc" },
        select: { gpNo: true }
      });
      targetGPNo = prevGP?.gpNo || null;
    } else if (direction === "next") {
      const nextGP = await prisma.outwardEntry.findFirst({
        where: { gpNo: { gt: currentNo } },
        orderBy: { gpNo: "asc" },
        select: { gpNo: true }
      });
      targetGPNo = nextGP?.gpNo || null;
    }

    if (!targetGPNo) {
      return NextResponse.json({ message: "No more records in this direction" }, { status: 404 });
    }

    const gpEntries = await prisma.outwardEntry.findMany({
      where: { gpNo: targetGPNo },
      include: {
        lot: {
          include: {
            party: true,
            item: true,
            unit: true,
            chamber: true,
          }
        }
      },
      orderBy: { id: "asc" }
    });

    if (gpEntries.length === 0) {
      return NextResponse.json({ error: "GP not found" }, { status: 404 });
    }

    // Format for frontend (matches GP entry grid)
    const header = {
      gpNo: targetGPNo,
      gpDate: gpEntries[0].gpDate.toISOString().split('T')[0],
      partyId: gpEntries[0].lot.partyId,
      partyCode: gpEntries[0].lot.party.partyCode,
      transporterName: "",
      deliveryPerson: gpEntries[0].personName || "",
      truckNo: gpEntries[0].vehicleNo || "",
      grNo: gpEntries[0].grNo || "",
      transportRequired: gpEntries[0].transportRequired ? "Yes" : "No",
      remarks: "",
    };

    const items = gpEntries.map(entry => ({
      lotId: entry.lotId,
      lotNo: entry.lot.lotNo,
      itemName: entry.lot.item.name,
      packing: entry.lot.unit.name,
      marka: `${entry.lot.lotNo}/${entry.qty}`,
      balQty: entry.lot.balanceQty + entry.qty, // Add back current qty to show original balance
      recQty: entry.lot.receivedQty,
      recWgt: Number(entry.lot.totalNetWgt),
      perUnitWgt: Number(entry.lot.perUnitWgt),
      gpQty: entry.qty,
      gpWgt: Number(entry.netWeight).toFixed(2),
      location: `${entry.lot.chamber?.name || 'NA'}/${entry.lot.floor || '0'}/${entry.lot.pole || '0'}`,
      lotValue: Number(entry.lot.lotValue) || 0
    }));

    return NextResponse.json({ header, items });

  } catch (error: any) {
    console.error("GP History API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
