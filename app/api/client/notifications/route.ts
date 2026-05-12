import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partyId = searchParams.get("partyId");

    if (!partyId) {
      return NextResponse.json({ error: "Party ID is required" }, { status: 400 });
    }

    const notifications = await prisma.clientNotification.findMany({
      where: { partyId: partyId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.clientNotification.count({
      where: { partyId: partyId, isRead: false },
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { notificationId, partyId } = await request.json();

    if (notificationId) {
      // Mark specific notification as read
      await prisma.clientNotification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    } else if (partyId) {
      // Mark all for party as read
      await prisma.clientNotification.updateMany({
        where: { partyId: partyId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Notification Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
