import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const gstFilter = searchParams.get("gstFilter") || "ALL"; // ALL, GST Bill, Non-GST Bill

    const where: Prisma.InvoiceWhereInput = {
      date: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
      partyId: partyId && partyId !== "All" ? partyId : undefined,
      isProforma: false, // Kachcha bill GST mein nahi aata
    };

    // Filter logic for GST vs Non-GST (Image 55 Logic)
    if (gstFilter === "GST Bill") where.party = { NOT: { gstNo: null } };
    if (gstFilter === "Non-GST Bill") where.party = { gstNo: null };

    const invoices = await prisma.invoice.findMany({
      where,
      include: { 
        party: true,
        items: { include: { lot: { include: { item: true } } } }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch GST data" }, { status: 500 });
  }
}
