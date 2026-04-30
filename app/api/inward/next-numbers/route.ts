import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Browser ko purana data dikhane se rokne ke liye
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Saare MR Numbers uthao
    const allMRs = await prisma.lot.findMany({
      select: { mrNo: true }
    });

    // Sabse bada MR Number dhoondo (Numeric parsing ke saath)
    const maxMR = allMRs.reduce((max, curr) => {
      const num = parseInt(curr.mrNo) || 0;
      return num > max ? num : max;
    }, 0);

    // 2. Saare Lot Numbers uthao
    const allLots = await prisma.lot.findMany({
      select: { lotNo: true }
    });

    // Sabse bada Lot Number dhoondo
    const maxLot = allLots.reduce((max, curr) => {
      const num = parseInt(curr.lotNo) || 0;
      return num > max ? num : max;
    }, 0);

    // 3. Final agla number (Agar DB khali hai toh 1 aur 1001 se shuru karein)
    const nextMR = maxMR === 0 ? "1" : (maxMR + 1).toString();
    const nextLot = maxLot === 0 ? 1001 : (maxLot + 1);

    return NextResponse.json({ nextMR, nextLot });
  } catch (error) {
    console.error("NUM_GEN_ERR:", error);
    return NextResponse.json({ nextMR: "1", nextLot: 1001 }, { status: 500 });
  }
}
