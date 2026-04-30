import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sequence = await prisma.systemSequence.findUnique({
      where: { entityType: "INV" }
    });

    const nextNo = sequence 
      ? `${sequence.prefix || ""}${(sequence.lastNumber + 1).toString().padStart(4, '0')}` 
      : "0001";

    return NextResponse.json({ nextNo });
  } catch (error) {
    return NextResponse.json({ nextNo: "INV-ERR" });
  }
}
