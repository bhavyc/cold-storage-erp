import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber, peekNextNumber } from "@/lib/sequence-engine";

import { verifyGatekeeperCreateOnly, verifyRole } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    const guard = await verifyGatekeeperCreateOnly(req, ["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const { header, items } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. GENERATE AUTOMATIC GP NO
      const activeGPNo = await getNextNumber("GP", tx);

      // 2. SAKT CREDIT LIMIT VALIDATION (True Ledger Balance)
      const party = await tx.party.findUniqueOrThrow({
        where: { id: header.partyId }
      });

      if (party.paymentPreference === "Cash") {
        // CASH PARTY LOGIC: All bills must be paid
        const unpaidBills = await tx.invoice.findMany({
          where: { partyId: party.id, status: "Unpaid" }
        });
        if (unpaidBills.length > 0) {
          throw new Error(`GP BLOCKED: ${unpaidBills.length} Unpaid bills found for this Cash party. Please settle payments first!`);
        }
      } else {
        // CREDIT PARTY LOGIC: Total balance must be within limit (Ledger Based)
        const balanceResult = await tx.voucherItem.aggregate({
          where: { ledger: { code: `ACC-${party.partyCode}` } },
          _sum: { debit: true, credit: true }
        });

        const opBal = new Prisma.Decimal(party.openingBalance || 0);
        const totalDebits = (balanceResult._sum.debit || new Prisma.Decimal(0)).add(party.openingMode === "Debit" ? opBal : 0);
        const totalCredits = (balanceResult._sum.credit || new Prisma.Decimal(0)).add(party.openingMode === "Credit" ? opBal : 0);
        
        const totalOutstanding = totalDebits.minus(totalCredits);

        if (party.maxAllowedCredit && new Prisma.Decimal(party.maxAllowedCredit).gt(0) && totalOutstanding.gt(new Prisma.Decimal(party.maxAllowedCredit))) {
          throw new Error(`GP BLOCKED: Total Outstanding ₹${totalOutstanding.toFixed(2)} exceeds Limit ₹${party.maxAllowedCredit.toFixed(2)}`);
        }
      }

      // 3. GET LABOUR LEDGERS
      const settings = await tx.systemSettings.findMany({
        where: { key: { in: ['LABOUR_CONTRACTOR_ID', 'LABOUR_EXPENSE_ID'] } }
      });
      const contractorId = settings.find(s => s.key === 'LABOUR_CONTRACTOR_ID')?.value;
      const labourExpId = settings.find(s => s.key === 'LABOUR_EXPENSE_ID')?.value;

      for (const item of items) {
        if (!item.lotId) throw new Error("Lot ID is missing for an item");
        const lot = await tx.lot.findUniqueOrThrow({
          where: { id: item.lotId },
          include: { unit: true }
        });

        // 4. STOCK CHECK
        if ((lot.balanceQty || 0) < item.gpQty) {
          throw new Error(`Lot ${lot.lotNo} has only ${lot.balanceQty || 0} bags left!`);
        }

        // 5. CREATE OUTWARD ENTRY
        const perBagNetWgt = lot.totalNetWgt.div(lot.receivedQty);
        const gpNetWgt = new Prisma.Decimal(item.gpQty).mul(perBagNetWgt);

        await tx.outwardEntry.create({
          data: {
            gpNo: activeGPNo, 
            lotId: item.lotId,
            gpDate: new Date(header.gpDate),
            qty: item.gpQty,
            netWeight: gpNetWgt,
            vehicleNo: header.truckNo,
            personName: header.deliveryPerson,
            transportRequired: header.transportRequired === "Yes",
            grNo: header.grNo,
          }
        });

        // 6. DEDUCT STOCK
        const updatedLot = await tx.lot.update({
          where: { id: item.lotId },
          data: { balanceQty: { decrement: item.gpQty } }
        });

        // 6B. AUTO-RELEASE PALLETS (If lot is now empty)
        if (updatedLot.balanceQty <= 0) {
          await tx.pallet.updateMany({
            where: { lotId: item.lotId },
            data: { status: "Empty", lotId: null, assignedQty: 0 }
          });
        }

        // 7. LABOUR ACCOUNTING
        const rateOut = lot.unit?.rateToContractorOut ? new Prisma.Decimal(lot.unit.rateToContractorOut) : new Prisma.Decimal(0);
        const laborOutAmt = new Prisma.Decimal(item.gpQty).mul(rateOut);
        if (laborOutAmt.gt(0) && contractorId && labourExpId) {
          const autoVocNo = await getNextNumber("VOC", tx);
          await tx.voucher.create({
            data: {
              voucherNo: autoVocNo,
              date: new Date(header.gpDate),
              vocType: "Journal",
              group: "Labour",
              totalAmount: laborOutAmt,
              remarks: `Labour OUT | Lot: ${lot.lotNo} | GP: ${activeGPNo}`,
              items: {
                create: [
                  { ledgerId: labourExpId, debit: laborOutAmt, credit: 0, narration: "Outward Labour" },
                  { ledgerId: contractorId, debit: 0, credit: laborOutAmt, narration: "Contractor Payable" }
                ]
              }
            }
          });
        }

        // 8. CLOSE BOOKING (DEMAND)
        if (item.demandId) {
          await tx.demand.update({
            where: { id: item.demandId },
            data: { status: "Completed" }
          });
        }
      }

      return { gpNo: activeGPNo };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ message: "Success", data: result });
  } catch (error: any) {
    console.error("GP Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const nextNo = await peekNextNumber("GP");
    return NextResponse.json({ nextNo });
  } catch (error) {
    return NextResponse.json({ error: "Failed to peek next number" }, { status: 500 });
  }
}
