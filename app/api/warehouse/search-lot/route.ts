import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    // Aisa lot dhoondo jo completely allocate nahi hua hai (balanceQty > allocated)
    const lots = await prisma.lot.findMany({
      where: {
        AND: [
          { balanceQty: { gt: 0 } }, // Stock hona chahiye
          {
            OR: [
              { lotNo: { contains: query, mode: 'insensitive' } },
              { marka: { contains: query, mode: 'insensitive' } },
              { party: { tradeName: { contains: query, mode: 'insensitive' } } }
            ]
          }
        ]
      },
      include: {
        party: { select: { tradeName: true } },
        item: { select: { name: true } },
        pallets: { select: { assignedQty: true } } // Pehle kitna assign hua hai
      }
    });

    // Formatting response for frontend
    const result = lots.map(lot => {
      const allocated = lot.pallets.reduce((sum, p) => sum + (p.assignedQty || 0), 0);
      return {
        lotId: lot.id,
        lotNo: lot.lotNo,
        partyName: lot.party.tradeName,
        itemName: lot.item.name,
        marka: lot.marka,
        receivedQty: lot.receivedQty,
        alreadyAllocated: allocated,
        unallocated: lot.receivedQty - allocated
      };
    }).filter(l => l.unallocated > 0); // Sirf wahi bhejo jinki assignment bachi hai

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
