import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Party ID required" }, { status: 400 });
    }

    const party = await prisma.party.findUnique({
      where: { id }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const balanceResult = await prisma.voucherItem.aggregate({
      where: { ledger: { code: `ACC-${party.partyCode}` } },
      _sum: { debit: true, credit: true }
    });

    const opBal = new Prisma.Decimal(party.openingBalance || 0);
    const totalDebits = (balanceResult._sum.debit || new Prisma.Decimal(0)).add(party.openingMode === "Debit" ? opBal : 0);
    const totalCredits = (balanceResult._sum.credit || new Prisma.Decimal(0)).add(party.openingMode === "Credit" ? opBal : 0);
    
    const totalOutstanding = totalDebits.minus(totalCredits);

    return NextResponse.json({ outstanding: totalOutstanding.toNumber() });
  } catch (error: any) {
    console.error("Balance Fetch Error:", error);
    return NextResponse.json({ error: "Failed to calculate balance" }, { status: 500 });
  }
}
