import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 1. GET: Fetch Lots in a range
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromLot = searchParams.get("fromLot");
    const toLot = searchParams.get("toLot");

    if (!fromLot || !toLot) {
      return NextResponse.json({ error: "Please provide Lot Range" }, { status: 400 });
    }

    const lots = await prisma.lot.findMany({
      where: {
        lotNo: { gte: fromLot, lte: toLot }
      },
      include: {
        party: { select: { tradeName: true } },
        item: { select: { name: true } },
        unit: { select: { name: true } },
        inwardEntry: true
      },
      orderBy: { lotNo: 'asc' }
    });

    return NextResponse.json(lots);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// 2. PATCH: Bulk Update Stock Registry

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { updates } = body;

    const result = await prisma.$transaction(
      updates.map((item: any) => 
        prisma.lot.update({
          where: { id: item.id },
          data: {
            chamberId: item.chamberId,
            floor: item.floor,
            pole: item.pole,
            marka: item.marka,
            pMarka: item.pMarka,
            variety: item.variety,
            perUnitWgt: new Prisma.Decimal(item.perUnitWgt || 0),
            
            // ✅ FIX: Nested Update ki jagah Upsert use kiya hai
            // Agar InwardEntry table mein record nahi hai, toh ye create karega
            inwardEntry: {
              upsert: {
                update: {
                  truckNo: item.truckNo,
                  deliveryPerson: item.deliveryPerson,
                  remarks: item.remarks
                },
                create: {
                  truckNo: item.truckNo || "",
                  deliveryPerson: item.deliveryPerson || "",
                  remarks: item.remarks || "",
                  // Mandatory field default: arrivalDate hi mrDate ban jayegi
                  mrDate: item.arrivalDate ? new Date(item.arrivalDate) : new Date()
                }
              }
            }
          }
        })
      )
    );

    return NextResponse.json({ 
        message: `${result.length} Stock records synchronized!`, 
        count: result.length 
    });
  } catch (error: any) {
    console.error("BULK_UPDATE_ERR:", error);
    return NextResponse.json({ 
        error: "Update failed: Ensure all lot data is valid." 
    }, { status: 400 });
  }
}
