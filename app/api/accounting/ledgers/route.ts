import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const ledgers = await prisma.ledger.findMany({
      include: { group: true },
      orderBy: { code: 'asc' }
    });
    return NextResponse.json(ledgers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ledgers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Automation: Code auto-increment or manual as per Image 77
    const ledger = await prisma.ledger.create({
      data: {
        code: body.code,
        name: body.name,
        groupId: body.groupId, // G01, G02 etc. from Group Master
        openingBalance: new Prisma.Decimal(body.openingAmt || 0),
        openingMode: body.openingMode, // Debit or Credit
        maxCredit: new Prisma.Decimal(body.maxAllowedCredit || 0),
        // Note: Extra metadata fields (PAN, GST, Mobile) if needed in Schema
      }
    });
    return NextResponse.json(ledger, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Ledger creation failed" }, { status: 400 });
  }
}
