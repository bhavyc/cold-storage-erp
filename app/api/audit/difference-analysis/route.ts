import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const diffType = searchParams.get("diffType") || "diff != 0";

    // 1. Sabhi Parties fetch karo unke Stock (Lots) aur Billing (Invoices) ke saath
    const parties = await prisma.party.findMany({
      include: {
        lots: {
          select: { receivedQty: true }
        },
        invoices: {
          where: { isProforma: false }, // Sirf pakke bill check honge
          include: {
            items: {
              select: { qty: true }
            }
          }
        }
      }
    });

    // 2. Data processing logic
    const auditReport = parties.map(party => {
      // Total Physical Inward (Stock Module)
      const totalInQty = party.lots.reduce((sum, lot) => sum + lot.receivedQty, 0);

      // Total Billed Quantity (Accounting/Billing Module)
      const totalBilledQty = party.invoices.reduce((invSum, inv) => {
        const itemSum = inv.items.reduce((s, it) => s + it.qty, 0);
        return invSum + itemSum;
      }, 0);

      const difference = totalInQty - totalBilledQty;

      return {
        id: party.id,
        partyName: party.tradeName,
        partyCode: party.partyCode,
        totalInQty,
        totalBilledQty,
        difference,
      };
    });

    // 3. Filter logic based on UI selection
    let filteredReport = auditReport;
    if (diffType === "diff != 0") {
      filteredReport = auditReport.filter(r => r.difference !== 0);
    } else if (diffType === "diff = 0") {
      filteredReport = auditReport.filter(r => r.difference === 0);
    }

    return NextResponse.json(filteredReport);

  } catch (error: any) {
    console.error("AUDIT_API_ERROR:", error);
    return NextResponse.json({ error: "Audit Analysis failed" }, { status: 500 });
  }
}