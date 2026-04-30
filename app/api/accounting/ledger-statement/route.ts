import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ledgerId = searchParams.get("ledgerId");
    
    if (!ledgerId) return NextResponse.json({ error: "Select Account" }, { status: 400 });

    // 1. Ledger details aur Opening Balance laao
    const ledger = await prisma.ledger.findUnique({
      where: { id: ledgerId }
    });

    if (!ledger) return NextResponse.json({ error: "Ledger not found" }, { status: 404 });

    // 2. Sirf is Ledger se judi saari entries laao (VoucherItems)
    const entries = await prisma.voucherItem.findMany({
      where: { ledgerId: ledgerId },
      include: {
        voucher: true // Poora voucher data (Date, Remarks) saath mein
      },
      orderBy: {
        voucher: { date: 'asc' }
      }
    });

    // 3. Running Balance Calculation (Respect Opening Mode)
    let currentBalance = ledger.openingMode === "Credit" 
      ? -Number(ledger.openingBalance)  // Credit nature = negative start
      : Number(ledger.openingBalance);  // Debit nature = positive start
    
    const statement = entries.map(item => {
      const dr = Number(item.debit);
      const cr = Number(item.credit);
      
      // Balance logic: Dr badhta hai, Cr ghat-ta hai (Assets/Debtors ke liye)
      currentBalance = currentBalance + dr - cr;

      return {
        date: item.voucher.date,
        particular: item.voucher.remarks || item.narration || "Transaction Entry",
        billedQty: 0, 
        debit: dr,
        credit: cr,
        balance: currentBalance
      };
    });

    return NextResponse.json(statement);
  } catch (error) {
    return NextResponse.json({ error: "Statement fetch failed" }, { status: 500 });
  }
}
