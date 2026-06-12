import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await verifyRole(["ADMIN", "MANAGER"], req);
    if (guard.response) return guard.response as Response;

    const { id: partyId } = await props.params;

    const party = await prisma.party.findUnique({ where: { id: partyId } });
    if (!party) {
      return NextResponse.json({ error: "Merchant record not found" }, { status: 404 });
    }

    // Check dependencies (relational integrity checks)
    const [lotCount, invoiceCount, voucherCount, demandCount] = await Promise.all([
      prisma.lot.count({ where: { partyId } }),
      prisma.invoice.count({ where: { partyId } }),
      prisma.voucher.count({ where: { partyId } }),
      prisma.demand.count({ where: { partyId } }),
    ]);

    if (lotCount > 0 || invoiceCount > 0 || voucherCount > 0 || demandCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete: This merchant has active transactions (lots, invoices, vouchers, or demands) linked to their account." },
        { status: 400 }
      );
    }

    // Check ledger entries
    const ledgerCode = `ACC-${party.partyCode}`;
    const ledger = await prisma.ledger.findUnique({ where: { code: ledgerCode } });

    if (ledger) {
      const voucherItemCount = await prisma.voucherItem.count({ where: { ledgerId: ledger.id } });
      if (voucherItemCount > 0) {
        return NextResponse.json(
          { error: "Cannot delete: This merchant's ledger has accounting voucher entries. Clean those entries first." },
          { status: 400 }
        );
      }
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Clean special rates
      await tx.partyItemRate.deleteMany({ where: { partyId } });
      
      // Clean notifications
      await tx.clientNotification.deleteMany({ where: { partyId } });

      // Clean ledger associations (TDSMaster)
      if (ledger) {
        await tx.tDSMaster.updateMany({
          where: { ledgerId: ledger.id },
          data: { ledgerId: null },
        });
        await tx.ledger.delete({ where: { id: ledger.id } });
      }

      // Delete party
      await tx.party.delete({ where: { id: partyId } });
    });

    return NextResponse.json({ message: "Merchant deleted successfully" });
  } catch (error: any) {
    console.error("PARTY_DELETE_ERR:", error);
    return NextResponse.json({ error: "Failed to delete merchant" }, { status: 500 });
  }
}
