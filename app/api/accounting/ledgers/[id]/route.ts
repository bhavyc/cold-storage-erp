import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;

    const ledger = await prisma.ledger.findUnique({
      where: { id: id },
      include: { group: true }
    });

    if (!ledger) {
      return NextResponse.json({ error: "Ledger not found" }, { status: 404 });
    }

    return NextResponse.json(ledger);
  } catch (error: any) {
    console.error("GET Ledger Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;
    const body = await request.json();

    const updatedLedger = await prisma.ledger.update({
      where: { id: id },
      data: {
        code: body.code,
        name: body.name,
        groupId: body.groupId,
        openingBalance: new Prisma.Decimal(body.openingAmt ?? 0),
        openingMode: body.openingMode,
        maxCredit: new Prisma.Decimal(body.maxAllowedCredit ?? 0),
      }
    });

    return NextResponse.json(updatedLedger);
  } catch (error: any) {
    console.error("PATCH Ledger Error:", error);
    return NextResponse.json({ error: "Failed to update ledger" }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { id } = params;

    await prisma.ledger.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Ledger Error:", error);
    return NextResponse.json({ error: "Failed to delete ledger" }, { status: 400 });
  }
}
