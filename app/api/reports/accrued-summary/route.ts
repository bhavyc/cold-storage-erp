// app/api/reports/accrued-summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyName = searchParams.get("partyName");
    const today = new Date();

    // 1. Lots fetch karo jinme stock hai
    const lots = await prisma.lot.findMany({
      where: {
        balanceQty: { gt: 0 },
        party: partyName && partyName !== "" ? {
          tradeName: { contains: partyName, mode: 'insensitive' }
        } : undefined
      },
      include: {
        party: true,
        item: { include: { itemUnits: true } },
      }
    });

    // 2. Calculation & Grouping by Party
    const summaryMap = new Map();

    lots.forEach(lot => {
      const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
      const diffTime = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const effectiveGrace = lot.uptoDate ? 0 : lot.party.graceDays;
      const billableDays = Math.max(0, diffTime - effectiveGrace);

      const unitConfig = lot.item.itemUnits.find(u => u.unitId === lot.unitId);
      const rate = Number(unitConfig?.rentRate || 0);
      const lotRevenue = lot.balanceQty * rate * billableDays;

      if (!summaryMap.has(lot.partyId)) {
        summaryMap.set(lot.partyId, {
          partyName: lot.party.tradeName,
          lotCount: 0,
          totalBalQty: 0,
          totalRevenue: 0
        });
      }

      const partyRow = summaryMap.get(lot.partyId);
      partyRow.lotCount += 1;
      partyRow.totalBalQty += lot.balanceQty;
      partyRow.totalRevenue += lotRevenue;
    });

    return NextResponse.json(Array.from(summaryMap.values()));
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}