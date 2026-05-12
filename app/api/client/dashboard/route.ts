import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    // 1. Get Party Info
    const party = await prisma.party.findUnique({
      where: { id: partyId },
      select: {
        tradeName: true,
        paymentPreference: true,
        maxAllowedCredit: true,
        openingBalance: true,
        openingMode: true,
      }
    });

    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // 2. Fetch Stock Summary
    const lots_all = await prisma.lot.findMany({
      where: { partyId: partyId },
      select: { balanceQty: true }
    });

    const totalBags = lots_all.reduce((sum, lot) => sum + lot.balanceQty, 0);
    const totalLots = lots_all.length;

    // 3. Fetch Recent Activities (Last 5 MRs and GPs)
    const recentMRs = await prisma.lot.findMany({
      where: { partyId: partyId },
      orderBy: { arrivalDate: "desc" },
      take: 5,
      select: {
        id: true,
        lotNo: true,
        mrNo: true,
        arrivalDate: true,
        receivedQty: true,
        item: { select: { name: true } },
      }
    });

    const recentGPs = await prisma.outwardEntry.findMany({
      where: { lot: { partyId: partyId } },
      orderBy: { gpDate: "desc" },
      take: 5,
      select: {
        id: true,
        gpNo: true,
        gpDate: true,
        qty: true,
        lot: {
          select: {
            lotNo: true,
            item: { select: { name: true } }
          }
        }
      }
    });

    // 4. Fetch Ledger Summary (Outstanding Balance)
    const invoices = await prisma.invoice.aggregate({
      where: { partyId: partyId },
      _sum: { netAmount: true }
    });

    const receipts = await prisma.voucher.aggregate({
      where: { partyId: partyId, vocType: "Receipt" },
      _sum: { totalAmount: true }
    });

    const opBal = Number(party.openingBalance) || 0;
    const opMode = party.openingMode; 
    const totalInv = Number(invoices._sum.netAmount) || 0;
    const totalRec = Number(receipts._sum.totalAmount) || 0;

    const outstandingBalance = opMode === "Debit" 
      ? (opBal + totalInv) - totalRec 
      : (totalInv - (opBal + totalRec));

    return NextResponse.json({
      success: true,
      data: {
        party: {
          name: party.tradeName,
          paymentPreference: party.paymentPreference,
          maxAllowedCredit: party.maxAllowedCredit,
        },
        stock: {
          totalBags,
          totalLots,
        },
        financials: {
          outstandingBalance: outstandingBalance.toFixed(2),
        },
        recentActivities: {
          inwards: recentMRs,
          outwards: recentGPs,
        }
      },
    });
  } catch (error: any) {
    console.error("Client Dashboard Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
