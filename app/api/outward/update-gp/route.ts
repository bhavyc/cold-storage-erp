import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: Range wise GP dhoondna (Image 84 Filter logic)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromGp = searchParams.get("fromGp");
    const toGp = searchParams.get("toGp");

    if (!fromGp || !toGp) {
      return NextResponse.json({ error: "Please provide GP Range" }, { status: 400 });
    }

    const records = await prisma.outwardEntry.findMany({
      where: {
        gpNo: {
          gte: fromGp,
          lte: toGp
        }
      },
      orderBy: { gpNo: 'asc' }
    });

    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

// 2. PATCH: Bulk Update Minor Details
export async function PATCH(req: Request) {
  try {
    const body = await req.json(); // Array of records to update
    const { updates } = body;

    const result = await prisma.$transaction(
      updates.map((item: { id: string, transportRequired: boolean, grNo: string, vehicleNo: string, personName: string, remarks?: string }) =>
        prisma.outwardEntry.update({
          where: { id: item.id },
          data: {
            transportRequired: item.transportRequired,
            grNo: item.grNo,
            vehicleNo: item.vehicleNo,
            personName: item.personName,
            // remarks logic agar schema mein hai
          }
        })
      )
    );

    return NextResponse.json({ message: "All GPs Updated Successfully", count: result.length });
  } catch (error) {
    return NextResponse.json({ error: "Bulk Update Failed" }, { status: 400 });
  }
}
