import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ 
      orderBy: { code: 'asc' } 
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Automation: Check if updating or creating
    if (body.id) {
      const updated = await prisma.category.update({
        where: { id: body.id },
        data: {
          name: body.name,
          minLot: body.minLot ? parseInt(body.minLot) : null,
          maxLot: body.maxLot ? parseInt(body.maxLot) : null,
          minMrGpNo: body.minMrGpNo ? parseInt(body.minMrGpNo) : null,
          maxMrGpNo: body.maxMrGpNo ? parseInt(body.maxMrGpNo) : null,
        }
      });
      return NextResponse.json(updated);
    }

    const category = await prisma.category.create({
      data: {
        code: body.code,
        name: body.name,
        minLot: body.minLot ? parseInt(body.minLot) : null,
        maxLot: body.maxLot ? parseInt(body.maxLot) : null,
        minMrGpNo: body.minMrGpNo ? parseInt(body.minMrGpNo) : null,
        maxMrGpNo: body.maxMrGpNo ? parseInt(body.maxMrGpNo) : null,
      }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 400 });
  }
}