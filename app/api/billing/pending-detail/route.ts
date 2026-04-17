import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const today = new Date();

    if (!partyId) return NextResponse.json({ error: "Party ID is required" }, { status: 400 });

    // 1. Party aur uske Lots fetch karo (Saath mein Rates bhi)
    const partyData = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        lots: {
          where: { balanceQty: { gt: 0 } }, // Sirf wo jinka maal baki hai
          include: {
            item: { include: { itemUnits: true } },
            unit: true
          }
        }
      }
    });

    if (!partyData) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    // 2. Calculation Logic
    const report = partyData.lots.map(lot => {
      // Start Date pick karo: Pehla bill hai toh Arrival, warna UptoDate
      const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
      
      // Dinon ka farak (Today - StartDate)
      const diffTime = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Grace Days minus karo (Sirf agar pichli billing na hui ho)
      const effectiveGrace = lot.uptoDate ? 0 : partyData.graceDays;
      const billableDays = Math.max(0, diffTime - effectiveGrace);

      // Unit wise rent rate uthao
      const unitConfig = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
      const rentRate = Number(unitConfig?.rentRate || 0);
      const labourRate = Number(unitConfig?.labourRate || 0);

      const accruedRent = lot.balanceQty * rentRate * billableDays;

      return {
        id: lot.id,
        lotNo: lot.lotNo,
        arrivalDate: lot.arrivalDate,
        itemName: lot.item.name,
        packing: lot.unit.name,
        balQty: lot.balanceQty,
        period: billableDays,
        rate: rentRate,
        labour: labourRate,
        accruedRent: accruedRent
      };
    });

    return NextResponse.json({
      partyName: partyData.tradeName,
      partyCode: partyData.partyCode,
      report
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load details" }, { status: 500 });
  }
}