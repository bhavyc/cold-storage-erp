import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Hamara naya helper

export async function POST(req: Request) {
  try {
    const { header, items } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      
      // 1. GENERATE AUTOMATIC MR NO (Ek Receipt ke liye ek Number)
      // Agar frontend se nahi aaya (jo ki nahi aana chahiye), toh auto-generate karein.
      const sharedMRNo = header.mrNo || await getNextNumber("MR", tx);

      // 2. FETCH SYSTEM LEDGERS FOR LABOUR (Dynamic Fix)
      const settings = await tx.systemSettings.findMany({
        where: { key: { in: ['LABOUR_CONTRACTOR_ID', 'LABOUR_EXPENSE_ID'] } }
      });
      const contractorId = settings.find(s => s.key === 'LABOUR_CONTRACTOR_ID')?.value;
      const labourExpId = settings.find(s => s.key === 'LABOUR_EXPENSE_ID')?.value;

      const savedLots = [];

      for (const item of items) {
        // 3. GENERATE AUTOMATIC LOT NO (Har bori/item ke liye unique ID)
        const autoLotNo = await getNextNumber("LOT", tx);

        const unit = await tx.unit.findUniqueOrThrow({ where: { id: item.unitId } });
        
        // MATH ENGINE (Decimal Safety)
        const qty = new Prisma.Decimal(item.qty);
        const perUnitWgt = new Prisma.Decimal(item.perUnitWgt);
        const totalTareWgt = qty.mul(unit.emptyWeight);
        const totalNetWgt = qty.mul(perUnitWgt).minus(totalTareWgt);

        // 4. CREATE LOT & INWARD (Automatic Numbers Linked)
        const lot = await tx.lot.create({
          data: {
            lotNo: autoLotNo,      // Auto generated
            mrNo: sharedMRNo,      // Auto generated (Shared for all items in this MR)
            partyId: header.partyId,
            itemId: item.itemId,
            unitId: item.unitId,
            chamberId: item.chamberId,
            floor: item.floor,
            pole: item.pole,
            marka: item.marka,
            receivedQty: item.qty,
            balanceQty: item.qty,
            perUnitWgt,
            totalTareWgt,
            totalNetWgt,
            arrivalDate: new Date(header.mrDate),
            inwardEntry: {
              create: {
                mrDate: new Date(header.mrDate),
                truckNo: header.truckNo,
                deliveryPerson: header.deliveryPerson,
                billingType: header.billingType,
              }
            }
          }
        });

        // 5. AUTO-ACCOUNTING: Contractor Liability (Lab IN)
        const laborInAmount = qty.mul(unit.rateToContractorIn);
        
        if (laborInAmount.gt(0) && contractorId && labourExpId) {
          // Voucher Number ko bhi automatic kar dete hain sequence engine se
          const autoVocNo = await getNextNumber("VOC", tx);

          await tx.voucher.create({
            data: {
              voucherNo: autoVocNo, // Accounting Sequence
              date: new Date(header.mrDate),
              vocType: "Journal",
              group: "Journal",
              totalAmount: laborInAmount,
              remarks: `Labour IN Credit - Lot ${lot.lotNo} (MR: ${sharedMRNo})`,
              items: {
                create: [
                  { ledgerId: labourExpId, debit: laborInAmount, credit: 0, narration: `Labour Exp for Lot ${lot.lotNo}` },
                  { ledgerId: contractorId, debit: 0, credit: laborInAmount, narration: `Payable to Contractor IN` }
                ]
              }
            }
          });
        }

        savedLots.push(lot);
      }
      return { mrNo: sharedMRNo, lots: savedLots };
    }, {
      // Serializable isolation taaki multiple log ek saath auto-number na le sakein
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json({ message: "MR and Inventory Processed Successfully", data: result }, { status: 201 });
  } catch (error: any) {
    console.error("MR_SAVE_ERROR", error);
    return NextResponse.json({ error: error.message || "Failed to process MR" }, { status: 400 });
  }
}

// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@prisma/client";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { header, items } = body;

//     const result = await prisma.$transaction(async (tx) => {
//       // 1. Auto-increment Lot Number Logic
//       const lastLot = await tx.lot.findFirst({ orderBy: { lotNo: 'desc' } });
//       let nextLotId = lastLot ? parseInt(lastLot.lotNo) + 1 : 1001;

//       // Fetch Ledgers for Labour Posting
//       const contractorLedger = await tx.ledger.findUnique({ where: { code: 'LABOUR_CONTRACTOR' } });
//       const labourExpLedger = await tx.ledger.findUnique({ where: { code: 'LABOUR_EXPENSE' } });

//       const savedLots = [];

//       for (const item of items) {
//         // Fetch Unit for Tare logic
//         const unit = await tx.unit.findUniqueOrThrow({ where: { id: item.unitId } });
        
//         // AUTOMATION: Weight Engine (Image 59 Logic)
//         const qty = new Prisma.Decimal(item.qty);
//         const perUnitWgt = new Prisma.Decimal(item.perUnitWgt);
//         const totalProducedWgt = qty.mul(perUnitWgt);
//         const totalTareWgt = qty.mul(unit.emptyWeight);
//         const totalNetWgt = totalProducedWgt.minus(totalTareWgt);

//         // 2. Create Lot & Inward Entry Link
//         const lot = await tx.lot.create({
//           data: {
//             lotNo: nextLotId.toString(),
//             mrNo: header.mrNo,
//             partyId: header.partyId,
//             itemId: item.itemId,
//             unitId: item.unitId,
//             chamberId: item.chamberId,
//             floor: item.floor,
//             pole: item.pole, // Pillar/Pole from image
//             palletNo: item.palletNo,
//             marka: item.marka,
//             pMarka: item.pMarka,
//             receivedQty: item.qty,
//             balanceQty: item.qty,
//             perUnitWgt: perUnitWgt,
//             totalTareWgt: totalTareWgt,
//             totalNetWgt: totalNetWgt,
//             arrivalDate: new Date(header.mrDate),
//             inwardEntry: {
//               create: {
//                 mrDate: new Date(header.mrDate),
//                 truckNo: header.truckNo,
//                 deliveryPerson: header.deliveryPerson,
//                 billingType: header.billingType,
//                 remarks: item.remarks,
//               }
//             }
//           }
//         });

//         // 3. AUTOMATION: Contractor Labour IN Hit (Image 14 Logic)
//         const laborInAmount = qty.mul(unit.rateToContractorIn);
//         if (laborInAmount.gt(0) && contractorLedger && labourExpLedger) {
//           await tx.voucher.create({
//             data: {
//               voucherNo: `LAB-IN-${lot.lotNo}`,
//               date: new Date(header.mrDate),
//               vocType: "Journal",
//               group: "Labour",
//               totalAmount: laborInAmount,
//               remarks: `Labour IN Credit - Lot ${lot.lotNo}`,
//               items: {
//                 create: [
//                   { ledgerId: labourExpLedger.id, debit: laborInAmount, credit: 0 },
//                   { ledgerId: contractorLedger.id, debit: 0, credit: laborInAmount }
//                 ]
//               }
//             }
//           });
//         }

//         savedLots.push(lot);
//         nextLotId++;
//       }
//       return savedLots;
//     });

//     return NextResponse.json({ message: "MR Saved & Accounting Posted", data: result }, { status: 201 });
//   } catch (error: unknown) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }