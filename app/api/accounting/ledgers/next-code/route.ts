import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find the ledger with the highest code
    // We assume codes are like A001, A002 etc.
    const lastLedger = await prisma.ledger.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true }
    });

    let nextCode = "A001";

    if (lastLedger && lastLedger.code) {
      // Extract prefix and numeric part
      // Example: A001 -> prefix 'A', num 1
      const match = lastLedger.code.match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const num = parseInt(match[2]);
        nextCode = `${prefix}${String(num + 1).padStart(match[2].length, '0')}`;
      } else {
        // Fallback if pattern doesn't match
        nextCode = "A" + String(Date.now()).slice(-3); 
      }
    }

    return NextResponse.json({ nextCode });
  } catch (error: any) {
    console.error("Next Code API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
