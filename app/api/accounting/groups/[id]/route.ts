import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const body = await req.json();
    const group = await prisma.accountGroup.update({
      where: { id: params.id },
      data: {
        code: body.code,
        name: body.name,
        reportType: body.reportType,
        groupType: body.groupType
      }
    });
    return NextResponse.json(group);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Check if group has ledgers
    const ledgerCount = await prisma.ledger.count({
      where: { groupId: params.id }
    });

    if (ledgerCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete group. It has ${ledgerCount} ledgers attached.` },
        { status: 400 }
      );
    }

    await prisma.accountGroup.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Group deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
