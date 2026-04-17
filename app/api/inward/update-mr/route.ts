import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: MRs ko search karo Slip No range ke hisab se
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fromSlip = searchParams.get("fromSlip");
    const toSlip = searchParams.get("toSlip");

    if (!fromSlip || !toSlip) {
      return NextResponse.json({ error: "Slip range bharna zaroori hai!" }, { status: 400 });
    }

    const mrRecords = await prisma.inwardEntry.findMany({
      where: {
        lot: {
          mrNo: {
            gte: fromSlip,
            lte: toSlip
          }
        }
      },
      include: {
        lot: {
          include: { party: true }
        }
      },
      orderBy: { mrDate: 'desc' }
    });

    return NextResponse.json(mrRecords);
  } catch (error) {
    return NextResponse.json({ error: "Records dhoondne mein galti hui!" }, { status: 500 });
  }
}

// 2. PATCH: Minor details update karo aur Lot table se sync karo
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, mrDate, billingType, truckNo, deliveryPerson, remarks } = body;

    const result = await prisma.$transaction(async (tx) => {
      // Update InwardEntry (Minor details)
      const updatedEntry = await tx.inwardEntry.update({
        where: { id },
        data: {
          mrDate: mrDate ? new Date(mrDate) : undefined,
          billingType,
          truckNo,
          deliveryPerson,
          remarks
        }
      });

      // AUTOMATION: Agar MR Date badli hai, toh Lot ki arrivalDate bhi badalni hogi (Rent ke liye)
      if (mrDate) {
        await tx.lot.update({
          where: { id: updatedEntry.lotId },
          data: { arrivalDate: new Date(mrDate) }
        });
      }

      return updatedEntry;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Update fail ho gaya!" }, { status: 400 });
  }
}