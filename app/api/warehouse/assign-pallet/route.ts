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
        // Validation: Pallet already occupied check
        const existing = await tx.pallet.findUnique({ where: { palletNo: row.palletNo } });
        if (existing && existing.status === "Occupied" && existing.lotId !== lotId) {
          throw new Error(`Pallet ${row.palletNo} is already occupied by Lot ${existing.lotId}. Kripya empty pallet chunein!`);
        }

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

 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query"); // Frontend se 'query' aa raha hai
    const lotNo = searchParams.get("lotNo"); // Backward compatibility ke liye

    // Search term decide karein
    const searchTerm = query || lotNo;

    if (!searchTerm) {
      return NextResponse.json({ error: "Bhai, search karne ke liye kuch toh dalo!" }, { status: 400 });
    }

    // ✅ SMART SEARCH: LotNo, Party Name, ya Marka mein dhoondo
    const lots = await prisma.lot.findMany({
      where: {
        AND: [
          { balanceQty: { gt: 0 } }, // Sirf wo jisme stock bacha ho
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
        party: { select: { tradeName: true } },
        item: { select: { name: true } },
        pallets: { select: { assignedQty: true } } // Allocation check karne ke liye
      },
      take: 10 // Top 10 results hi bhejo taaki speed bani rahe
    });

    // Data ko format karke bhejo (Math calculations ke saath)
    const formattedLots = lots.map(lot => {
      const alreadyAllocated = lot.pallets.reduce((sum, p) => sum + (p.assignedQty || 0), 0);
      return {
        lotId: lot.id,
        lotNo: lot.lotNo,
        partyName: lot.party.tradeName,
        itemName: lot.item.name,
        marka: lot.marka || "-",
        arrivalDate: lot.arrivalDate,
        receivedQty: lot.receivedQty,
        allocatedQty: alreadyAllocated,
        unallocated: lot.receivedQty - alreadyAllocated
      };
    });

    // Agar sirf ek lot mila, toh object bhejo, warna array
    return NextResponse.json(formattedLots);

  } catch (error: any) {
    console.error("SEARCH_LOT_ERR:", error);
    return NextResponse.json({ error: "Server Error: Search fail ho gaya" }, { status: 500 });
  }
}

