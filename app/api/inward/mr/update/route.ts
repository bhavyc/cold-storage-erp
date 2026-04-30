import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function PUT(req: Request) {
  try {
    const { header, items } = await req.json();

    if (!header.mrNo) return NextResponse.json({ error: "MR No required for update" }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update all Lots and InwardEntries for this MR No.
      for (const item of items) {
        if (!item.id) continue; // Should have ID if existing

        const unit = await tx.unit.findUniqueOrThrow({ where: { id: item.unitId } });
        
        // RE-CALCULATE MATH
        const qty = new Prisma.Decimal(item.qty || 0);
        const perUnitWgt = new Prisma.Decimal(item.perUnitWgt || 0);
        const totalTareWgt = qty.mul(unit.emptyWeight || 0);
        const totalNetWgt = qty.mul(perUnitWgt).minus(totalTareWgt);

        // Fetch old lot to check balance
        const oldLot = await tx.lot.findUnique({ where: { id: item.id } });
        if (!oldLot) continue;

        const dispatchedQty = oldLot.receivedQty - oldLot.balanceQty;
        if (parseInt(item.qty) < dispatchedQty) {
          throw new Error(`Lot ${oldLot.lotNo}: Cannot reduce Qty below dispatched Qty (${dispatchedQty})`);
        }

        const newBalance = parseInt(item.qty) - dispatchedQty;

        // Update Lot
        await tx.lot.update({
          where: { id: item.id },
          data: {
            partyId: header.partyId,
            itemId: item.itemId,
            unitId: item.unitId,
            chamberId: item.chamberId && item.chamberId !== "" ? item.chamberId : null,
            floor: item.floor || "0",
            pole: item.pillar || "0",
            marka: item.marka || "---",
            variety: item.variety || "---",
            receivedQty: parseInt(item.qty) || 0,
            balanceQty: newBalance,
            perUnitWgt,
            totalTareWgt,
            totalNetWgt,
            lotValue: new Prisma.Decimal(item.lotValue || 0),
            arrivalDate: new Date(header.mrDate),
            inwardEntry: {
              update: {
                mrDate: new Date(header.mrDate),
                truckNo: header.truckNo || "---",
                deliveryPerson: header.deliveryPerson || "---",
                billingType: header.billingType || "Nill Lot",
              }
            }
          }
        });

        // 2. Update Labour Voucher (Simplification: Delete old and recreate if needed, or find and update)
        // For now, let's find the voucher associated with this lot
        const voucher = await tx.voucher.findFirst({
            where: { remarks: { contains: `Lot ${oldLot.lotNo}` } }
        });

        if (voucher) {
            const laborInAmount = qty.mul(unit.rateToContractorIn || 0);
            await tx.voucher.update({
                where: { id: voucher.id },
                data: {
                    date: new Date(header.mrDate),
                    totalAmount: laborInAmount,
                    items: {
                        updateMany: {
                            where: { voucherId: voucher.id },
                            data: {
                                debit: { set: 0 }, // Reset first to avoid mixed updates in simple updateMany
                                credit: { set: 0 }
                            }
                        }
                    }
                }
            });
            
            // This updateMany is tricky for credit/debit split. 
            // Better to update individual voucher items or just leave it for now if complexity is too high.
            // Actually, let's just update the total and leave items for a more robust accounting service later.
            // Or better: Re-fetch and update specifically.
            const vItems = await tx.voucherItem.findMany({ where: { voucherId: voucher.id } });
            for (const vItem of vItems) {
                await tx.voucherItem.update({
                    where: { id: vItem.id },
                    data: {
                        debit: vItem.debit.gt(0) ? laborInAmount : 0,
                        credit: vItem.credit.gt(0) ? laborInAmount : 0,
                    }
                });
            }
        }
      }
      return { success: true };
    });

    return NextResponse.json({ message: "Update Successful", data: result });
  } catch (error: any) {
    console.error("MR Update API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
