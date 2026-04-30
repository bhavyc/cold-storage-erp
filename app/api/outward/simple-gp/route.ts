// app/api/outward/simple-gp/summary/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");

    // Simple Gate Pass data hum un Invoices se uthate hain jinka billingType "Simple GP" hai
    const where: any = {
      billingType: "Simple Gate Pass", 
      date: {
        gte: fromDate ? new Date(fromDate) : undefined,
        lte: toDate ? new Date(toDate) : undefined,
      },
    };

    if (partyId && partyId !== "All") {
      where.partyId = partyId;
    }

    const simpleInvoices = await prisma.invoice.findMany({
      where,
      include: {
        party: { select: { tradeName: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Formatting data for the table
    const result = simpleInvoices.map(inv => ({
      id: inv.id,
      gpNo: inv.invoiceNo, // Invoice No hi GP No ki tarah behave karta hai yahan
      partyName: inv.party.tradeName,
      remarks: inv.billingType || "Cash Sale",
      amt: inv.netAmount,
      date: inv.date
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
