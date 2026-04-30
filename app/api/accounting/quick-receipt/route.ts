import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine";

export async function POST(req: Request) {
  try {
    const { invoiceId, paymentMode } = await req.json();

    return await prisma.$transaction(async (tx) => {
      // 1. Bill (Invoice) dhoondo
      const inv = await tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { party: true }
      });

      if (inv.status === "Paid") throw new Error("Bill already settled!");

      // 2. Kisan ka Accounting Ledger dhoondo
      const partyLedger = await tx.ledger.findFirst({
        where: { code: `ACC-${inv.party.partyCode}` }
      });

      if (!partyLedger) throw new Error("Merchant ledger not found in Accounts!");

      // 3. System Settings se Cash Ledger ki ID uthao
      const cashSetting = await tx.systemSettings.findUnique({
        where: { key: "CASH_LEDGER_ID" }
      });
      const cashLedgerId = cashSetting?.value;

      if (!cashLedgerId) throw new Error("Main Cash Ledger is not mapped in Admin Settings!");

      // 4. AUTO-CREATE RECEIPT VOUCHER (Sequence Engine)
      const autoVocNo = await getNextNumber("VOC", tx);
      const voucher = await tx.voucher.create({
        data: {
          voucherNo: autoVocNo,
          date: new Date(),
          vocType: "Receipt",
          group: "Cash",
          totalAmount: inv.netAmount,
          remarks: `Nagad Received against Bill No: ${inv.invoiceNo}`,
          items: {
            create: [
              // Cash Box mein Paisa Aaya (Debit)
              { ledgerId: cashLedgerId, debit: inv.netAmount, credit: 0, narration: "Cash In" },
              // Kisan ka udhaar khatam hua (Credit)
              { ledgerId: partyLedger.id, debit: 0, credit: inv.netAmount, narration: `Invoice Settlement - ${inv.invoiceNo}` }
            ]
          }
        }
      });

      // 5. UPDATE INVOICE STATUS
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "Paid" }
      });

      return NextResponse.json({ message: "Payment Settle Successfully!", voucherNo: voucher.voucherNo });
    });
  } catch (error: any) {
    console.error("  QUICK_RECEIPT_ERROR:", error.message); // <--- Ye line console mein asli reason batayegi
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
