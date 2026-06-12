import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { verifyRole } from "@/lib/auth-guard";

// 1. PATCH: Update existing TDS Rule
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const guard = await verifyRole(["ADMIN"]);
  if (guard.response) return guard.response as Response;

  const params = await props.params;
  try {
    const { id } = await params; // Next.js 15+ safety
    const body = await req.json();

    const updatedTds = await prisma.tDSMaster.update({
      where: { id },
      data: {
        section: body.section,
        description: body.description,
        panStatus: body.panStatus === "Yes",
        minThreshold: new Prisma.Decimal(body.minThreshold || 0),
        tdsPercentage: new Prisma.Decimal(body.tdsPercentage || 0),
        ledgerId: body.ledgerId || null,
      }
    });

    return NextResponse.json({ 
      message: "TDS Master updated!", 
      data: updatedTds 
    });

  } catch (error: any) {
    console.error("TDS_PATCH_ERR:", error);
    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 400 });
  }
}

// 2. DELETE: Remove TDS Rule
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const guard = await verifyRole(["ADMIN"]);
  if (guard.response) return guard.response as Response;

  const params = await props.params;
  try {
    const { id } = await params;

    await prisma.tDSMaster.delete({
      where: { id }
    });

    return NextResponse.json({ message: "TDS Rule deleted successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}