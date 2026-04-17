// app/api/masters/items/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. DELETE ITEM
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    await prisma.$transaction([
      prisma.itemUnitConfig.deleteMany({ where: { itemId: id } }), // Pehle configs delete karo
      prisma.item.delete({ where: { id: id } }) // Phir item
    ]);
    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed. Item might be in use in Lots." }, { status: 400 });
  }
}

// 2. UPDATE ITEM (EDIT)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Pehle purane configs delete karo
      await tx.itemUnitConfig.deleteMany({ where: { itemId: id } });

      // Item update karo aur naye configs insert karo
      return await tx.item.update({
        where: { id },
        data: {
          code: body.code,
          name: body.name,
          categoryId: body.categoryId,
          hsnCode: body.hsnCode,
          gstRate: body.gstRate,
          itemUnits: {
            create: body.unitConfigs.map((u: any) => ({
              unitId: u.unitId,
              rentRate: u.rentRate,
              labourRate: u.labourRate,
              weight: u.weight,
              lotValue: u.lotValue,
              period: u.period,
            }))
          }
        }
      });
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}