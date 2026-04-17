import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Dropdown values capture karo
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const categoryId = searchParams.get("categoryId");
    const itemId = searchParams.get("itemId");
    const unitId = searchParams.get("unitId");
    const varietyName = searchParams.get("varietyName");
    const sortData = searchParams.get("sortData") || "GpDateDesc";

    // 1. DYNAMIC FILTER OBJECT
    const whereClause: Prisma.OutwardEntryWhereInput = {
      gpDate: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
      lot: {
        // Party Filter
        partyId: partyId && partyId !== "All" ? partyId : undefined,
        // Item Filter
        itemId: itemId && itemId !== "All" ? itemId : undefined,
        // Unit Filter
        unitId: unitId && unitId !== "All" ? unitId : undefined,
        // Variety Filter
        variety: varietyName && varietyName !== "All" ? { contains: varietyName, mode: 'insensitive' } : undefined,
        // Category Filter (Nested relation)
        item: categoryId && categoryId !== "All" ? { categoryId: categoryId } : undefined,
      }
    };

    // 2. DYNAMIC SORTING
    let orderBy: any = { gpDate: 'desc' };
    if (sortData === "GpDateAsc") orderBy = { gpDate: 'asc' };
    if (sortData === "GpNoAsc") orderBy = { gpNo: 'asc' };
    if (sortData === "GpNoDesc") orderBy = { gpNo: 'desc' };

    const dispatches = await prisma.outwardEntry.findMany({
      where: whereClause,
      include: {
        lot: {
          include: {
            party: true,
            item: { include: { category: true } },
            unit: true
          }
        }
      },
      orderBy: orderBy
    });

    return NextResponse.json(dispatches);
  } catch (error) {
    console.error("SEARCH_API_ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch outward data" }, { status: 500 });
  }
}


 