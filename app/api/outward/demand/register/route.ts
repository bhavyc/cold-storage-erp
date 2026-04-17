import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");

    const where: any = {};

    // Date Filter logic
    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // Party Filter logic
    if (partyId && partyId !== "All") {
      where.partyId = partyId;
    }

    const demands = await prisma.demand.findMany({
      where,
      include: {
        party: true, // Ab ye error nahi dega schema update ke baad
        items: {
          include: {
            lot: {
              include: { 

                 item: true,    // Item name ke liye
            unit: true,    // Packing/Unit name ke liye (YAHAN GADBAD THI)
            chamber: true, // Location ke liye
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(demands);
  } catch (error: any) {
    console.error("REGISTER_FETCH_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { partyId } = await req.json();

    const where: any = { status: "Pending" };
    if (partyId && partyId !== "All") {
      where.partyId = partyId;
    }

    const result = await prisma.demand.updateMany({
      where,
      data: { status: "Completed" }
    });

    return NextResponse.json({ message: `${result.count} demands marked as complete` });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}