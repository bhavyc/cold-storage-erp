import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET: Single Chamber for editing
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const chamber = await prisma.chamber.findUnique({
      where: { id: params.id }
    });
    return NextResponse.json(chamber);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chamber" }, { status: 400 });
  }
}

// PATCH: Update existing chamber
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    
    // Theoretical Logic same as Create
    let finalCapacity = body.totalCapacity;
    if (body.capacityMode === "Theoretical" && body.length && body.breadth && body.height) {
      finalCapacity = Math.floor((body.length * body.breadth * body.height) / 2.5);
    }

    const updatedChamber = await prisma.chamber.update({
      where: { id: params.id },
      data: {
        name: body.name,
        remarks: body.remarks,
        type: body.type,
        capacityMode: body.capacityMode,
        length: body.length ? new Prisma.Decimal(body.length) : null,
        breadth: body.breadth ? new Prisma.Decimal(body.breadth) : null,
        height: body.height ? new Prisma.Decimal(body.height) : null,
        totalCapacity: finalCapacity,
        totalPallets: parseInt(body.totalPallets || 0),
      }
    });

    return NextResponse.json(updatedChamber);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}