import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chamberId = searchParams.get("chamberId");
    const query = searchParams.get("query"); // Naya Smart Query param

    // Dynamic Filter
    const whereClause: any = {
        status: "Occupied",
    };

    if (chamberId && chamberId !== "All") {
        whereClause.chamberId = chamberId;
    }

    //  SMART SEARCH logic inside Report
    if (query) {
        whereClause.OR = [
            { palletNo: { contains: query, mode: 'insensitive' } },
            { lot: { lotNo: { contains: query, mode: 'insensitive' } } },
            { lot: { marka: { contains: query, mode: 'insensitive' } } },
            { lot: { party: { tradeName: { contains: query, mode: 'insensitive' } } } }
        ];
    }

    const reportData = await prisma.pallet.findMany({
      where: whereClause,
      include: {
        chamber: { select: { name: true } },
        lot: {
          include: {
            item: { select: { name: true } },
            party: { select: { tradeName: true } } // Kisan ka naam report mein dikhane ke liye
          }
        }
      },
      orderBy: { palletNo: 'asc' }
    });

    return NextResponse.json(reportData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}








