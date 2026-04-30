import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    
    // Timezone safe logic: Reset today to midnight for accurate day difference
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required for detailed statement" }, { status: 400 });
    }

    // 1. Party aur uske Lots fetch karo (Saath mein Special Rates aur Unit configs bhi)
    const partyData = await prisma.party.findUnique({
      where: { id: partyId },
      include: {
        specialRates: true, // IMPORTANT: Fetch custom agreed rates for this party
        lots: {
          where: { balanceQty: { gt: 0 } }, // Sirf wo jinka maal warehouse mein baki hai
          include: {
            item: { include: { itemUnits: true } }, // Default rates
            unit: true
          },
          orderBy: { arrivalDate: 'asc' } // Puraana maal upar dikhega
        }
      }
    });

    if (!partyData) {
      return NextResponse.json({ error: "Party record not found in database" }, { status: 404 });
    }

    // 2. Calculation Logic
    const report = partyData.lots.map(lot => {
      // Start Date pick karo: Pehla bill hai toh Arrival, warna UptoDate
      const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
      startDate.setHours(0, 0, 0, 0); // Safe midnight comparison
      
      // Dinon ka farak (Today - StartDate)
      const diffTime = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Grace Days minus karo (Sirf agar pichli billing na hui ho)
      const effectiveGrace = lot.uptoDate ? 0 : partyData.graceDays;
      const billableDays = Math.max(0, diffTime - effectiveGrace);

      // CHECK: Kya is party ka is item/unit ke liye koi special rate hai?
      const specialRate = partyData.specialRates.find(
        r => r.itemId === lot.itemId && r.unitId === lot.unitId
      );

      // Unit wise default rent rate uthao
      const unitConfig = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
      
      // FINAL RATE: Agar Special Rate hai toh wo lo, warna Default Master Rate lo, warna 0.
      const rentRate = specialRate 
        ? Number(specialRate.csRent) 
        : Number(unitConfig?.rentRate || 0);
        
      const labourRate = specialRate 
        ? Number(specialRate.csLab) 
        : Number(unitConfig?.labourRate || 0);

      // Live Accrued Rent Calculation
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
    
  } catch (error: any) {
    console.error("PENDING_DETAIL_ERR:", error);
    return NextResponse.json({ error: "Failed to load pending details securely" }, { status: 500 });
  }
}
