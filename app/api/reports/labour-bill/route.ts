import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";

export async function GET(req: Request) {
  try {
    const guard = await verifyRole(["ADMIN"], req);
    if (guard.response) return guard.response as Response;

    const { searchParams } = new URL(req.url);
    const fromDateStr = searchParams.get("fromDate");
    const toDateStr = searchParams.get("toDate");

    if (!fromDateStr || !toDateStr) {
      return NextResponse.json({ error: "fromDate and toDate are required" }, { status: 400 });
    }

    const fromDate = new Date(fromDateStr);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(toDateStr);
    toDate.setHours(23, 59, 59, 999);

    // 1. Fetch Inward entries (Lots) created in date range
    const lots = await prisma.lot.findMany({
      where: {
        arrivalDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        item: true,
        unit: true,
      },
    });

    // 2. Fetch Outward entries created in date range
    const outwardEntries = await prisma.outwardEntry.findMany({
      where: {
        gpDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        lot: {
          include: {
            item: true,
            unit: true,
          },
        },
      },
    });

    // 3. Fetch Item Configurations to look up custom labour rates
    const itemConfigs = await prisma.itemUnitConfig.findMany();

    // Map configuration rates by `${itemId}_${unitId}` for fast lookup
    const rateMap = new Map<string, number>();
    itemConfigs.forEach((config) => {
      rateMap.set(`${config.itemId}_${config.unitId}`, Number(config.labourRate));
    });

    // Aggregated structure map
    const aggregation = new Map<
      string,
      {
        itemName: string;
        packing: string;
        inQty: number;
        outQty: number;
        rate: number;
      }
    >();

    // Helper to get or create entry in the map
    const getOrCreateEntry = (itemId: string, unitId: string, item: any, unit: any) => {
      const key = `${itemId}_${unitId}`;
      if (!aggregation.has(key)) {
        // Find rate: check config first, fallback to unit contractor rate
        let rate = rateMap.get(key) || 0;
        if (rate === 0) {
          rate = Number(unit.rateToContractorIn) || 0;
        }

        aggregation.set(key, {
          itemName: item.name,
          packing: unit.name,
          inQty: 0,
          outQty: 0,
          rate: rate,
        });
      }
      return aggregation.get(key)!;
    };

    // Process Inwards (IN)
    lots.forEach((lot) => {
      const entry = getOrCreateEntry(lot.itemId, lot.unitId, lot.item, lot.unit);
      entry.inQty += lot.receivedQty;
    });

    // Process Outwards (OUT)
    outwardEntries.forEach((outEntry) => {
      if (outEntry.lot) {
        const entry = getOrCreateEntry(
          outEntry.lot.itemId,
          outEntry.lot.unitId,
          outEntry.lot.item,
          outEntry.lot.unit
        );
        entry.outQty += outEntry.qty;
      }
    });

    // Format list, calculate totals & line amounts
    const resultList = Array.from(aggregation.values())
      .map((row) => {
        const total = row.inQty + row.outQty;
        const amount = total * row.rate;
        return {
          itemName: row.itemName,
          packing: row.packing,
          inQty: row.inQty,
          outQty: row.outQty,
          total: total,
          rate: row.rate,
          amount: Number(amount.toFixed(2)),
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => a.itemName.localeCompare(b.itemName));

    return NextResponse.json(resultList);
  } catch (error: any) {
    console.error("GET_LABOUR_BILL_ERR:", error);
    return NextResponse.json({ error: "Failed to generate labour bill data" }, { status: 500 });
  }
}
