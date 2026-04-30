import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const toDate = searchParams.get("toDate") || new Date().toISOString();

    const ledgers = await prisma.ledger.findMany({
      include: {
        group: true,
        voucherEntries: {
          where: { voucher: { date: { lte: new Date(toDate) } } }
        }
      }
    });

   // app/api/accounting/final-reports/route.ts logic update

const reportData = ledgers.map(ledger => {
  const totalDr = ledger.voucherEntries.reduce((sum, item) => sum.add(item.debit), new Prisma.Decimal(0));
  const totalCr = ledger.voucherEntries.reduce((sum, item) => sum.add(item.credit), new Prisma.Decimal(0));
  
  let balance = 0;
  
  // Calculate Opening Dr and Cr based on openingMode
  const opDr = ledger.openingMode === "Debit" ? ledger.openingBalance : new Prisma.Decimal(0);
  const opCr = ledger.openingMode === "Credit" ? ledger.openingBalance : new Prisma.Decimal(0);

  // AGAR REPORT PROFIT LOSS HAI, TOH OPENING BALANCE KO ZERO MAANO (Accounting Rule)
  if (ledger.group.reportType === "Profit Loss") {
    // Income ke liye: Credit - Debit
    // Expense ke liye: Debit - Credit
    balance = (ledger.group.groupType === "Income") 
      ? totalCr.sub(totalDr).toNumber() 
      : totalDr.sub(totalCr).toNumber();
  } else {
    // Balance Sheet accounts ke liye
    if (ledger.group.groupType === "Asset") {
      // Asset (Debit nature): (Op Dr - Op Cr) + (Dr - Cr)
      balance = opDr.sub(opCr).add(totalDr).sub(totalCr).toNumber();
    } else {
      // Liability (Credit nature): (Op Cr - Op Dr) + (Cr - Dr)
      balance = opCr.sub(opDr).add(totalCr).sub(totalDr).toNumber();
    }
  }

  return {
    name: ledger.name,
    groupName: ledger.group.name,
    reportType: ledger.group.reportType, 
    groupType: ledger.group.groupType,   
    balance: balance
  };
});

  // Calculate Difference in Opening Balances
  let totalOpDr = new Prisma.Decimal(0);
  let totalOpCr = new Prisma.Decimal(0);

  ledgers.forEach(ledger => {
    if (ledger.openingMode === "Debit") {
      totalOpDr = totalOpDr.add(ledger.openingBalance);
    } else if (ledger.openingMode === "Credit") {
      totalOpCr = totalOpCr.add(ledger.openingBalance);
    }
  });

  const diffInOp = totalOpDr.sub(totalOpCr).toNumber();
  
  if (diffInOp !== 0) {
    reportData.push({
      name: "Difference in Opening Balances",
      groupName: "Suspense A/c",
      reportType: "Balance Sheet",
      groupType: diffInOp > 0 ? "Liability" : "Asset",
      balance: Math.abs(diffInOp)
    });
  }

  return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
