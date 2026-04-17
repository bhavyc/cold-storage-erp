import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const toDate = searchParams.get("toDate") || new Date().toISOString();

    // 1. Fetch all Ledgers with their Group info and Transactions
    const ledgers = await prisma.ledger.findMany({
      include: {
        group: true,
        voucherEntries: {
          where: { voucher: { date: { lte: new Date(toDate) } } }
        }
      }
    });

    // 2. Calculation Logic
    const reportData = ledgers.map(ledger => {
      const totalDr = ledger.voucherEntries.reduce((sum, item) => sum.add(item.debit), new Prisma.Decimal(0));
      const totalCr = ledger.voucherEntries.reduce((sum, item) => sum.add(item.credit), new Prisma.Decimal(0));
      
      // Closing Balance = Opening + Dr - Cr
      const closingBalance = ledger.openingBalance.add(totalDr).sub(totalCr);

      return {
        id: ledger.id,
        name: ledger.name,
        groupName: ledger.group.name,
        reportType: ledger.group.reportType, // Balance Sheet or Profit Loss
        groupType: ledger.group.groupType,   // Asset, Liability, Income, Expense
        balance: closingBalance.toNumber()
      };
    });

    return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate financial reports" }, { status: 500 });
  }
}