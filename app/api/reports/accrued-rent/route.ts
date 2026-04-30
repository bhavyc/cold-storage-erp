import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");
    const itemId = searchParams.get("itemId");
    
    // Timezone safe logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause: any = { balanceQty: { gt: 0 } };  

    // Dynamic UI Filters
    if (partyId && partyId !== "All") whereClause.partyId = partyId;
    if (itemId && itemId !== "All") whereClause.itemId = itemId;
    if (fromLot && toLot) whereClause.lotNo = { gte: fromLot, lte: toLot };

    // 1. Database se live stock fetch
    const lots = await prisma.lot.findMany({
      where: whereClause,
      include: {
        party: { 
          include: { specialRates: true } // ✅ Custom rates for specific merchants
        },
        item: { include: { itemUnits: true } },
        unit: true
      },
      orderBy: { lotNo: 'asc' }
    });

    // 2. Logic: Detailed calculation per lot
    const report = lots.map(lot => {
      // Date logic (Pehla bill arrival se, warna uptoDate se)
      const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
      startDate.setHours(0, 0, 0, 0);
      
      const diffTime = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Grace Days logic
      const effectiveGrace = lot.uptoDate ? 0 : lot.party.graceDays;
      const billableDays = Math.max(0, diffTime - effectiveGrace);

      // ✅ RATE OVERRIDE ENGINE
      const specialRate = lot.party.specialRates.find(
        r => r.itemId === lot.itemId && r.unitId === lot.unitId
      );
      
      const unitConfig = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
      
      const rate = specialRate 
        ? Number(specialRate.csRent) 
        : Number(unitConfig?.rentRate || 0);

      // Final rent
      const rentAmount = lot.balanceQty * rate * billableDays;

      return {
        mrDate: lot.arrivalDate.toISOString(), // Sent as string to avoid parsing errors
        lotNo: lot.lotNo,
        itemName: lot.item.name,
        unitName: lot.unit.name,
        balQty: lot.balanceQty,
        rate: rate,
        period: billableDays,
        rentAmount: rentAmount
      };
    });

    return NextResponse.json(report);
    
  } catch (error: any) {
    console.error("ACCRUED_DETAIL_ERR:", error);
    return NextResponse.json({ error: "Failed to generate detailed rent report" }, { status: 500 });
  }
}



// // app/api/reports/accrued-rent/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const partyId = searchParams.get("partyId");
//     const fromLot = searchParams.get("fromLot");
//     const toLot = searchParams.get("toLot");
//     const itemId = searchParams.get("itemId");
//     const today = new Date();

//    let  whereClause: any = { balanceQty: { gt: 0 } };  

//     if (partyId && partyId !== "All") whereClause.partyId = partyId;
//     if (itemId && itemId !== "All") whereClause.itemId = itemId;
//     if (fromLot && toLot) whereClause.lotNo = { gte: fromLot, lte: toLot };

//     const lots = await prisma.lot.findMany({
//       where: whereClause,
//       include: {
//         party: true,
//         item: { include: { itemUnits: true } },
//         unit: true
//       },
//       orderBy: { lotNo: 'asc' }
//     });

//     // 2. Logic: Calculate Rent for each lot
//     const report = lots.map(lot => {
//       // Logic: Agar pehle bill fat chuka hai toh uptoDate se, warna arrivalDate se
//       const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
//       const diffTime = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
//       // Grace Days logic (Pehli billing par apply hota hai)
//       const effectiveGrace = lot.uptoDate ? 0 : lot.party.graceDays;
//       const billableDays = Math.max(0, diffTime - effectiveGrace);

//       // Unit wise rent rate fetch
//       const unitConfig = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
//       const rate = Number(unitConfig?.rentRate || 0);

//       return {
//         mrDate: lot.arrivalDate,
//         lotNo: lot.lotNo,
//         itemName: lot.item.name,
//         unitName: lot.unit.name,
//         balQty: lot.balanceQty,
//         rate: rate,
//         period: billableDays,
//         rentAmount: lot.balanceQty * rate * billableDays
//       };
//     });

//     return NextResponse.json(report);
//   } catch (error) {
//     return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
//   }
// }
