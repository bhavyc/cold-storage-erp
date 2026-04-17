import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chamberId = searchParams.get("chamberId");
    const palletNo = searchParams.get("palletNo");

    // Dynamic Filter
   const whereClause: any = {
        status: "Occupied", // Sirf bhare hue pallets dikhao
    };

    if (chamberId && chamberId !== "All") {
        whereClause.chamberId = chamberId;
    }

    if (palletNo) {
        whereClause.palletNo = { contains: palletNo, mode: 'insensitive' };
    }

    const reportData = await prisma.pallet.findMany({
      where: whereClause,
      include: {
        chamber: { select: { name: true } },
        lot: {
          include: {
            item: { select: { name: true } }
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