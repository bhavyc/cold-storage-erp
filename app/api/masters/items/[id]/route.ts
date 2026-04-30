import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. DELETE ITEM (With Integrity Check)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params; // Awaiting params for safety

    // ✅ SAFETY CHECK: Check if item is linked to existing stock or custom rates
    const [lotCount, partyRateCount] = await Promise.all([
      prisma.lot.count({ where: { itemId: id } }),
      prisma.partyItemRate.count({ where: { itemId: id } })
    ]);

    if (lotCount > 0) {
      return NextResponse.json(
        { error: `Item delete nahi ho sakta! Iske ${lotCount} Lots warehouse mein maujood hain.` },
        { status: 400 }
      );
    }

    if (partyRateCount > 0) {
      return NextResponse.json(
        { error: "Is Item ke Party-wise special rates fixed hain. Pehle unhe delete karein." },
        { status: 400 }
      );
    }

    // Process deletion in transaction
    await prisma.$transaction([
      prisma.itemUnitConfig.deleteMany({ where: { itemId: id } }),
      prisma.item.delete({ where: { id: id } })
    ]);

    return NextResponse.json({ message: "Item deleted successfully from system" });

  } catch (error: any) {
    console.error("ITEM_DELETE_ERR:", error);
    return NextResponse.json({ error: "Server Error: Deletion failed" }, { status: 500 });
  }
}

// 2. UPDATE ITEM (EDIT)
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params;
    const body = await req.json();

    // ✅ Fix 1: Filter out rows where unitId is missing before processing
    const validConfigs = (body.unitConfigs || []).filter((u: any) => u.unitId && u.unitId.trim() !== "");

    if (validConfigs.length === 0) {
      return NextResponse.json({ error: "Kam se kam ek valid Packaging Unit chunein!" }, { status: 400 });
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Step A: Purane configs saaf karo
      await tx.itemUnitConfig.deleteMany({ where: { itemId: id } });

      // Step B: Item update aur naye configs create
      return await tx.item.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          categoryId: body.categoryId,
          hsnCode: body.hsnCode || null,
          gstRate: new Prisma.Decimal(body.gstRate || 0),
          itemUnits: {
            create: validConfigs.map((u: any) => ({
              unitId: u.unitId,
              rentRate: new Prisma.Decimal(u.rentRate || 0),
              labourRate: new Prisma.Decimal(u.labourRate || 0),
              weight: new Prisma.Decimal(u.weight || 0),
              lotValue: new Prisma.Decimal(u.lotValue || 0),
              period: parseInt(u.period || 0),
            }))
          }
        },
        include: { itemUnits: true }
      });
    });

    return NextResponse.json(updatedItem);

  } catch (error: any) {
    console.error("PATCH_ERROR:", error);
    if (error.code === 'P2002') return NextResponse.json({ error: "Item Code already exists!" }, { status: 400 });
    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 400 });
  }
}
