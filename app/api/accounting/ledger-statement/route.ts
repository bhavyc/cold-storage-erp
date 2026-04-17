import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ledgerId = searchParams.get("ledgerId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!ledgerId) return NextResponse.json({ error: "Select Account Head" }, { status: 400 });

    // Fetch transactions from VoucherItems
    const entries = await prisma.voucherItem.findMany({
      where: {
        ledgerId: ledgerId,
        voucher: {
          date: {
            gte: fromDate ? new Date(fromDate) : undefined,
            lte: toDate ? new Date(toDate) : undefined,
          }
        }
      },
      include: {
        voucher: true
      },
      orderBy: { voucher: { date: 'asc' } }
    });

    // Fetch Opening Balance for calculation
    const ledger = await prisma.ledger.findUnique({ where: { id: ledgerId } });
    let runningBalance = ledger ? Number(ledger.openingBalance) : 0;

    const statement = entries.map(entry => {
      const dr = Number(entry.debit);
      const cr = Number(entry.credit);
      runningBalance = runningBalance + dr - cr;

      return {
        date: entry.voucher.date,
        particular: entry.voucher.remarks || entry.narration || "Transaction",
        billedQty: 0, // Logic to fetch from linked Invoice if applicable
        debit: dr,
        credit: cr,
        balance: runningBalance
      };
    });

    return NextResponse.json(statement);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 });
  }
}