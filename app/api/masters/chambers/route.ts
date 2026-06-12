import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRole } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const chambers = await prisma.chamber.findMany({ orderBy: { code: 'asc' } });
    return NextResponse.json(chambers);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"]);
    if (guard.response) return guard.response as Response;

    const body = await req.json();
    
    // Automation: Theoretical Math (L * B * H)
    // Cold Storage standard: Volume / 2.5 (cubic ft per bag) 
    // Image 24 shows L, B, H fields.
    let finalCapacity = body.totalCapacity;
    if (body.capacityMode === "Theoretical" && body.length && body.breadth && body.height) {
      finalCapacity = Math.floor((body.length * body.breadth * body.height) / 2.5);
    }

    const chamber = await prisma.chamber.create({
      data: {
        code: body.code,
        name: body.name,
        remarks: body.remarks,
        type: body.type, // CS or CA
        capacityMode: body.capacityMode,
        length: body.length ? new Prisma.Decimal(body.length) : null,
        breadth: body.breadth ? new Prisma.Decimal(body.breadth) : null,
        height: body.height ? new Prisma.Decimal(body.height) : null,
        totalCapacity: finalCapacity,
        totalPallets: parseInt(body.totalPallets || 0),
      }
    });

    return NextResponse.json(chamber, { status: 201 });
  } catch (error) {
    console.error("CHAMBER_API_ERR", error);
    return NextResponse.json({ error: "Failed to save chamber" }, { status: 400 });
  }
}
