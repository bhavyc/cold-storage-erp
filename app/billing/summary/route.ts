import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const billingType = searchParams.get("billingType");
    const sortData = searchParams.get("sortData") || "OLD TO NEW";

    // 1. Dynamic Filters
    let whereClause: any = {
        isProforma: false // Sirf asli bill dikhao, kachche (PI) nahi
    };

    if (fromDate && toDate) {
        whereClause.date = { gte: new Date(fromDate), lte: new Date(toDate) };
    }
    if (partyId && partyId !== "All") {
        whereClause.partyId = partyId;
    }
    if (billingType && billingType !== "All") {
        whereClause.billingType = billingType;
    }

    // 2. Fetch Data
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        party: { select: { tradeName: true, gstNo: true } }
      },
      orderBy: {
        date: sortData === "OLD TO NEW" ? 'asc' : 'desc'
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}