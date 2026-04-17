// app/api/masters/units/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. DELETE UNIT
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Check karo ki ye Unit kisi Lot mein toh use nahi ho rahi?
    const lotCount = await prisma.lot.count({ where: { unitId: id } });
    if (lotCount > 0) {
      return NextResponse.json(
        { error: "Bhai, ye Unit (Bag/Peti) Lots mein use ho rahi hai. Ise delete nahi kar sakte!" },
        { status: 400 }
      );
    }

    await prisma.unit.delete({ where: { id: id } });
    return NextResponse.json({ message: "Unit delete ho gayi!" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// 2. UPDATE UNIT (EDIT)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const updatedUnit = await prisma.unit.update({
      where: { id },
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

    return NextResponse.json(updatedUnit);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}