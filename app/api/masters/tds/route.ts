import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  const tds = await prisma.tDSMaster.findMany({ 
    include: { ledger: { select: { name: true, code: true } } },
    orderBy: { tdsPercentage: 'asc' } 
  });
  return NextResponse.json(tds);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tds = await prisma.tDSMaster.create({
      data: {
        section: body.section,
        description: body.description,
        panStatus: body.panStatus === "Yes",
        minThreshold: new Prisma.Decimal(body.minThreshold || 0),
        tdsPercentage: new Prisma.Decimal(body.tdsPercentage || 0),
        ledgerId: body.ledgerId || null,
      }
    });
    return NextResponse.json(tds, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save TDS" }, { status: 400 });
  }
}
