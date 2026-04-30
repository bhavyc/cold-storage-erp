import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. GET: Saare saved special rates nikalne ke liye
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const partyId = searchParams.get("partyId");
    const itemId = searchParams.get("itemId");
    const unitId = searchParams.get("unitId");

    const rates = await prisma.partyItemRate.findMany({
      where: {
        partyId: partyId && partyId !== "All" ? partyId : undefined,
        itemId: itemId && itemId !== "All" ? itemId : undefined,
        unitId: unitId && unitId !== "All" ? unitId : undefined
      },
      include: {
        party: { select: { tradeName: true, partyCode: true } },
        item: { select: { name: true } },
        unit: { select: { name: true } }
      },
      orderBy: { party: { tradeName: 'asc' } }
    });
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Rates fetch fail ho gaye!" }, { status: 500 });
  }
}

// 2. POST: Naye rates save ya purane overwrite karne ke liye
export async function POST(req: Request) {
  try {
    const { partyId, rows } = await req.json();

    if (!partyId || !rows || rows.length === 0) {
      return NextResponse.json({ error: "Party aur Rates mandatory hain!" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Step A: Is Party ke puraane saare special rates delete kardo (Fresh Start)
      await tx.partyItemRate.deleteMany({ where: { partyId } });

      // Step B: Naye rows insert karo
      return await tx.partyItemRate.createMany({
        data: rows.map((row: any) => ({
          partyId: partyId,
          itemId: row.itemId,
          unitId: row.unitId,
          csRent: new Prisma.Decimal(row.csRent || 0),
          csLab: new Prisma.Decimal(row.csLab || 0),
          caRent: new Prisma.Decimal(row.caRent || 0),
          caLab: new Prisma.Decimal(row.caLab || 0),
          freight: new Prisma.Decimal(row.freight || 0),
        }))
      });
    });

    return NextResponse.json({ message: "Rates successfully locked!", count: result.count });
  } catch (error: any) {
    console.error("RATE_POST_ERR:", error);
    return NextResponse.json({ error: "Save process fail ho gaya!" }, { status: 400 });
  }
}
