import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Filters from Image 63 & 64
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const categoryId = searchParams.get("categoryId");
    const itemId = searchParams.get("itemId");
    const unitId = searchParams.get("unitId");
    const variety = searchParams.get("variety");
    const sortBy = searchParams.get("sortBy") || "desc";

    const where: Prisma.LotWhereInput = {
      arrivalDate: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
      partyId: partyId && partyId !== "All" ? partyId : undefined,
      itemId: itemId && itemId !== "All" ? itemId : undefined,
      variety: variety && variety !== "All" ? { contains: variety, mode: 'insensitive' } : undefined,
      item: categoryId && categoryId !== "All" ? { categoryId: categoryId } : undefined,
      unitId: unitId && unitId !== "All" ? unitId : undefined,
    };

    const lots = await prisma.lot.findMany({
      where,
      include: {
        party: true,
        item: { include: { category: true } },
        unit: true,
        chamber: true,
        inwardEntry: true, // For TruckNo, Person, ManuDt
      },
      orderBy: { arrivalDate: sortBy === "desc" ? "desc" : "asc" }
    });

    return NextResponse.json(lots);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch register" }, { status: 500 });
  }
}