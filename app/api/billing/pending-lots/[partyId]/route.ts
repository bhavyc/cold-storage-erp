import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, props: { params: Promise<{ partyId: string }> }) {
  const params = await props.params;
  try {
    const lots = await prisma.lot.findMany({
      where: {
        partyId: params.partyId,
        balanceQty: 0,
      },
      include: {
        item: true,
        unit: true,
        outwardEntries: true
      },
      orderBy: { arrivalDate: "asc" }
    });

    return NextResponse.json(lots);
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: Request, { params }: { params: { partyId: string } }) {
//   try {
//     const lots = await prisma.lot.findMany({
//       where: {
//         partyId: params.partyId,
//         balanceQty: 0, // Nill Lot Logic
//         // Logic: Agar uptoDate null hai ya arrivalDate se chota hai
//         OR: [
//           { uptoDate: null },
//           { uptoDate: { lt: prisma.lot.fields.arrivalDate } }
//         ]
//       },
//       include: {
//         item: true,
//         unit: true,
//         outwardEntries: true
//       }
//     });
//     return NextResponse.json(lots);
//   } catch (error) {
//     return NextResponse.json({ error: "Failed to fetch pending lots" }, { status: 500 });
//   }
// }