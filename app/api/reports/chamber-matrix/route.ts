import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const chambers = await prisma.chamber.findMany({
      include: {
        lots: {
          where: { balanceQty: { gt: 0 } }
        }
      }
    });

    // Matrix Logic: Map floors to chambers
    const matrix = chambers.map((chamber) => {
      const floorStats: Record<string, number> = {};
      
      chamber.lots.forEach(lot => {
        const floorKey = lot.floor || "Unassigned";
        floorStats[floorKey] = (floorStats[floorKey] || 0) + lot.balanceQty;
      });

      return {
        chamberName: chamber.name,
        chamberCode: chamber.code,
        totalCapacity: chamber.totalCapacity,
        totalOccupied: chamber.lots.reduce((s, l) => s + l.balanceQty, 0),
        floors: floorStats // This returns { "Floor 1": 500, "Floor 2": 300 }
      };
    });

    return NextResponse.json(matrix);
  } catch (error) {
    return NextResponse.json({ error: "Matrix generation failed" }, { status: 500 });
  }
}
