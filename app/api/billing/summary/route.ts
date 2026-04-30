import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // 1. Capture Filters from Frontend
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const partyId = searchParams.get("partyId");
    const billingType = searchParams.get("billingType");
    const sortData = searchParams.get("sortData") || "NEW TO OLD";

    // 2. Build Dynamic Where Clause
    const whereClause: Prisma.InvoiceWhereInput = {
      isProforma: false, // Sirf asli Tax Invoices dikhayenge
    };

    // Date Filter
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date.gte = new Date(fromDate);
      if (toDate) whereClause.date.lte = new Date(toDate);
    }

    // Party Filter
    if (partyId && partyId !== "All") {
      whereClause.partyId = partyId;
    }

    // Billing Type Filter
    if (billingType && billingType !== "All") {
      whereClause.billingType = billingType;
    }

    // 3. Fetch Data with Sorting
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        party: {
          select: {
            tradeName: true,
            partyCode: true,
            gstNo: true
          }
        }
      },
      orderBy: {
        date: sortData === "NEW TO OLD" ? "desc" : "asc"
      }
    });

    return NextResponse.json(invoices);

  } catch (error: any) {
    console.error("BILL_SUMMARY_API_ERR:", error);
    return NextResponse.json({ error: "Failed to fetch bill summary" }, { status: 500 });
  }
}
