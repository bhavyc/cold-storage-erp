import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Fetch all chambers with their lots that have a balance
    const chambers = await prisma.chamber.findMany({
      include: {
        lots: {
          where: { balanceQty: { gt: 0 } },
          select: { balanceQty: true, floor: true }
        }
      },
      orderBy: { code: 'asc' }
    });

    // 2. Format Data for Analysis
    const analysisData = chambers.map(chamber => {
      const currentHolding = chamber.lots.reduce((sum, lot) => sum + lot.balanceQty, 0);
      const occupancyPercent = chamber.totalCapacity > 0 
        ? Math.round((currentHolding / chamber.totalCapacity) * 100) 
        : 0;

      // Group by Floor for Matrix view (Image 41)
      const floorStats: Record<string, number> = {};
      chamber.lots.forEach(lot => {
        const floorKey = lot.floor || "Unassigned";
        floorStats[floorKey] = (floorStats[floorKey] || 0) + lot.balanceQty;
      });

      return {
        id: chamber.id,
        code: chamber.code,
        name: chamber.name,
        type: chamber.type,
        capacity: chamber.totalCapacity,
        holding: currentHolding,
        available: chamber.totalCapacity - currentHolding,
        percent: occupancyPercent,
        floors: floorStats
      };
    });

    return NextResponse.json(analysisData);
  } catch (error) {
    return NextResponse.json({ error: "Chamber data fetch failed" }, { status: 500 });
  }
}