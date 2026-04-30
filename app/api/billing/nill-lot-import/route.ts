import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) return NextResponse.json({ error: "Party ID missing" }, { status: 400 });

    // 1. Database se wo Lots uthao jinka abhi hisab bacha hai
    const lots = await prisma.lot.findMany({
      where: {
        partyId: partyId,
        OR: [
          { balanceQty: { gt: 0 } }, 
          { balanceQty: 0, uptoDate: null },
          { balanceQty: 0, uptoDate: { not: null } }
        ]
      },
      include: {
        item: { include: { itemUnits: true } },
        unit: true,
        party: true, // Fetch party flags
        outwardEntries: { orderBy: { gpDate: 'desc' }, take: 1 }
      }
    });

    const party = lots[0]?.party;
    const partyFlags = {
      billNilLot: party?.billNilLot || false,
      billMonthly: party?.billMonthly || false,
      billTransport: party?.billTransport || false,
      billSpace: party?.billSpace || false,
      billBalance: party?.billBalance || false,
      billItemDay: party?.billItemDay || false,
      billFixed: party?.billFixed || false,
      billLabour: party?.billLabour ?? false, 
      billCA: party?.billCA || false,
      billWeekly: party?.billWeekly || false
    };

    // 2. FETCH SPECIAL RATES for this Party
    const specialRates = await prisma.partyItemRate.findMany({
      where: { partyId: partyId }
    });

    // 3. SMART FILTERING: Billed entries ko nikalne ke liye
    const filteredLots = lots.filter(lot => {
      const billUptoDate = lot.uptoDate ? new Date(lot.uptoDate).setHours(0,0,0,0) : 0;
      const today = new Date().setHours(0,0,0,0);

      // PARTY FLAG OVERRIDES
      if (partyFlags.billNilLot && !partyFlags.billBalance) {
        if (lot.balanceQty > 0) return false; // Skip running lots
      }
      if (partyFlags.billBalance && !partyFlags.billNilLot) {
        if (lot.balanceQty === 0) return false; // Skip finished lots
      }

      // Existing Smart Logic for Nill Lots
      if (lot.balanceQty === 0) {
        if (lot.uptoDate && lot.outwardEntries.length > 0) {
          const lastGPDate = new Date(lot.outwardEntries[0].gpDate).setHours(0,0,0,0);
          if (billUptoDate >= lastGPDate) return false; 
        }
      } 
      // Existing Smart Logic for Running Lots
      else {
        if (lot.uptoDate && billUptoDate >= today) return false;
      }
      
      return true; 
    });

    // 4. Data ko grid ke liye format karo (WITH RATE HIERARCHY)
    const result = filteredLots.map(lot => {
      // Priority 1: Check if special rate exists for this Party + Item + Unit
      const special = specialRates.find(r => r.itemId === lot.itemId && r.unitId === lot.unitId);
      
      // Priority 2: Use Item Master Default Rate
      const config = lot.item.itemUnits.find(u => u.unitId === lot.unitId);

      const finalRent = special ? Number(special.csRent) : Number(config?.rentRate || 0);
      const finalLab = special ? Number(special.csLab) : Number(config?.labourRate || 0);

      const lastGP = lot.outwardEntries[0];

      return {
        lotId: lot.id,
        lotNo: lot.lotNo,
        marka: lot.marka || "-",
        itemName: lot.item.name,
        itemId: lot.item.id,
        packing: lot.unit.name,
        gpNo: lastGP?.gpNo || "IN-WHSE",
        mrDate: lot.arrivalDate.toISOString(),
        gpDate: lastGP?.gpDate.toISOString() || new Date().toISOString(),
        // Agar bori nikal gayi toh total received ka bill, warna bache hue ka bill
        qty: lot.balanceQty === 0 ? lot.receivedQty : lot.balanceQty, 
        rentRate: finalRent,
        labRate: finalLab,
        lotValue: Number((lot as any).lotValue || 0), // Fetch from Lot directly now
        prd: 0,
        rentAmt: 0,
        labourAmt: 0,
        uptoDate: lot.uptoDate ? lot.uptoDate.toISOString() : null
      };
    });

    return NextResponse.json({ 
      items: result, 
      partyFlags 
    });
  } catch (error: any) {
    console.error("IMPORT_ERROR:", error.message);
    return NextResponse.json({ error: "API Failed" }, { status: 500 });
  }
}
