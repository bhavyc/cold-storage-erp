import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRole } from "@/lib/auth-guard";

// GET All Units
export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const units = await prisma.unit.findMany({ orderBy: { code: 'asc' } });
    return NextResponse.json(units);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// POST Create Unit
export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"]);
    if (guard.response) return guard.response as Response;

    const body = await req.json();
    const unit = await prisma.unit.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        emptyWeight: new Prisma.Decimal(body.emptyWeight || 0),
        rateToContractorIn: new Prisma.Decimal(body.rateToContractorIn || 0),
        rateToContractorOut: new Prisma.Decimal(body.rateToContractorOut || 0),
        opBalance: parseInt(body.opBalance || 0),
      }
    });
    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Create failed" }, { status: 400 });
  }
}
