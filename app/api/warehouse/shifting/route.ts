import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Sequence Engine
// 1. GET: Lot ki current details nikalna
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lotNo = searchParams.get("lotNo");

    if (!lotNo) return NextResponse.json({ error: "Lot No missing" }, { status: 400 });

    const lot = await prisma.lot.findUnique({
      where: { lotNo },
      include: { chamber: true, party: true }
    });

    if (!lot) return NextResponse.json({ error: "Bhai, ye Lot No record mein nahi hai!" }, { status: 404 });

    return NextResponse.json({
      lotId: lot.id,
      currentLocation: `${lot.chamber.name} / Floor: ${lot.floor || 'NA'} / Pole: ${lot.pole || 'NA'}`,
      balanceQty: lot.balanceQty,
      partyName: lot.party.tradeName
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 2. POST: Shifting execute karna
// Replace inside app/api/warehouse/shifting/route.ts
export async function POST(req: Request) {
  try {
    const { lotId, fromLocation, toChamberId, toFloor, toPole, shiftQty, date } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // ✅ FIX: Sequence Engine for Shifting No
      const autoShiftNo = await getNextNumber("SFT", tx);

      const log = await tx.stockShifting.create({
        data: {
          // shiftNo: autoShiftNo, // Ensure this exists in your Prisma Model
          lotId: lotId,
          fromLocation: fromLocation,
          toLocation: `ChamberID: ${toChamberId} / Floor: ${toFloor} / Pole: ${toPole}`,
          qty: parseInt(shiftQty),
          date: new Date(date)
        }
      });

      await tx.lot.update({
        where: { id: lotId },
        data: { chamberId: toChamberId, floor: toFloor, pole: toPole }
      });

      return { shiftNo: autoShiftNo, ...log };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}