import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine";

import { verifyGatekeeperCreateOnly } from "@/lib/auth-guard";

export async function POST(req: Request) {
  try {
    const guard = await verifyGatekeeperCreateOnly(req, ["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const { header, items } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. GENERATE MR NO (Start from 1 logic)
      const sharedMRNo = header.mrNo || await getNextNumber("MR", tx);

      // 2. FETCH SYSTEM MAPPINGS
      const settings = await tx.systemSettings.findMany({
        where: { key: { in: ['LABOUR_CONTRACTOR_ID', 'LABOUR_EXPENSE_ID'] } }
      });
      const contractorId = settings.find(s => s.key === 'LABOUR_CONTRACTOR_ID')?.value;
      const labourExpId = settings.find(s => s.key === 'LABOUR_EXPENSE_ID')?.value;

      const savedLots = [];

      for (const item of items) {
        // 3. GENERATE LOT NO (Start from 1)
        const autoLotNo = await getNextNumber("LOT", tx);
        const unit = await tx.unit.findUniqueOrThrow({ where: { id: item.unitId } });
        
        // MATH ENGINE
        const qty = new Prisma.Decimal(item.qty || 0);
        const perUnitWgt = new Prisma.Decimal(item.perUnitWgt || 0);
        const totalTareWgt = qty.mul(unit.emptyWeight || 0);
        const totalNetWgt = qty.mul(perUnitWgt).minus(totalTareWgt);

        // 4. CREATE LOT record (Floor/Pole/Marka non-compulsory defaults)
        const lot = await tx.lot.create({
          data: {
            lotNo: autoLotNo,
            mrNo: sharedMRNo,
            partyId: header.partyId,
            itemId: item.itemId,
            unitId: item.unitId,
            chamberId: item.chamberId && item.chamberId !== "" ? item.chamberId : null, 
            floor: item.floor || "0",
            pole: item.pillar || "0", // Map pillar to pole field
            marka: item.marka || "---",
            variety: item.variety || "---",
            receivedQty: parseInt(item.qty) || 0,
            balanceQty: parseInt(item.qty) || 0,
            perUnitWgt,
            totalTareWgt,
            totalNetWgt,
            lotValue: new Prisma.Decimal(item.lotValue || 0),
            arrivalDate: new Date(header.mrDate),
            inwardEntry: {
              create: {
                mrDate: new Date(header.mrDate),
                truckNo: header.truckNo || "---",
                deliveryPerson: header.deliveryPerson || "---",
                billingType: header.billingType || "Nill Lot",
              }
            }
          }
        });

        // 5. LABOUR ACCOUNTING (If mappings exist)
        const laborInAmount = qty.mul(unit.rateToContractorIn || 0);
        if (laborInAmount.gt(0) && contractorId && labourExpId) {
          const autoVocNo = await getNextNumber("VOC", tx);
          await tx.voucher.create({
            data: {
              voucherNo: autoVocNo,
              date: new Date(header.mrDate),
              vocType: "Journal",
              group: "Journal",
              totalAmount: laborInAmount,
              remarks: `Labour IN - Lot ${lot.lotNo}`,
              items: {
                create: [
                  { ledgerId: labourExpId, debit: laborInAmount, credit: 0, narration: `Exp: Lot ${lot.lotNo}` },
                  { ledgerId: contractorId, debit: 0, credit: laborInAmount, narration: `Payable: Lot ${lot.lotNo}` }
                ]
              }
            }
          });
        }
        savedLots.push(lot);
      }
      return { mrNo: sharedMRNo, lots: savedLots };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ message: "Success", data: result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
