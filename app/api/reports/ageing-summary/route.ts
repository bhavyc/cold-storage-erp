import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface AgeingBucket {
  partyName: string;
  totalDue: Prisma.Decimal;
  bucket0to30: Prisma.Decimal;
  bucket31to60: Prisma.Decimal;
  bucket61to90: Prisma.Decimal;
  bucketAbove90: Prisma.Decimal;
}

export async function GET() {
  try {
    const parties = await prisma.party.findMany({
      include: {
        invoices: { where: { status: "Unpaid" } }
      }
    });

    const today = new Date();

    const report: AgeingBucket[] = parties.map(party => {
      let b1 = new Prisma.Decimal(0), b2 = new Prisma.Decimal(0), 
          b3 = new Prisma.Decimal(0), b4 = new Prisma.Decimal(0);

      party.invoices.forEach(inv => {
        const diffDays = Math.ceil((today.getTime() - inv.date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) b1 = b1.add(inv.netAmount);
        else if (diffDays <= 60) b2 = b2.add(inv.netAmount);
        else if (diffDays <= 90) b3 = b3.add(inv.netAmount);
        else b4 = b4.add(inv.netAmount);
      });

      return {
        partyName: party.tradeName,
        totalDue: b1.add(b2).add(b3).add(b4),
        bucket0to30: b1,
        bucket31to60: b2,
        bucket61to90: b3,
        bucketAbove90: b4
      };
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: "Ageing report failed" }, { status: 500 });
  }
}
