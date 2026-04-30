import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(req: Request) {
  try {
    const { header, items } = await req.json();

    if (!header.gpNo) return NextResponse.json({ error: "GP No required for update" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing GP entries to calculate differences
      const oldEntries = await tx.outwardEntry.findMany({
        where: { gpNo: header.gpNo }
      });

      // 2. Map existing entries for quick lookup
      const oldEntryMap = new Map(oldEntries.map(e => [e.lotId, e]));

      for (const item of items) {
        const oldEntry = oldEntryMap.get(item.lotId);
        if (!oldEntry) continue; // For now, only update existing items in the GP

        const lot = await tx.lot.findUniqueOrThrow({
            where: { id: item.lotId },
            include: { unit: true }
        });

        const diffQty = item.gpQty - oldEntry.qty;

        // Validation: Ensure stock doesn't go negative
        if (lot.balanceQty < diffQty) {
          throw new Error(`Lot ${lot.lotNo}: Insufficient stock to increase GP qty by ${diffQty}`);
        }

        // Calculate Weights
        const perBagNetWgt = lot.totalNetWgt.div(lot.receivedQty);
        const newGpNetWgt = new Prisma.Decimal(item.gpQty).mul(perBagNetWgt);

        // Update OutwardEntry
        await tx.outwardEntry.update({
          where: { id: oldEntry.id },
          data: {
            gpDate: new Date(header.gpDate),
            qty: item.gpQty,
            netWeight: newGpNetWgt,
            vehicleNo: header.truckNo,
            personName: header.deliveryPerson,
            transportRequired: header.transportRequired === "Yes",
            grNo: header.grNo,
            remarks: header.remarks,
            transporterName: header.transporterName
          }
        });

        // Adjust Stock
        await tx.lot.update({
          where: { id: item.lotId },
          data: { balanceQty: { decrement: diffQty } }
        });

        // 3. Update Labour Voucher
        const voucher = await tx.voucher.findFirst({
            where: { 
              AND: [
                { remarks: { contains: `GP: ${header.gpNo}` } },
                { remarks: { contains: `Lot: ${lot.lotNo}` } }
              ]
            }
        });

        if (voucher) {
            const rateOut = lot.unit?.rateToContractorOut ? new Prisma.Decimal(lot.unit.rateToContractorOut) : new Prisma.Decimal(0);
            const laborOutAmt = new Prisma.Decimal(item.gpQty).mul(rateOut);

            await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    date: new Date(header.gpDate),
                    totalAmount: laborOutAmt,
                }
            });

            const vItems = await tx.voucherItem.findMany({ where: { voucherId: voucher.id } });
            for (const vItem of vItems) {
                await tx.voucherItem.update({
                    where: { id: vItem.id },
                    data: {
                        debit: vItem.debit.gt(0) ? laborOutAmt : 0,
                        credit: vItem.credit.gt(0) ? laborOutAmt : 0,
                    }
                });
            }
        }
      }

      return { success: true };
    });

    return NextResponse.json({ message: "GP Updated Successfully", data: result });
  } catch (error: any) {
    console.error("GP Update API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
