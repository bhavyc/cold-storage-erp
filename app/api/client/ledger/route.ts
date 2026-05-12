import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    // 1. Fetch Party Opening Balance info
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      select: { openingBalance: true, openingMode: true }
    });

    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    // 2. Fetch Invoices (Debits)
    const invoices = await prisma.invoice.findMany({
      where: { partyId: partyId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        invoiceNo: true,
        date: true,
        netAmount: true,
      }
    });

    // 3. Fetch Payments (Receipts - Credits)
    const receipts = await prisma.voucher.findMany({
      where: { partyId: partyId, vocType: "Receipt" },
      orderBy: { date: "desc" },
      select: {
        id: true,
        voucherNo: true,
        date: true,
        totalAmount: true,
        remarks: true,
      }
    });

    // 4. Transform into a unified transaction list
    const transactions: any[] = [
      ...invoices.map(inv => ({
        id: inv.id,
        date: inv.date,
        type: "Debit",
        description: `Invoice #${inv.invoiceNo}`,
        amount: Number(inv.netAmount),
      })),
      ...receipts.map(rec => ({
        id: rec.id,
        date: rec.date,
        type: "Credit",
        description: rec.remarks || `Payment Receipt #${rec.voucherNo}`,
        amount: Number(rec.totalAmount),
      }))
    ];

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 5. Calculate Closing Balance
    const totalInv = invoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0);
    const totalRec = receipts.reduce((sum, rec) => sum + Number(rec.totalAmount), 0);
    const opBal = Number(party.openingBalance) || 0;
    
    let closingBalance = 0;
    if (party.openingMode === "Debit") {
        closingBalance = (opBal + totalInv) - totalRec;
    } else {
        closingBalance = (totalInv - (opBal + totalRec));
    }

    return NextResponse.json({
      success: true,
      data: {
        closingBalance: closingBalance.toFixed(2),
        transactions: transactions,
      },
    });
  } catch (error) {
    console.error("Client Ledger Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
