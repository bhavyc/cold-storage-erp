import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request, props: { params: Promise<{ lotId: string }> }) {
  const params = await props.params;
  const lot = await prisma.lot.findUnique({
    where: { id: params.lotId },
    include: { party: true, item: true, chamber: true }
  });
     


  if (!lot) return NextResponse.json({ error: "Lot not found" }, { status: 404 });

  // QR Code String Format: LotNo|Party|Item|Qty|Date
  const qrString = `${lot.lotNo}|${lot.party.tradeName}|${lot.item.name}|${lot.receivedQty}|${lot.arrivalDate.toISOString()}`;

  return NextResponse.json({
    ...lot,
    qrString
  });
}