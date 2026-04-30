import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    // 1. Party ke basis par filter set karo
    const whereCondition = partyId && partyId !== "All" ? { id: partyId } : {};

    // 2. Parties fetch karo unke lots ke saath
    const parties = await prisma.party.findMany({
      where: whereCondition,
      include: {
        lots: {
          where: {
            OR: [
              { balanceQty: { gt: 0 } }, // Maal andar hai
              { uptoDate: { lt: new Date() } } // Ya maal nikal gaya par billing pending hai
            ]
          }
        }
      }
    });

    // 3. Data format karo (Mapping)
    const summary = parties.map(party => {
      let mode = [];
      if (party.billNilLot) mode.push("Nill Lot");
      if (party.billBalance) mode.push("Balance Only");
      if (party.billLabour) mode.push("Auto Labour");
      if (party.billFixed) mode.push("Fixed Rate");
      if (party.billMonthly) mode.push("Monthly");
      if (party.billWeekly) mode.push("Weekly");

      return {
        id: party.id,
        partyCode: party.partyCode,
        tradeName: party.tradeName,
        billingMode: mode.length > 0 ? mode.join(" + ") : "General",
        noOfLots: party.lots.length,
        totalBalQty: party.lots.reduce((sum, lot) => sum + lot.balanceQty, 0)
      };
    }).filter(p => p.noOfLots > 0); // Sirf wahi dikhao jinka pending hai

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
