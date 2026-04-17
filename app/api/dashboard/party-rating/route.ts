import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const parties = await prisma.party.findMany({
      include: {
        lots: { select: { receivedQty: true, balanceQty: true } },
        invoices: { 
          where: { status: "Unpaid" },
          select: { netAmount: true }
        }
      }
    });

    const report = parties.map(party => {
      const totalInward = party.lots.reduce((sum, lot) => sum + lot.receivedQty, 0);
      const currentBal = party.lots.reduce((sum, lot) => sum + lot.balanceQty, 0);
      const outstanding = party.invoices.reduce((sum, inv) => 
        sum.add(inv.netAmount), new Prisma.Decimal(0)
      );

      // AUTOMATION LOGIC (As per Image 42):
      // Calculate rating based on total business volume
      let ratingCategory = "Below 25%";
      let colorCode = "red";

      if (totalInward > 5000) {
        ratingCategory = "Above 75%";
        colorCode = "green";
      } else if (totalInward > 1000) {
        ratingCategory = "25% to 75%";
        colorCode = "yellow";
      }

      return {
        id: party.id,
        code: party.partyCode,
        name: party.tradeName,
        totalInward,
        currentBal,
        outstanding: outstanding.toNumber(),
        rating: ratingCategory,
        color: colorCode
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate ratings" }, { status: 500 });
  }
}