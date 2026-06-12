import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItemSchema } from "@/lib/validations/item";
import { verifyRole } from "@/lib/auth-guard";

// GET: Sabhi Items unke Units ke saath nikalne ke liye

export async function GET(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const hsn = searchParams.get("hsn");

    const items = await prisma.item.findMany({
      where: {
        AND: [
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
          hsn ? { hsnCode: { contains: hsn, mode: 'insensitive' } } : {},
        ]
      },
      include: {
        category: true,
        itemUnits: { include: { unit: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
// POST: Naya Item create karna with multiple Units
export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"]);
    if (guard.response) return guard.response as Response;

    const body = await req.json();
    const validatedData = ItemSchema.parse(body);

    // Database Transaction: Taaki ya toh poora item save ho ya kuch bhi nahi
    const newItem = await prisma.$transaction(async (tx) => {
      // 1. Item Create karein
      const item = await tx.item.create({
        data: {
          code: validatedData.code,
          name: validatedData.name,
          categoryId: validatedData.categoryId,
          hsnCode: validatedData.hsnCode,
          gstRate: validatedData.gstRate,
          // 2. Uske saath jude saare Unit Rates save karein
          itemUnits: {
            create: validatedData.unitConfigs.map((config) => ({
              unitId: config.unitId,
              rentRate: config.rentRate,
              labourRate: config.labourRate,
              weight: config.weight,
              lotValue: config.lotValue,
              period: config.period,
            })),
          },
        },
        include: {
          itemUnits: true,
        },
      });
      return item;
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("ITEM_CREATE_ERROR", error);
    return NextResponse.json({ error: "Invalid data or Item Code already exists" }, { status: 400 });
  }
}
