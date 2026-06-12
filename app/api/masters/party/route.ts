import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRole } from "@/lib/auth-guard";

export async function GET() {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER", "OPERATOR", "GATEKEEPER"]);
    if (guard.response) return guard.response as Response;

    const parties = await prisma.party.findMany({
      orderBy: { partyCode: 'asc' },
      include: { _count: { select: { lots: true } } }
    });
    return NextResponse.json(parties);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch parties" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"]);
    if (guard.response) return guard.response as Response;

    const body = await req.json();

    const partyData = {
      partyCode: body.partyCode,
      tradeName: body.tradeName,
      type: body.type || "Sundry Debtors",
      proprietor: body.proprietor,
      address: body.address,
      pincode: body.pincode,
      contactPerson: body.contactPerson,
      designation: body.designation,
      email: body.email,
     mobiles: Array.isArray(body.mobiles) 
    ? body.mobiles.filter((m: any) => typeof m === 'string' && m.trim() !== "") 
    : [],
      gstType: body.gstType,
      stateName: body.stateName,
      stateCode: body.stateCode,
      panNo: body.panNo,
      gstNo: body.gstNo,
      bankName: body.bankName,
      branch: body.branch,
      accountNo: body.accountNo,
      ifsc: body.ifsc,
      holderName: body.holderName,
      // 16 Billing Strategy Flags
      billNilLot: body.billNilLot || false,
      billMonthly: body.billMonthly || false,
      billTransport: body.billTransport || false,
      billSpace: body.billSpace || false,
      billBalance: body.billBalance || false,
      billItemDay: body.billItemDay || false,
      billFixed: body.billFixed || false,
      billCyclic: body.billCyclic || false,
      billDispatch: body.billDispatch || false,
      billItem: body.billItem || false,
      billGeneral: body.billGeneral || false,
      billWeekly: body.billWeekly || false,
      billUntouched: body.billUntouched || false,
      billLabour: body.billLabour || false,
      billCA: body.billCA || false,
      billSlip: body.billSlip || false,
      graceDays: parseInt(body.graceDays || 0),

      paymentPreference: body.paymentPreference || "Credit",
  
      maxAllowedCredit: new Prisma.Decimal(body.maxAllowedCredit || 0),
      openingBalance: new Prisma.Decimal(body.openingAmt || 0), // Base opening balance
      openingMode: body.openingMode || "Debit",
      aadharNo: body.aadharNo,
    };

    // --- CASE 1: UPDATE EXISTING PARTY ---
    if (body.id) {
      const result = await prisma.$transaction(async (tx) => {
        // 0. Get Old Record to find existing Ledger
        const oldParty = await tx.party.findUnique({ where: { id: body.id } });
        const oldLedgerCode = `ACC-${oldParty?.partyCode}`;

        // 1. Update Party
        const updatedParty = await tx.party.update({
          where: { id: body.id },
          data: partyData
        });

        // 2. Sync Ledger (Update Code + Name + Opening Balance)
        await tx.ledger.updateMany({
          where: { code: oldLedgerCode },
          data: { 
            code: `ACC-${updatedParty.partyCode}`,
            name: updatedParty.tradeName,
            openingBalance: updatedParty.openingBalance,
            openingMode: updatedParty.openingMode,
            maxCredit: updatedParty.maxAllowedCredit
          }
        });

        return updatedParty;
      });
      return NextResponse.json(result);
    } 
    
    // --- CASE 2: CREATE NEW PARTY & AUTO-LEDGER ---
    else {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Party Record
        const createdParty = await tx.party.create({
          data: partyData
        });

        // 2. Find "Sundry Debtors" Group (If not exists, create it)
        let group = await tx.accountGroup.findFirst({
          where: { name: { contains: "Sundry Debtors", mode: 'insensitive' } }
        });

        if (!group) {
          group = await tx.accountGroup.create({
            data: {
              code: "G01",
              name: "SUNDRY DEBTORS (PARTIES)",
              reportType: "Balance Sheet",
              groupType: "Asset"
            }
          });
        }

        // 3. Automatically Create Accounting Ledger for this Party
        await tx.ledger.create({
          data: {
            code: `ACC-${createdParty.partyCode}`,
            name: createdParty.tradeName,
            groupId: group.id,
            openingBalance: createdParty.openingBalance,
            openingMode: createdParty.openingMode,
            maxCredit: createdParty.maxAllowedCredit
          }
        });

        return createdParty;
      });

      return NextResponse.json(result, { status: 201 });
    }
  } catch (error: any) {
    console.error("PARTY_SAVE_ERR", error);
    // Unique constraint error handling (e.g. Party Code already exists)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Party Code ya Ledger Code pehle se maujood hai!" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to save party data" }, { status: 400 });
  }
}
