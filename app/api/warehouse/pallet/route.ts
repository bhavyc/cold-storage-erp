import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lotNo = searchParams.get("lotNo");

    if (!lotNo) return NextResponse.json({ error: "Lot No required" }, { status: 400 });

    // 1. Lot fetch karo
    const lot = await prisma.lot.findUnique({
      where: { lotNo: lotNo },
      include: {
        item: { select: { name: true } }
      }
    });

    if (!lot) return NextResponse.json({ error: "Lot record mein nahi hai!" }, { status: 404 });

    // 2. MATH FIX: aggregate syntax theek kiya yahan
    const palletSummary = await prisma.pallet.aggregate({
      where: { 
        lotId: lot.id 
      },
      _sum: {
        assignedQty: true // Direct _sum use karo, 'select' ke andar nahi
      }
    });

    // Sahi value nikalo, agar koi pallet assigned nahi hai toh 0 dikhao
    const allocatedSum = Number(palletSummary._sum?.assignedQty || 0);

    return NextResponse.json({
      lotId: lot.id,
      lotNo: lot.lotNo,
      itemName: lot.item.name,
      receivedQty: lot.receivedQty,
      alreadyAllocated: allocatedSum,
      unallocated: lot.receivedQty - allocatedSum
    });

  } catch (error: any) {
    console.error("PALLET_GET_ERROR:", error);
    return NextResponse.json({ error: "API Error: " + error.message }, { status: 500 });
  }
}
// 2. POST: Pallet Allocation Save karna
export async function POST(req: Request) {
  try {
    const { lotId, assignments } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      for (const row of assignments) {
        // Create/Update Pallet Assignment
        await tx.pallet.create({
          data: {
            palletNo: row.palletNo,
            chamberId: row.chamberId,
            lotId: lotId,
            assignedQty: parseInt(row.qty),
            status: "Occupied"
          }
        });
      }
      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 400 });
  }
}
