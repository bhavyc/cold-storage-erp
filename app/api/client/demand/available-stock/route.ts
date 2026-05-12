import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    // 0. Fetch Party Payment Status
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      select: { paymentPreference: true, openingBalance: true, openingMode: true }
    });

    // Simple balance calculation (mirroring dashboard)
    const invoices = await prisma.invoice.aggregate({ where: { partyId }, _sum: { netAmount: true } });
    const receipts = await prisma.voucher.aggregate({ where: { partyId, vocType: "Receipt" }, _sum: { totalAmount: true } });
    const opBal = Number(party?.openingBalance) || 0;
    const totalInv = Number(invoices._sum.netAmount) || 0;
    const totalRec = Number(receipts._sum.totalAmount) || 0;
    const balance = party?.openingMode === "Debit" ? (opBal + totalInv) - totalRec : (totalInv - (opBal + totalRec));

    // 1. Fetch Lots for the party
    const lots = await prisma.lot.findMany({
      where: { 
        partyId: partyId,
        balanceQty: { gt: 0 } 
      },
      include: { 
        item: { select: { name: true } }, 
        unit: { select: { name: true } }, 
        chamber: { select: { name: true } },
        demandItems: { 
          include: {
            demand: { select: { status: true } } 
          }
        }
      }
    });

    // 2. Calculate available balance (Physical Stock - Pending Demands)
    const result = lots.map((lot: any) => {
      const totalBlocked = (lot.demandItems || [])
        .filter((d: any) => d.demand?.status === "Pending")
        .reduce((sum: number, d: any) => sum + (Number(d.qty) || 0), 0);
      
      const available = lot.balanceQty - totalBlocked;

      return {
        id: lot.id,
        lotNo: lot.lotNo,
        mrNo: lot.mrNo,
        itemName: lot.item?.name,
        unitName: lot.unit?.name,
        chamberName: lot.chamber?.name,
        physicalQty: lot.balanceQty,
        blockedQty: totalBlocked,
        availableQty: available > 0 ? available : 0,
      };
    });

    return NextResponse.json({
      success: true,
      partyInfo: {
        paymentPreference: party?.paymentPreference,
        outstandingBalance: balance,
      },
      data: result.filter(l => l.availableQty > 0),
    });

  } catch (error: any) {
    console.error("Client Available Stock Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
