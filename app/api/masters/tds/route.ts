import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRole } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"]);
    if (guard.response) return guard.response as Response;

    const tds = await prisma.tDSMaster.findMany({ 
      include: { ledger: { select: { name: true, code: true } } },
      orderBy: { tdsPercentage: 'asc' } 
    });
    return NextResponse.json(tds);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch TDS rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;

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
