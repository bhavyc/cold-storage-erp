import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");
    const query = searchParams.get("query") || ""; // Search by Lot No or Marka

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    const lots = await prisma.lot.findMany({
      where: {
        partyId: partyId,
        OR: [
          { lotNo: { contains: query, mode: "insensitive" } },
          { mrNo: { contains: query, mode: "insensitive" } },
          { marka: { contains: query, mode: "insensitive" } },
        ],
        // Only show lots with balance > 0 if specified, or all
        // balanceQty: { gt: 0 } 
      },
      include: {
        item: { select: { name: true, code: true } },
        unit: { select: { name: true } },
        chamber: { select: { name: true, code: true } },
      },
      orderBy: { arrivalDate: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (error: any) {
    console.error("Stock API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
