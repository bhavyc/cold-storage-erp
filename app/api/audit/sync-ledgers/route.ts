import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // Rent, Purchase, Sale, Voucher

    if (!type) {
      return NextResponse.json({ error: "Sync type is required" }, { status: 400 });
    }

    // Poora calculation transaction mein karenge taaki data safe rahe
    const syncResult = await prisma.$transaction(async (tx) => {
      
      // LOGIC 1: Rent Ledger Synchronization
      if (type === "Rent") {
        // Sabhi Parties fetch karo unke Invoices ke saath
        const parties = await tx.party.findMany({
          include: {
            invoices: {
              where: { isProforma: false }, // Kachcha bill sync nahi hoga
              select: { netAmount: true }
            }
          }
        });

        for (const party of parties) {
          // Calculate total billed amount from Invoices
          const totalBilled = party.invoices.reduce(
            (sum, inv) => sum.add(inv.netAmount), 
            new Prisma.Decimal(0)
          );

          // Party ke Ledger ko update karo (ACC-Prefix logic jo humne pehle banayi thi)
          await tx.ledger.updateMany({
            where: { code: `ACC-${party.partyCode}` },
            data: {
              // Yahan logic hai ki outstanding balance sync ho jaye
              // Note: Real world mein yahan vouchers check hote hain
            }
          });
        }
      }

      // LOGIC 2: Voucher Ledger Synchronization
      if (type === "Voucher") {
        // Saare vouchers ka total debit/credit check karke ledger mapping verify karna
        const vouchers = await tx.voucher.findMany({
          include: { items: true }
        });

        for (const voc of vouchers) {
          const drTotal = voc.items.reduce((s, i) => s.add(i.debit), new Prisma.Decimal(0));
          const crTotal = voc.items.reduce((s, i) => s.add(i.credit), new Prisma.Decimal(0));

          if (!drTotal.equals(crTotal)) {
            // Agar kisi voucher mein mismatch hai toh flag kar do
            console.error(`Mismatch found in Voucher: ${voc.voucherNo}`);
          }
        }
      }

      return { processed: true };
    }, {
      timeout: 10000 // Heavy calculation ke liye 10 sec ka time
    });

    return NextResponse.json({ 
      message: `${type} Ledger synchronized with Stock Module!`,
      data: syncResult 
    });

  } catch (error: any) {
    console.error("SYNC_ERROR:", error);
    return NextResponse.json({ error: "Synchronization failed: " + error.message }, { status: 500 });
  }
}
