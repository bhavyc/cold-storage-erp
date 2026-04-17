import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");

    const rates = await prisma.partyItemRate.findMany({
      where: { partyId: partyId && partyId !== "All" ? partyId : undefined },
      include: { 
        party: { select: { tradeName: true, partyCode: true } },
        item: { select: { name: true } },
        unit: { select: { name: true } }
      },
      orderBy: { party: { tradeName: 'asc' } }
    });
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { partyId, rows } = await req.json();

    const result = await prisma.$transaction(async (tx) => {
      // Pehle purane rates delete karenge taaki overwrite ho sake (Standard ERP Logic)
      await tx.partyItemRate.deleteMany({ where: { partyId } });

      return await tx.partyItemRate.createMany({
        data: rows.map((row: any) => ({
          partyId,
          itemId: row.itemId,
          unitId: row.unitId,
          csRent: new Prisma.Decimal(row.csRent || 0),
          csLab: new Prisma.Decimal(row.csLab || 0),
          caRent: new Prisma.Decimal(row.caRent || 0),
          caLab: new Prisma.Decimal(row.caLab || 0),
          freight: new Prisma.Decimal(row.freight || 0),
          period: parseInt(row.period || 0),
        }))
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save rates" }, { status: 400 });
  }
}