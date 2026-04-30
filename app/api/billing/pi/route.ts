// app/api/billing/pi/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Sequence Engine
// Replace inside app/api/billing/pi/route.ts
export async function POST(req: Request) {
  try {
    const { header, items, totals } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // ✅ FIX: Sequence Engine for PI Number
      const autoPINo = await getNextNumber("PI", tx);

      const pi = await tx.invoice.create({
        data: {
          invoiceNo: autoPINo, // Auto-generated
          date: new Date(header.piDate),
          partyId: header.partyId,
          billingType: "Nill Lot PI",
          isProforma: true, // No Ledger Posting
          totalQty: totals.totalGpQty,
          totalRent: new Prisma.Decimal(totals.rentTotal),
          totalLabour: new Prisma.Decimal(totals.labourTotal),
          taxableValue: new Prisma.Decimal(totals.taxableValue),
          cgst: new Prisma.Decimal(totals.cgstAmt),
          sgst: new Prisma.Decimal(totals.sgstAmt),
           igst: new Prisma.Decimal(0),
          roundOff: new Prisma.Decimal(                         //  
      totals.netAmt - (totals.taxableValue + totals.cgstAmt + totals.sgstAmt)
    ),
          netAmount: new Prisma.Decimal(totals.netAmt),
          status: "Draft",
          items: {
            create: items.map((it: any) => ({
              lotId: it.lotId,
              qty: it.qty,
              period: it.prd,
              rentRate: new Prisma.Decimal(it.rentRate),
              labourRate: new Prisma.Decimal(it.labRate),
              rentAmt: new Prisma.Decimal(it.rentAmt),
              labourAmt: new Prisma.Decimal(it.labourAmt),
            }))
          }
        }
      });
      return pi;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
