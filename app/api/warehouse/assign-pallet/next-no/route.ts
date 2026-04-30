import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const seq = await prisma.systemSequence.findUnique({
      where: { entityType: "PAL" }
    });
    
    let nextNum = 1;
    if (seq) {
      nextNum = seq.lastNumber + 1;
    }
    
    const paddedNumber = nextNum.toString().padStart(4, '0');
    const finalId = seq?.prefix ? `${seq.prefix}${paddedNumber}` : paddedNumber;
    
    return NextResponse.json({ nextAssignNo: finalId });
  } catch (error) {
    console.error("NUM_GEN_ERR:", error);
    return NextResponse.json({ nextAssignNo: "0001" }, { status: 500 });
  }
}
