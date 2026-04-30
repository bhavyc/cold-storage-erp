import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  try {
    const [mrCount, gpCount, totalBal, billCount] = await Promise.all([
      prisma.lot.count({ where: { arrivalDate: { gte: startOfDay } } }),
      prisma.outwardEntry.count({ where: { gpDate: { gte: startOfDay } } }),
      prisma.lot.aggregate({ _sum: { balanceQty: true } }),
      prisma.invoice.count({ where: { date: { gte: startOfDay } } })
    ]);

    return NextResponse.json({
      mrCount,
      gpCount,
      totalBal: totalBal._sum.balanceQty || 0,
      billCount,
      lastMrDate: "24-03-2026", // Mock, can fetch latest MR
      lastGpDate: "24-03-2026"
    });
  } catch (error) {
    return NextResponse.json({ error: "Summary Fetch Failed" }, { status: 500 });
  }
}
