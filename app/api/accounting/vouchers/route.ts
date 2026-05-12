import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine"; // Import Sequence Engine

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { header, items } = body;

    // 1. DR must equal CR Validation
    const totalDr = items.reduce((s: number, i: any) => s + Number(i.debit || 0), 0);
    const totalCr = items.reduce((s: number, i: any) => s + Number(i.credit || 0), 0);

    if (Math.abs(totalDr - totalCr) > 0.01) {
      return NextResponse.json({ error: "Total Debit and Credit must be equal (Accounts Mismatch)" }, { status: 400 });
    }

    return await prisma.$transaction(async (tx) => {
      
      // 2. GENERATE AUTOMATIC VOUCHER NO (Atomic Increment)
      const autoVocNo = await getNextNumber("VOC", tx);

      // 3. CREATE VOUCHER
      const voucher = await tx.voucher.create({
        data: {
          voucherNo: autoVocNo,
          date: new Date(header.date),
          vocType: header.vocType,
          group: header.group,
          remarks: header.remarks,
          partyId: header.partyId, // Include partyId
          totalAmount: new Prisma.Decimal(totalDr),
          items: {
            create: items.map((it: any) => ({
              ledgerId: it.ledgerId,
              debit: new Prisma.Decimal(it.debit || 0),
              credit: new Prisma.Decimal(it.credit || 0),
              narration: it.narration
            }))
          }
        }
      });

      // 4. SEND NOTIFICATION IF PARTY IS LINKED
      if (header.partyId) {
        await tx.clientNotification.create({
          data: {
            partyId: header.partyId,
            title: "Payment Update",
            message: `A new ${header.vocType} voucher for ₹${totalDr} has been recorded in your account.`,
            type: header.vocType === "Receipt" ? "SUCCESS" : "INFO",
          }
        });
      }

      return NextResponse.json(voucher, { status: 201 });
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Race condition protection
    });
  } catch (error: any) {
    console.error("VOUCHER_POST_ERR:", error);
    return NextResponse.json({ error: error.message || "Failed to save Voucher" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Naye UI Filters ko capture karna
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const vocType = searchParams.get("vocType");
    const mode = searchParams.get("mode"); // Mode actually maps to 'group' in DB
    const partyId = searchParams.get("partyId");

    // Dynamic Filter Object banana
    const whereClause: Prisma.VoucherWhereInput = {};

    // 1. Date Filter
    if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) whereClause.date.gte = new Date(fromDate);
      if (toDate) whereClause.date.lte = new Date(toDate);
    }

    // 2. Voucher Type Filter (Receipt, Payment, etc.)
    if (vocType && vocType !== "ALL") {
      whereClause.vocType = vocType;
    }

    // 3. Mode/Group Filter (Cash, Bank, etc.)
    if (mode && mode !== "ALL") {
      whereClause.group = mode;
    }

    // 4. Party Filter
    if (partyId && partyId !== "ALL") {
      whereClause.partyId = partyId;
    }

    const vouchers = await prisma.voucher.findMany({
      where: whereClause,
      include: { 
        items: { 
          include: { ledger: true } 
        } 
      },
      orderBy: { date: 'desc' } // Newest vouchers first
    });

    return NextResponse.json(vouchers);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 });
  }
}
