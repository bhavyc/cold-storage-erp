import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { header, items, totals } = body;

    const result = await prisma.$transaction(async (tx) => {
      // 0. Fetch Party Flags for Billing Type
      const party = await tx.party.findUnique({ where: { id: header.partyId } });
      let dynamicBillingType = "Tax Invoice";
      if (party?.billNilLot) dynamicBillingType = "Nill Lot Invoice";
      else if (party?.billBalance) dynamicBillingType = "Balance Stock Invoice";
      else if (party?.billMonthly) dynamicBillingType = "Monthly Cycle Invoice";

      // 1. Generate Invoice No
      const autoInvoiceNo = await getNextNumber("INV", tx);

      // 2. Create Invoice Record
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo: autoInvoiceNo,
          date: new Date(header.billDate),
          partyId: header.partyId,
          billingType: dynamicBillingType,
          totalQty: totals.totalQty,
          totalRent: new Prisma.Decimal(totals.rentTotal),
          totalLabour: new Prisma.Decimal(totals.labourTotal),
          taxableValue: new Prisma.Decimal(totals.taxableValue),
          cgst: new Prisma.Decimal(totals.cgstAmt),
          sgst: new Prisma.Decimal(totals.sgstAmt),
          igst: new Prisma.Decimal(totals.igstAmt),
          roundOff: new Prisma.Decimal(totals.roundOff),
          netAmount: new Prisma.Decimal(totals.netAmt),
          status: "Unpaid",
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

      // 3. --- ACCOUNTING POSTING (GST SPLIT) ---
      const settings = await tx.systemSettings.findMany({
        where: { key: { in: ['RENT_INCOME_ID', 'CGST_OUTPUT_ID', 'SGST_OUTPUT_ID', 'IGST_OUTPUT_ID', 'ROUNDOFF_LEDGER_ID'] } }
      });
      const getSetting = (key: string) => settings.find(s => s.key === key)?.value;
      
      const incomeId = getSetting('RENT_INCOME_ID');
      const cgstId = getSetting('CGST_OUTPUT_ID');
      const sgstId = getSetting('SGST_OUTPUT_ID');
      const igstId = getSetting('IGST_OUTPUT_ID');
      const roundOffId = getSetting('ROUNDOFF_LEDGER_ID');

      // B. Kisan ka Ledger dhoondo (Search by unique code pattern)
      const partyLedger = await tx.ledger.findFirst({ where: { code: `ACC-${party?.partyCode}` } });

      if (incomeId && partyLedger) {
        const autoVocNo = await getNextNumber("VOC", tx);
        
        // Build credit entries dynamically (only non-zero amounts)
        const creditEntries: any[] = [
          // Rent Income = Taxable Value only (NOT net amount)
          { ledgerId: incomeId, debit: 0, credit: invoice.taxableValue, narration: "Storage Rent Earned" }
        ];
        
        // CGST Payable
        if (cgstId && Number(invoice.cgst) > 0) {
          creditEntries.push({ ledgerId: cgstId, debit: 0, credit: invoice.cgst, narration: `CGST @${totals.cgstAmt > 0 ? '9%' : '0%'}` });
        }
        // SGST Payable
        if (sgstId && Number(invoice.sgst) > 0) {
          creditEntries.push({ ledgerId: sgstId, debit: 0, credit: invoice.sgst, narration: `SGST @${totals.sgstAmt > 0 ? '9%' : '0%'}` });
        }
        // IGST Payable
        if (igstId && Number(invoice.igst) > 0) {
          creditEntries.push({ ledgerId: igstId, debit: 0, credit: invoice.igst, narration: `IGST @18%` });
        }
        // Round-Off (can be Dr or Cr)
        if (roundOffId && Number(invoice.roundOff) !== 0) {
          const ro = Number(invoice.roundOff);
          creditEntries.push({ 
            ledgerId: roundOffId, 
            debit: ro < 0 ? new Prisma.Decimal(Math.abs(ro)) : 0, 
            credit: ro > 0 ? new Prisma.Decimal(ro) : 0, 
            narration: "Round Off Adjustment" 
          });
        }

        await tx.voucher.create({
          data: {
            voucherNo: autoVocNo,
            date: new Date(header.billDate),
            vocType: "Journal",
            group: "Journal",
            totalAmount: invoice.netAmount,
            remarks: `Sales Posting for Bill No: ${invoice.invoiceNo}`,
            items: {
              create: [
                // Kisan ko DEBIT karo (Full Net Amount — udhaar chadh gaya)
                { ledgerId: partyLedger.id, debit: invoice.netAmount, credit: 0, narration: `Bill Generated - ${invoice.invoiceNo}` },
                // Credits (Income + GST + RoundOff)
                ...creditEntries
              ]
            }
          }
        });
      }

      // 3.5 --- AUTO-SETTLEMENT FOR CASH PARTIES ---
      if (party?.paymentPreference === "Cash" && partyLedger) {
        const cashSetting = await tx.systemSettings.findUnique({ where: { key: "CASH_LEDGER_ID" } });
        const cashLedgerId = cashSetting?.value;
        
        if (cashLedgerId) {
          const receiptVocNo = await getNextNumber("VOC", tx);
          await tx.voucher.create({
            data: {
              voucherNo: receiptVocNo,
              date: new Date(header.billDate),
              vocType: "Receipt",
              group: "Cash",
              totalAmount: invoice.netAmount,
              remarks: `Auto-Cash Settlement for Bill: ${invoice.invoiceNo}`,
              items: {
                create: [
                  { ledgerId: cashLedgerId, debit: invoice.netAmount, credit: 0, narration: "Cash Received" },
                  { ledgerId: partyLedger.id, debit: 0, credit: invoice.netAmount, narration: "Invoice Settlement" }
                ]
              }
            }
          });
          
          // Mark Invoice as Paid
          await tx.invoice.update({
            where: { id: invoice.id },
            data: { status: "Paid" }
          });
        }
      }

      // 4. Update Lot uptoDate
      for (const it of items) {
        await tx.lot.update({
          where: { id: it.lotId },
          data: { uptoDate: new Date(header.billDate) }
        });
      }

      return invoice;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("INVOICE_POST_ERR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
