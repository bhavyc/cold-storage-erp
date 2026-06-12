import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR"], req);
    if (guard.response) return guard.response as Response;

    const { searchParams } = new URL(req.url);
    const fetchAll = searchParams.get("all");
    const fromSlip = searchParams.get("fromSlip");
    const toSlip = searchParams.get("toSlip");

    // If ?all=true, return everything (for the update-mr page)
    if (fetchAll === "true") {
      const mrRecords = await prisma.inwardEntry.findMany({
        include: {
          lot: {
            include: {
              party: true,
              item: true,
              unit: true,
              chamber: true,
            },
          },
        },
        orderBy: [{ mrDate: "desc" }, { id: "desc" }],
      });
      return NextResponse.json(mrRecords);
    }

    // Slip range search (original logic)
    if (!fromSlip || !toSlip) {
      return NextResponse.json(
        { error: "Slip range bharna zaroori hai!" },
        { status: 400 }
      );
    }

    const mrRecords = await prisma.inwardEntry.findMany({
      where: {
        lot: {
          mrNo: { gte: fromSlip, lte: toSlip },
        },
      },
      include: {
        lot: {
          include: {
            party: true,
            item: true,
            unit: true,
            chamber: true,
          },
        },
      },
      orderBy: [{ mrDate: "desc" }, { id: "desc" }],
    });

    return NextResponse.json(mrRecords);
  } catch (error) {
    console.error("GET /update-mr error:", error);
    return NextResponse.json(
      { error: "Records dhoondne mein galti hui!" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR"], req);
    if (guard.response) return guard.response as Response;

    const body = await req.json();
    const { id, mrDate, billingType, truckNo, deliveryPerson, remarks, lot } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update InwardEntry fields
      const updatedEntry = await tx.inwardEntry.update({
        where: { id },
        data: {
          mrDate: mrDate ? new Date(mrDate) : undefined,
          billingType: billingType ?? undefined,
          truckNo: truckNo ?? undefined,
          deliveryPerson: deliveryPerson ?? undefined,
          remarks: remarks ?? undefined,
        },
      });

      // 2. Update Lot fields if provided
      if (lot) {
        const lotUpdateData: any = {};

        if (lot.itemId)      lotUpdateData.itemId      = lot.itemId;
        if (lot.unitId)      lotUpdateData.unitId      = lot.unitId;
        if (lot.chamberId)   lotUpdateData.chamberId   = lot.chamberId;
        if (lot.variety !== undefined) lotUpdateData.variety = lot.variety;
        if (lot.floor !== undefined)   lotUpdateData.floor   = lot.floor;
        if (lot.pole !== undefined)    lotUpdateData.pole    = lot.pole;
        if (lot.marka !== undefined)   lotUpdateData.marka   = lot.marka;

        if (lot.receivedQty !== undefined) {
          const newRecQty = parseInt(lot.receivedQty) || 0;
          
          // Calculate existing dispatches to protect balance integrity
          const lotId = updatedEntry.lotId;
          const outwardItems = await tx.outwardEntry.findMany({ where: { lotId } });
          const dispatchedQty = outwardItems.reduce((sum, item) => sum + Number(item.qty), 0);
          
          lotUpdateData.receivedQty = newRecQty;
          lotUpdateData.balanceQty  = Math.max(0, newRecQty - dispatchedQty);
        }
        if (lot.perUnitWgt !== undefined) {
          lotUpdateData.perUnitWgt = parseFloat(lot.perUnitWgt) || 0;
        }

        // Auto-sync arrivalDate if mrDate changed
        if (mrDate) {
          lotUpdateData.arrivalDate = new Date(mrDate);
        }

        await tx.lot.update({
          where: { id: updatedEntry.lotId },
          data: lotUpdateData,
        });
      } else if (mrDate) {
        // Even without lot object, sync arrivalDate
        await tx.lot.update({
          where: { id: updatedEntry.lotId },
          data: { arrivalDate: new Date(mrDate) },
        });
      }

      return updatedEntry;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH /update-mr error:", error);
    return NextResponse.json({ error: "Update fail ho gaya!" }, { status: 400 });
  }
}
