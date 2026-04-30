import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. DELETE UNIT (With Deep Integrity Check)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params; // Awaiting params for Next.js 15 compatibility

    // ✅ DEEP SAFETY CHECK: Check all dependencies before deleting
    const [lotCount, itemConfigCount, partyRateCount] = await Promise.all([
      prisma.lot.count({ where: { unitId: id } }),
      prisma.itemUnitConfig.count({ where: { unitId: id } }),
      prisma.partyItemRate.count({ where: { unitId: id } })
    ]);

    // Scenario A: Physical Stock exists
    if (lotCount > 0) {
      return NextResponse.json(
        { error: `Unit delete nahi ho sakti! Iske ${lotCount} Lots warehouse mein maujood hain.` },
        { status: 400 }
      );
    }

    // Scenario B: Linked to Item Master default rates
    if (itemConfigCount > 0) {
      return NextResponse.json(
        { error: "Ye Unit Item Master ke configurations mein use ho rahi hai. Pehle Item Master se iska rate hataiye." },
        { status: 400 }
      );
    }

    // Scenario C: Linked to Party Special Rates
    if (partyRateCount > 0) {
      return NextResponse.json(
        { error: "Is Unit ke liye Party-wise special rates fixed hain. Pehle Party Rate Master clean karein." },
        { status: 400 }
      );
    }

    // Final Deletion
    await prisma.unit.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Unit successfully system se delete kar di gayi hai." });

  } catch (error: any) {
    console.error("UNIT_DELETE_ERR:", error);
    return NextResponse.json({ error: "Server Error: Deletion process fail ho gaya." }, { status: 500 });
  }
}

// 2. UPDATE UNIT (With Precision Decimal logic)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedUnit = await prisma.unit.update({
      where: { id },
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        // ✅ Converting to strict Decimal to prevent math errors in Weight Engine
        emptyWeight: new Prisma.Decimal(body.emptyWeight || 0),
        rateToContractorIn: new Prisma.Decimal(body.rateToContractorIn || 0),
        rateToContractorOut: new Prisma.Decimal(body.rateToContractorOut || 0),
        opBalance: parseInt(body.opBalance || 0),
      }
    });

    return NextResponse.json({ 
      message: "Unit details synchronized successfully!", 
      data: updatedUnit 
    });

  } catch (error: any) {
    console.error("UNIT_UPDATE_ERR:", error);

    // Unique Code Constraint Check
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Ye Unit Code pehle se maujood hai! Kripya unique code use karein." 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 400 });
  }
}