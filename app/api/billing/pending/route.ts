import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const today = new Date();

    const where: Prisma.LotWhereInput = {
      partyId: partyId && partyId !== "All" ? partyId : undefined,
      OR: [
        { balanceQty: { gt: 0 } }, // Maal baki hai
        { uptoDate: null },        // Maal nikal gaya par bill nahi bana
        { uptoDate: { lt: new Date() } } // Purana bill sirf kuch dinon ka tha
      ]
    };

    const pendingLots = await prisma.lot.findMany({
      where,
      include: {
        party: true,
        item: true,
        unit: true,
        chamber: true
      },
      orderBy: { arrivalDate: 'asc' }
    });

    // Automation: Calculate Period (Days) for each lot
    const report = pendingLots.map(lot => {
      const startDate = lot.uptoDate ? new Date(lot.uptoDate) : new Date(lot.arrivalDate);
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...lot,
        period: diffDays,
        accruedRent: new Prisma.Decimal(lot.balanceQty).mul(0.5).mul(diffDays) // Sample math
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pending bills" }, { status: 500 });
  }
}
