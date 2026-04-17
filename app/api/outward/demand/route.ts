import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Import engine

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    if (!partyId || partyId === "undefined") {
      return NextResponse.json({ error: "Party ID missing" }, { status: 400 });
    }

    // 1. Lots fetch karo (demandItems include karke availability check karne ke liye)
    const lots = await prisma.lot.findMany({
      where: { 
        partyId: partyId,
        balanceQty: { gt: 0 } 
      },
      include: { 
        item: true, 
        unit: true, 
        chamber: true,
        demandItems: { 
          include: {
            demand: true 
          }
        }
      }
    });

    // 2. Logic to calculate available balance (Physical Stock - Pending Demands)
    const result = lots.map((lot: any) => {
      const totalBlocked = (lot.demandItems || [])
        .filter((d: any) => d.demand?.status === "Pending")
        .reduce((sum: number, d: any) => sum + (Number(d.qty) || 0), 0);
      
      const available = lot.balanceQty - totalBlocked;

      return {
        ...lot,
        originalBal: lot.balanceQty,
        availableQty: available > 0 ? available : 0,
        item: lot.item,
        unit: lot.unit,
        chamber: lot.chamber
      };
    });

    // Sirf wahi lots bhejo jinka stock available hai
    return NextResponse.json(result.filter(l => l.availableQty > 0));

  } catch (error: any) {
    console.error("DEMAND_GET_ERROR:", error);
    return NextResponse.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}

// 2. POST: Save Demand Entry (Auto-Numbering Integrated)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { header, items } = body;

    const result = await prisma.$transaction(async (tx) => {
      
      // 1. GENERATE AUTOMATIC DEMAND NO
      const autoDmdNo = await getNextNumber("DMD", tx);

      // 2. CREATE DEMAND HEADER & ITEMS
      const demand = await tx.demand.create({
        data: {
          demandNo: autoDmdNo, // Engine se aaya number
          date: new Date(header.demandDate),
          partyId: header.partyId,
          status: "Pending",
          items: {
            create: items.map((it: any) => ({
              lotId: it.lotId,
              qty: it.demandQty
            }))
          }
        }
      });
      return demand;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Safety for stock & numbering
    });

    return NextResponse.json({ message: "Demand Saved Successfully", data: result }, { status: 201 });
  } catch (error: any) {
    console.error("DEMAND_POST_ERR:", error);
    return NextResponse.json({ error: error.message || "Failed to save demand" }, { status: 400 });
  }
}