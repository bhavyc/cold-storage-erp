import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Current Year ka data nikalne ke liye
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear}-04-01`); // Financial Year start
    const endDate = new Date(`${currentYear + 1}-03-31`);

    // 1. Database se live Arrivals (MR) uthao
    const arrivals = await prisma.lot.findMany({
      where: { arrivalDate: { gte: startDate, lte: endDate } },
      select: { arrivalDate: true, receivedQty: true }
    });

    // 2. Database se live Dispatches (GP) uthao
    const dispatches = await prisma.outwardEntry.findMany({
      where: { gpDate: { gte: startDate, lte: endDate } },
      select: { gpDate: true, qty: true }
    });

    // 3. Mahine ke hisab se data ko group karne ka function
    const monthNames = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    
    const formattedData = monthNames.map(month => {
      // Us mahine ka Arrival total
      const arrivalTotal = arrivals
        .filter(a => new Intl.DateTimeFormat('en', { month: 'short' }).format(a.arrivalDate) === month)
        .reduce((sum, item) => sum + item.receivedQty, 0);

      // Us mahine ka Dispatch total
      const dispatchTotal = dispatches
        .filter(d => new Intl.DateTimeFormat('en', { month: 'short' }).format(d.gpDate) === month)
        .reduce((sum, item) => sum + item.qty, 0);

      return {
        name: month,
        arrival: arrivalTotal,
        dispatch: dispatchTotal
      };
    });

    return NextResponse.json(formattedData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch live stock data" }, { status: 500 });
  }
}
