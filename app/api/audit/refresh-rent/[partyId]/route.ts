import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request, { params }: { params: { partyId: string } }) {
  const { partyId } = params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. FIXED: Added 'party' and nested 'itemUnits' in include
      const lots = await tx.lot.findMany({
        where: { partyId },
        include: { 
          unit: true,
          party: true, // Error 1 fix: Grace days ke liye party load karni hogi
          item: {
            include: {
              itemUnits: true // Error 2 fix: Rent rates ke liye itemUnits load karne honge
            }
          } 
        }
      });

      let totalAccruedRent = new Prisma.Decimal(0);

      for (const lot of lots) {
        // Logic: Agar balanceQty zero hai toh calculation ki zarurat nahi (ya as per requirement)
        if (lot.balanceQty <= 0) continue;

        const today = new Date();
        // Billing start date: Agar pehle bill fat chuka hai toh 'uptoDate' se, warna 'arrivalDate' se
        const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
        
        const diffTime = today.getTime() - startDate.getTime();
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Grace Days calculation
        const billableDays = totalDays - lot.party.graceDays;
        
        if (billableDays > 0) {
          // 2. FIXED: Specific Unit ka Rent Rate uthana (Lot ke unitId ke hisaab se)
          const config = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
          const rentRate = config?.rentRate || new Prisma.Decimal(0);
          
          const currentLotRent = new Prisma.Decimal(lot.balanceQty).mul(rentRate).mul(billableDays);
          totalAccruedRent = totalAccruedRent.add(currentLotRent);
        }
      }

      return { partyId, recalculatedRent: totalAccruedRent };
    });

    return NextResponse.json({ message: "Rent Ledger Refreshed", data: result });
  } catch (error: any) {
    console.error("REFRESH_ERROR", error);
    return NextResponse.json({ error: "Refresh failed", details: error.message }, { status: 500 });
  }
}