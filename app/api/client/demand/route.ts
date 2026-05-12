import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getNextNumber } from "@/lib/sequence-engine";

// 1. GET: Fetch existing demands for the party
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    const demands = await prisma.demand.findMany({
      where: { partyId: partyId },
      include: {
        items: {
          include: {
            lot: {
              include: {
                item: { select: { name: true } },
                unit: { select: { name: true } },
              }
            }
          }
        }
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: demands,
    });
  } catch (error: any) {
    console.error("Client Demand GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. POST: Create a new demand for the party
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partyId, date, items } = body;

    if (!partyId || !items || items.length === 0) {
      return NextResponse.json({ error: "Party ID and items are required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate automatic Demand No
      const autoDmdNo = await getNextNumber("DMD", tx);

      // Create Demand Header & Items
      const demand = await tx.demand.create({
        data: {
          demandNo: autoDmdNo,
          date: new Date(date || new Date()),
          partyId: partyId,
          status: "Pending",
          items: {
            create: items.map((it: any) => ({
              lotId: it.lotId,
              qty: it.qty
            }))
          }
        }
      });

      // Create Notification for the party
      await tx.clientNotification.create({
        data: {
          partyId,
          title: "Booking Submitted",
          message: `Your release request for ${items.length} items has been received and is pending approval.`,
          type: "SUCCESS",
        },
      });

      return demand;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    });

    return NextResponse.json({
      success: true,
      message: "Demand created successfully",
      data: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Client Demand POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create demand" }, { status: 500 });
  }
}
