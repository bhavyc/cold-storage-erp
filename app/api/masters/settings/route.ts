import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: Saari saved settings aur available ledgers nikalne ke liye
export async function GET() {
  try {
    const [settings, ledgers] = await Promise.all([
      prisma.systemSettings.findMany(),
      prisma.ledger.findMany({ select: { id: true, name: true, code: true } })
    ]);

    return NextResponse.json({ settings, ledgers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// 2. POST: Settings ko save ya update karne ke liye
export async function POST(req: Request) {
  try {
    const body = await req.json(); // Expected format: { key: string, value: string }
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "Key and Value are required" }, { status: 400 });
    }

    // Upsert logic: Agar key pehle se hai toh update, warna create
    const updatedSetting = await prisma.systemSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ 
      message: `Setting ${key} updated successfully!`, 
      data: updatedSetting 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}