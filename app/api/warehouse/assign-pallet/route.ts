// app/api/warehouse/assign-pallet/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Sequence Engine
// Replace inside app/api/warehouse/assign-pallet/route.ts
export async function POST(req: Request) {
  try {
    const { lotId, assignments } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // ✅ FIX: Sequence Engine for Assignment Entry
      const autoAssignNo = await getNextNumber("PAL", tx);

      for (const row of assignments) {
        await tx.pallet.upsert({
          where: { palletNo: row.palletNo },
          update: {
            status: "Occupied",
            lotId: lotId,
            chamberId: row.chamberId,
            assignedQty: parseInt(row.qty),
            date: new Date()
          },
          create: {
            palletNo: row.palletNo,
            status: "Occupied",
            lotId: lotId,
            chamberId: row.chamberId,
            assignedQty: parseInt(row.qty),
            date: new Date()
          }
        });
      }
      return { assignNo: autoAssignNo };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET API (Search ke liye)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lotNo = searchParams.get("lotNo");

    if (!lotNo) return NextResponse.json({ error: "Lot No missing" }, { status: 400 });

    const lot = await prisma.lot.findUnique({
      where: { lotNo: lotNo },
      include: { 
        pallets: true, 
        item: { select: { name: true } } 
      }
    });

    if (!lot) return NextResponse.json({ error: "Lot No nahi mila!" }, { status: 404 });

    // Kitni bori pehle se pallets par hain unka sum
    const allocatedSum = lot.pallets.reduce((sum, p) => sum + (p.assignedQty || 0), 0);

    return NextResponse.json({
      lotId: lot.id,
      itemName: lot.item.name,
      receivedQty: lot.receivedQty,
      allocatedQty: allocatedSum,
      unallocated: lot.receivedQty - allocatedSum
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}