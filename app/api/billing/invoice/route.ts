import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { InvoiceSchema } from "@/lib/validations/billing";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Engine

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Zod Validation (Prevents crashes)
    const parsedData = InvoiceSchema.parse(body);
    const { header, items } = parsedData as any;

    return await prisma.$transaction(async (tx) => {
      
      // 2. GENERATE AUTOMATIC INVOICE NO (Fix: Race Condition Protection)
      const autoInvoiceNo = await getNextNumber("INV", tx);

      // 3. Fetch Party to check GST Status (Aapka existing logic)
      const party = await tx.party.findUniqueOrThrow({ where: { id: header.partyId } });
      const isIGST = party.stateCode !== "06"; // Home State Code check
      const isRegistered = party.gstType === "Registered";

      let totalRent = new Prisma.Decimal(0);
      let totalLab = new Prisma.Decimal(0);
      let totalQty = 0;

      // 4. Recalculate everything safely on the server
      const invoiceItemsData = [];
      for (const it of items) {
        const itemMaster = await tx.item.findUniqueOrThrow({ where: { id: it.itemId } });
        
        const rentAmt = new Prisma.Decimal(it.qty).mul(it.rentRate).mul(it.period);
        const labAmt = new Prisma.Decimal(it.qty).mul(it.labourRate);
        
        totalRent = totalRent.add(rentAmt);
        totalLab = totalLab.add(labAmt);
        totalQty += it.qty;

        invoiceItemsData.push({
          lotId: it.lotId,
          qty: it.qty,
          period: it.period,
          rentRate: new Prisma.Decimal(it.rentRate),
          labourRate: new Prisma.Decimal(it.labourRate),
          rentAmt,
          labourAmt: labAmt,
          gstRate: itemMaster.gstRate
        });
      }

      // 5. Server-Side Tax Calculation
      const taxableValue = totalRent.add(totalLab);
      let cgst = new Prisma.Decimal(0);
      let sgst = new Prisma.Decimal(0);
      let igst = new Prisma.Decimal(0);

      if (isRegistered) {
        const gstRate = new Prisma.Decimal(18); // Default 18% or fetch from item
        const taxAmt = taxableValue.mul(gstRate).div(100);
        
        if (isIGST) {
          igst = taxAmt;
        } else {
          cgst = taxAmt.div(2);
          sgst = taxAmt.div(2);
        }
      }

      const grossAmount = taxableValue.add(cgst).add(sgst).add(igst);
      const netAmount = new Prisma.Decimal(Math.round(grossAmount.toNumber()));
      const roundOff = netAmount.sub(grossAmount);

      // 6. CREATE INVOICE (With Automatic Number)
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: autoInvoiceNo, // Auto-generated safe number
          date: new Date(header.billDate),
          partyId: header.partyId,
          billingType: header.billingType,
          totalQty,
          totalRent,
          totalLabour: totalLab,
          taxableValue,
          cgst, sgst, igst, roundOff, netAmount,
          status: "Unpaid",
          items: { create: invoiceItemsData }
        }
      });

      // 7. Update Lot UptoDates (Important for next billing cycle)
      for (const it of items) {
        await tx.lot.update({
          where: { id: it.lotId },
          data: { uptoDate: new Date(header.billDate) }
        });
      }

      return invoice;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Lock during generation
    });
  } catch (error: any) {
    console.error("INVOICE_POST_ERR:", error);
    return NextResponse.json({ error: error.message || "Failed to process Invoice" }, { status: 400 });
  }
}


// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@prisma/client";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { header, items, totals } = body;

//     return await prisma.$transaction(async (tx) => {
//       // 1. Generate Invoice No (As per Image 68)
//       const lastInv = await tx.invoice.findFirst({ orderBy: { invoiceNo: 'desc' } });
//       const nextNo = lastInv ? (parseInt(lastInv.invoiceNo) + 1).toString() : "101";

//       // 2. Create Invoice
//       const invoice = await tx.invoice.create({
//         data: {
//           invoiceNo: nextNo,
//           date: new Date(header.billDate),
//           partyId: header.partyId,
//           billingType: header.billingType,
//           fromDate: header.fromDate ? new Date(header.fromDate) : null,
//           toDate: header.toDate ? new Date(header.toDate) : null,
//           totalQty: totals.totalQty,
//           totalRent: new Prisma.Decimal(totals.totalRent),
//           totalLabour: new Prisma.Decimal(totals.totalLabour),
//           taxableValue: new Prisma.Decimal(totals.taxableValue),
//           cgst: new Prisma.Decimal(totals.cgstAmt),
//           sgst: new Prisma.Decimal(totals.sgstAmt),
//           igst: new Prisma.Decimal(totals.igstAmt),
//           roundOff: new Prisma.Decimal(totals.roundOff),
//           netAmount: new Prisma.Decimal(totals.netAmount),
//           status: "Unpaid",
//           items: {
//             create: items.map((it: any) => ({
//               lotId: it.lotId,
//               qty: it.qty,
//               period: it.period,
//               rentRate: new Prisma.Decimal(it.rentRate),
//               labourRate: new Prisma.Decimal(it.labourRate),
//               rentAmt: new Prisma.Decimal(it.rentAmt),
//               labourAmt: new Prisma.Decimal(it.labourAmt),
//             }))
//           }
//         }
//       });

//       // 3. AUTOMATION: Update Lot "Upto-Date" (The Bridge)
//       // Agli billing yahan se shuru hogi
//       for (const it of items) {
//         await tx.lot.update({
//           where: { id: it.lotId },
//           data: { uptoDate: new Date(header.billDate) }
//         });
//       }

//       return invoice;
//     });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }