import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. GET: Single Chamber Fetching (Fixed for Next.js 15)
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params; // ✅ FIX: Must await params
    
    const chamber = await prisma.chamber.findUnique({
      where: { id }
    });
    
    if (!chamber) return NextResponse.json({ error: "Chamber not found" }, { status: 404 });
    
    return NextResponse.json(chamber);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chamber" }, { status: 400 });
  }
}

// 2. PATCH: Update existing chamber (Fixed for Next.js 15)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params; // ✅ FIX: Must await params
    const body = await req.json();
    
    // Theoretical Logic same as Create
    let finalCapacity = body.totalCapacity;
    if (body.capacityMode === "Theoretical" && body.length && body.breadth && body.height) {
      finalCapacity = Math.floor((Number(body.length) * Number(body.breadth) * Number(body.height)) / 2.5);
    }

    const updatedChamber = await prisma.chamber.update({
      where: { id: id }, // ✅ id is now correctly unwrapped
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

    return NextResponse.json({ 
      message: "Chamber configuration updated!", 
      data: updatedChamber 
    });
  } catch (error: any) {
    console.error("CHAMBER_PATCH_ERR:", error);
    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 400 });
  }
}

// 3. DELETE: Chamber removal (Safety check included)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
    try {
      const { id } = await params; // ✅ FIX: Must await params
  
      // Check if any lots are using this chamber
      const lotCount = await prisma.lot.count({ where: { chamberId: id } });
      if (lotCount > 0) {
        return NextResponse.json(
          { error: `Bhai, is chamber mein ${lotCount} Lots pade hain! Ise delete nahi kar sakte.` },
          { status: 400 }
        );
      }
  
      await prisma.chamber.delete({ where: { id } });
      return NextResponse.json({ message: "Chamber successfully deleted!" });
    } catch (error) {
      return NextResponse.json({ error: "Delete process failed" }, { status: 500 });
    }
}