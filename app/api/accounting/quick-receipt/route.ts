import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";




export async function POST(req: Request) {
  const { invoiceId, paymentMode, ledgerId } = await req.json(); // ledgerId is Cash or Bank account

  try {
    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { party: true }
      });

      // 1. FIX: Dynamically find the Party's Ledger based on their name/code
      const partyLedger = await tx.ledger.findFirst({
        where: { name: inv.party.tradeName } 
      });

      if (!partyLedger) {
        throw new Error(`Ledger not found for party: ${inv.party.tradeName}. Please create it in Account Masters.`);
      }

      // 2. Auto-Create Receipt Voucher
      const voucher = await tx.voucher.create({
        data: {
          voucherNo: `REC-AUTO-${Date.now()}`,
          date: new Date(),
          vocType: "Receipt",
          group: paymentMode,
          partyId: inv.partyId,
          totalAmount: inv.netAmount,
          remarks: `Auto-Receipt for Invoice: ${inv.invoiceNo}`,
          items: {
            create: [
              { ledgerId: ledgerId, debit: inv.netAmount, credit: 0, narration: "Cash/Bank Received" },
              // 3. FIX: Safely injected actual Party Ledger ID
              { ledgerId: partyLedger.id, debit: 0, credit: inv.netAmount, narration: `Invoice Settlement - ${inv.invoiceNo}` }
            ]
          }
        }
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "Paid" }
      });

      return voucher;
    });

    return NextResponse.json({ message: "Payment Received!", voucher: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Quick Receipt failed" }, { status: 400 });
  }
}



// export async function POST(req: Request) {
//   const { invoiceId, paymentMode, ledgerId } = await req.json(); // ledgerId is Cash or Bank account

//   try {
//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Get Invoice Details
//       const inv = await tx.invoice.findUniqueOrThrow({
//         where: { id: invoiceId },
//         include: { party: true }
//       });

//       // 2. Auto-Create Receipt Voucher
//       const voucher = await tx.voucher.create({
//         data: {
//           voucherNo: `REC-AUTO-${Date.now()}`,
//           date: new Date(),
//           vocType: "Receipt",
//           group: paymentMode, // Cash or Bank
//           partyId: inv.partyId,
//           totalAmount: inv.netAmount,
//           remarks: `Auto-Receipt for Invoice: ${inv.invoiceNo}`,
//           items: {
//             create: [
//               { ledgerId: ledgerId, debit: inv.netAmount, credit: 0, narration: "Cash/Bank Received" },
//               // Note: Kisan ka ledger account mapping yahan aayegi
//               // For simplicity, we assume the Party has a linked Ledger
//               { ledgerId: 'PARTY-LEDGER-ID', debit: 0, credit: inv.netAmount, narration: "Invoice Settlement" }
//             ]
//           }
//         }
//       });

//       // 3. Update Invoice Status to Paid
//       await tx.invoice.update({
//         where: { id: invoiceId },
//         data: { status: "Paid" }
//       });

//       return voucher;
//     });

//     return NextResponse.json({ message: "Payment Received!", voucher: result });
//   } catch (error) {
//     return NextResponse.json({ error: "Quick Receipt failed" }, { status: 400 });
//   }
// }