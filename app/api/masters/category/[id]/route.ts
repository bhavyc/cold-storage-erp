import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategorySchema } from "@/lib/validations/category";

// 1. UPDATE Category
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const validatedData = CategorySchema.parse(body);

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: validatedData
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
 

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // Check karo ki is category mein koi Item toh nahi hai?
    // Agar Item hai, toh delete block kar dena chahiye taaki data kharab na ho.
    const itemCount = await prisma.item.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { error: "Bhai, is Category mein Items hain! Pehle unhe delete karo ya move karo." },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: "Category delete ho gayi!" });
  } catch (error) {
    console.error("DELETE_ERR", error);
    return NextResponse.json({ error: "Server error: Uda nahi paye!" }, { status: 500 });
  }
}