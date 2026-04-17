import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Engine

export async function POST(req: Request) {
  try {
    const { header, items } = await req.json();

    // Poora process Transaction mein hoga (Serializable lock for race conditions)
    const result = await prisma.$transaction(async (tx) => {
      
      // 1. GENERATE AUTOMATIC GP NO (Fix: Atomic Increment)
      const activeGPNo = await getNextNumber("GP", tx);

      // 2. CREDIT LIMIT VALIDATION
      const party = await tx.party.findUniqueOrThrow({
        where: { id: header.partyId },
        include: { invoices: { where: { status: "Unpaid" } } }
      });

      const totalOutstanding = party.invoices.reduce(
        (sum, inv) => sum.add(inv.netAmount), 
        new Prisma.Decimal(0)
      );

      if (party.maxAllowedCredit.gt(0) && totalOutstanding.gt(party.maxAllowedCredit)) {
        throw new Error(`GP BLOCKED: Outstanding ₹${totalOutstanding.toFixed(2)} exceeds Limit ₹${party.maxAllowedCredit.toFixed(2)}`);
      }

      // 3. DYNAMIC LEDGER FETCH
      const settings = await tx.systemSettings.findMany({
        where: { key: { in: ['LABOUR_CONTRACTOR_ID', 'LABOUR_EXPENSE_ID'] } }
      });

      const contractorId = settings.find(s => s.key === 'LABOUR_CONTRACTOR_ID')?.value;
      const labourExpId = settings.find(s => s.key === 'LABOUR_EXPENSE_ID')?.value;

      const contractorLedger = contractorId 
        ? { id: contractorId } 
        : await tx.ledger.findUnique({ where: { code: 'LABOUR_CONTRACTOR' } });
      
      const labourExpLedger = labourExpId 
        ? { id: labourExpId } 
        : await tx.ledger.findUnique({ where: { code: 'LABOUR_EXPENSE' } });

      for (const item of items) {
        // 4. STOCK VALIDATION
        const lot = await tx.lot.findUniqueOrThrow({
          where: { id: item.lotId },
          include: { unit: true }
        });

        if (lot.balanceQty < item.gpQty) {
          throw new Error(`Stock mismatch in Lot ${lot.lotNo}. Shortfall: ${item.gpQty - lot.balanceQty}`);
        }

        // 5. CREATE OUTWARD ENTRY (Automatic GP No used here)
        await tx.outwardEntry.create({
          data: {
            gpNo: activeGPNo, 
            lotId: item.lotId,
            gpDate: new Date(header.gpDate),
            qty: item.gpQty,
            netWeight: new Prisma.Decimal(item.gpQty).mul(lot.perUnitWgt),
            vehicleNo: header.truckNo,
            personName: header.deliveryPerson,
            transportRequired: header.transportRequired === "Yes",
            grNo: header.grNo,
          }
        });

        // 6. UPDATE LOT STOCK BALANCE
        await tx.lot.update({
          where: { id: item.lotId },
          data: { balanceQty: { decrement: item.gpQty } }
        });

        // 7. CONTRACTOR LABOUR AUTOMATION (Automatic Voucher No)
        const laborOutAmt = new Prisma.Decimal(item.gpQty).mul(lot.unit.rateToContractorOut);

        if (laborOutAmt.gt(0) && contractorLedger && labourExpLedger) {
          // Accounting Sequence for Voucher
          const autoVocNo = await getNextNumber("VOC", tx);

          await tx.voucher.create({
            data: {
              voucherNo: autoVocNo,
              date: new Date(header.gpDate),
              vocType: "Journal",
              group: "Labour",
              totalAmount: laborOutAmt,
              remarks: `Labour OUT Credit | Lot: ${lot.lotNo} | GP: ${activeGPNo}`,
              items: {
                create: [
                  { ledgerId: labourExpLedger.id, debit: laborOutAmt, credit: 0, narration: "Outward Labour Expense" },
                  { ledgerId: contractorLedger.id, debit: 0, credit: laborOutAmt, narration: "Contractor Payable OUT" }
                ]
              }
            }
          });
        }

        // 8. UPDATE DEMAND STATUS
        if (item.demandId) {
          await tx.demand.update({
            where: { id: item.demandId },
            data: { status: "Completed" }
          });
        }
      }

      return { gpNo: activeGPNo };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    return NextResponse.json({ message: "Gate Pass Processed Successfully", data: result }, { status: 201 });

  } catch (error: any) {
    console.error("GP_BACKEND_ERR", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Ye sirf UI par agla number dikhane ke liye hai (Increment nahi karega)
    const lastGP = await prisma.outwardEntry.findFirst({
      orderBy: { gpNo: 'desc' },
      select: { gpNo: true }
    });
    
    // Simple logic for display
    const nextNo = lastGP ? (parseInt(lastGP.gpNo.replace(/\D/g,'')) + 1).toString() : "1";
    return NextResponse.json({ nextNo });
  } catch (error) {
    return NextResponse.json({ nextNo: "1" });
  }
}


// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { Prisma } from "@prisma/client";

// export async function POST(req: Request) {
//   try {
//     const { header, items } = await req.json();

//     // Poora process Transaction mein hoga (IsolationLevel use kiya hai race condition rokne ke liye)
//     const result = await prisma.$transaction(async (tx) => {
      
//       // 1. GENERATE GP NO INSIDE TRANSACTION (Fix: Race Condition)
//       const lastGPRecord = await tx.outwardEntry.findFirst({
//         orderBy: { gpNo: 'desc' },
//         select: { gpNo: true }
//       });
//       const activeGPNo = lastGPRecord ? (parseInt(lastGPRecord.gpNo) + 1).toString() : "1";

//       // 2. CREDIT LIMIT VALIDATION (Aapki original logic)
//       const party = await tx.party.findUniqueOrThrow({
//         where: { id: header.partyId },
//         include: { invoices: { where: { status: "Unpaid" } } }
//       });

//       const totalOutstanding = party.invoices.reduce(
//         (sum, inv) => sum.add(inv.netAmount), 
//         new Prisma.Decimal(0)
//       );

//       if (party.maxAllowedCredit.gt(0) && totalOutstanding.gt(party.maxAllowedCredit)) {
//         throw new Error(`GP BLOCKED: Outstanding ₹${totalOutstanding.toFixed(2)} exceeds Limit ₹${party.maxAllowedCredit.toFixed(2)}`);
//       }

//       // 3. DYNAMIC LEDGER FETCH (Fix: Hardcoding)
//       // Pehle Settings table check karega, warna legacy code use karega
//       const settings = await tx.systemSettings.findMany({
//         where: { key: { in: ['LABOUR_CONTRACTOR_ID', 'LABOUR_EXPENSE_ID'] } }
//       });

//       const contractorId = settings.find(s => s.key === 'LABOUR_CONTRACTOR_ID')?.value;
//       const labourExpId = settings.find(s => s.key === 'LABOUR_EXPENSE_ID')?.value;

//       const contractorLedger = contractorId 
//         ? { id: contractorId } 
//         : await tx.ledger.findUnique({ where: { code: 'LABOUR_CONTRACTOR' } });
      
//       const labourExpLedger = labourExpId 
//         ? { id: labourExpId } 
//         : await tx.ledger.findUnique({ where: { code: 'LABOUR_EXPENSE' } });

//       for (const item of items) {
//         // 4. STOCK VALIDATION
//         const lot = await tx.lot.findUniqueOrThrow({
//           where: { id: item.lotId },
//           include: { unit: true }
//         });

//         if (lot.balanceQty < item.gpQty) {
//           throw new Error(`Stock mismatch in Lot ${lot.lotNo}. Shortfall: ${item.gpQty - lot.balanceQty}`);
//         }

//         // 5. CREATE OUTWARD ENTRY
//         await tx.outwardEntry.create({
//           data: {
//             gpNo: activeGPNo, // Transaction wala number use hoga
//             lotId: item.lotId,
//             gpDate: new Date(header.gpDate),
//             qty: item.gpQty,
//             netWeight: new Prisma.Decimal(item.gpQty).mul(lot.perUnitWgt),
//             vehicleNo: header.truckNo,
//             personName: header.deliveryPerson,
//             transportRequired: header.transportRequired === "Yes",
//             grNo: header.grNo,
//           }
//         });

//         // 6. UPDATE LOT STOCK BALANCE
//         await tx.lot.update({
//           where: { id: item.lotId },
//           data: { balanceQty: { decrement: item.gpQty } }
//         });

//         // 7. CONTRACTOR LABOUR AUTOMATION
//         const laborOutAmt = new Prisma.Decimal(item.gpQty).mul(lot.unit.rateToContractorOut);

//         if (laborOutAmt.gt(0) && contractorLedger && labourExpLedger) {
//           await tx.voucher.create({
//             data: {
//               voucherNo: `LAB-OUT-${activeGPNo}-${lot.lotNo}`,
//               date: new Date(header.gpDate),
//               vocType: "Journal",
//               group: "Labour",
//               totalAmount: laborOutAmt,
//               remarks: `Labour OUT Credit | Lot: ${lot.lotNo} | GP: ${activeGPNo}`,
//               items: {
//                 create: [
//                   { ledgerId: labourExpLedger.id, debit: laborOutAmt, credit: 0, narration: "Outward Labour Expense" },
//                   { ledgerId: contractorLedger.id, debit: 0, credit: laborOutAmt, narration: "Contractor Payable OUT" }
//                 ]
//               }
//             }
//           });
//         }

//         // 8. UPDATE DEMAND STATUS
//         if (item.demandId) {
//           await tx.demand.update({
//             where: { id: item.demandId },
//             data: { status: "Completed" }
//           });
//         }
//       }

//       return { gpNo: activeGPNo };
//     }, {
//       isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Full table lock for safety
//     });

//     return NextResponse.json({ message: "Success", data: result }, { status: 201 });

//   } catch (error: any) {
//     console.error("GP_BACKEND_ERR", error.message);
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

// export async function GET() {
//   try {
//     const lastGP = await prisma.outwardEntry.findFirst({
//       orderBy: { gpNo: 'desc' },
//       select: { gpNo: true }
//     });
//     const nextNo = lastGP ? (parseInt(lastGP.gpNo) + 1).toString() : "1";
//     return NextResponse.json({ nextNo });
//   } catch (error) {
//     return NextResponse.json({ nextNo: "1" });
//   }
// }