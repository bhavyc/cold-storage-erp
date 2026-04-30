import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Hamara auto-number generator

// 1. GET: Smart Search (Merchant Name, Marka, or Lot No)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query"); 
    const lotNo = searchParams.get("lotNo");

    const searchTerm = query || lotNo;

    if (!searchTerm) {
      return NextResponse.json({ error: "Kripya search term dalein" }, { status: 400 });
    }

    // Database se stock dhoondo
    const lots = await prisma.lot.findMany({
      where: {
        AND: [
          { balanceQty: { gt: 0 } }, // Sirf wo jisme maal bacha ho
          {
            OR: [
              { lotNo: { contains: searchTerm, mode: 'insensitive' } },
              { marka: { contains: searchTerm, mode: 'insensitive' } },
              { party: { tradeName: { contains: searchTerm, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        chamber: { select: { name: true } },
        party: { select: { tradeName: true } },
        item: { select: { name: true } }
      },
      take: 10 // Top 10 matches
    });

    // Formatting data for the Frontend Shifting Cards
    const result = lots.map(lot => ({
      lotId: lot.id,
      lotNo: lot.lotNo,
      partyName: lot.party.tradeName,
      itemName: lot.item.name,
      marka: lot.marka || "No Marka",
      balanceQty: lot.balanceQty,
      currentLocation: `${lot.chamber?.name || 'Unassigned'} / Floor: ${lot.floor || 'NA'} / Pole: ${lot.pole || 'NA'}`
    }));

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("SHIFT_SEARCH_ERR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 2. POST: Process Shifting (Auto-Numbering + Stock Movement)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lotId, fromLocation, toChamberId, toFloor, toPole, shiftQty, date } = body;

    // Poora process ek safe transaction mein
    const finalResult = await prisma.$transaction(async (tx) => {
      
      // ✅ STEP A: GENERATE AUTOMATIC SHIFTING NO
      const autoShiftNo = await getNextNumber("SFT", tx);

      // ✅ STEP B: FETCH ORIGINAL LOT
      const lot = await tx.lot.findUniqueOrThrow({ where: { id: lotId } });
      const requestedQty = parseInt(shiftQty);

      if (requestedQty <= 0) throw new Error("Quantity must be greater than zero");
      if (requestedQty > lot.balanceQty) throw new Error(`Only ${lot.balanceQty} bags available in this lot`);

      const isPartial = requestedQty < lot.balanceQty;

      // ✅ STEP C: CREATE SHIFTING LOG (History)
      const shiftingLog = await tx.stockShifting.create({
        data: {
          lotId: lotId,
          fromLocation: fromLocation,
          toLocation: `Chamber: ${toChamberId} / Floor: ${toFloor} / Pole: ${toPole}`,
          qty: requestedQty,
          date: new Date(date)
        }
      });

      let updatedLotId = lotId;

      if (!isPartial) {
        // FULL SHIFT: Just update location
        await tx.lot.update({
          where: { id: lotId },
          data: {
            chamberId: toChamberId,
            floor: toFloor,
            pole: toPole
          }
        });

        // Sync ALL pallets for full shift
        await tx.pallet.updateMany({
          where: { lotId: lotId },
          data: { chamberId: toChamberId }
        });
      } else {
        // PARTIAL SHIFT: Split Lot
        // 1. Decrement original lot (Qty and proportionate Weights)
        const shiftedTare = new Prisma.Decimal(requestedQty).mul(lot.totalTareWgt.div(lot.receivedQty));
        const shiftedNet = new Prisma.Decimal(requestedQty).mul(lot.totalNetWgt.div(lot.receivedQty));

        await tx.lot.update({
          where: { id: lotId },
          data: { 
            balanceQty: { decrement: requestedQty },
            totalTareWgt: { decrement: shiftedTare },
            totalNetWgt: { decrement: shiftedNet }
          }
        });

        // 2. Generate new lot number (Suffix logic)
        const siblingCount = await tx.lot.count({
          where: { lotNo: { startsWith: `${lot.lotNo}/S` } }
        });
        const newLotNo = `${lot.lotNo}/S${siblingCount + 1}`;

        // 3. Create new lot record
        const newLot = await tx.lot.create({
          data: {
            lotNo: newLotNo,
            mrNo: lot.mrNo,
            partyId: lot.partyId,
            itemId: lot.itemId,
            unitId: lot.unitId,
            chamberId: toChamberId,
            floor: toFloor,
            pole: toPole,
            marka: lot.marka,
            variety: lot.variety,
            receivedQty: requestedQty,
            balanceQty: requestedQty,
            perUnitWgt: lot.perUnitWgt,
            totalTareWgt: new Prisma.Decimal(requestedQty).mul(lot.totalTareWgt.div(lot.receivedQty)), // Proportionate tare
            totalNetWgt: new Prisma.Decimal(requestedQty).mul(lot.totalNetWgt.div(lot.receivedQty)), // Proportionate net
            arrivalDate: lot.arrivalDate,
            uptoDate: lot.uptoDate
          }
        });
        updatedLotId = newLot.id;
        
        // Note: Pallets are not automatically moved for partial shifts 
        // because we don't know which specific pallets were moved.
      }

      return { 
        shiftNo: autoShiftNo, 
        logId: shiftingLog.id,
        newLotId: updatedLotId,
        isPartial
      };


    }, {
      // Race condition protection (Serializable lock)
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json({ 
      success: true, 
      message: "Stock successfully shifted!", 
      data: finalResult 
    });

  } catch (error: any) {
    console.error("SHIFTING_POST_ERR:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process stock movement" 
    }, { status: 400 });
  }
}
