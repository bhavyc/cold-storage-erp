import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 1. Saare params ko safely nikalo
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const statusParam = searchParams.get("status"); // Yahan galti thi, ise define kiya

    const where: any = {};

    // 2. Status Filter: Agar frontend se status bheja hai (jaise GP Modal se 'Pending')
    if (statusParam && statusParam !== "All") {
      where.status = statusParam;
    }

    // 3. Date Filter logic
    if (fromDate && toDate) {
      where.date = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    // 4. Party Filter logic
    if (partyId && partyId !== "All") {
      where.partyId = partyId;
    }

    const demands = await prisma.demand.findMany({
      where,
      include: {
        party: true,
        items: {
          include: {
            lot: {
              include: { 
                item: true,
                unit: true,
                chamber: true,
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(demands);
  } catch (error: any) {
    console.error("REGISTER_FETCH_ERROR:", error.message);
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
