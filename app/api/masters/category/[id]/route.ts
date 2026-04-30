import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CategorySchema } from "@/lib/validations/category";

// 1. UPDATE Category (With Validation & Conflict Check)
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params; // Awaiting params for safety
    const body = await req.json();
    
    // Zod Validation (Schema checking)
    const validatedData = CategorySchema.parse(body);

    const updated = await prisma.category.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({ 
      message: "Category details updated successfully!", 
      data: updated 
    });

  } catch (error: any) {
    console.error("CATEGORY_UPDATE_ERR:", error);
    
    // Unique constraint handle karna (e.g. Code already exists)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Category Code pehle se maujood hai! Kripya dusra code chunein." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Update fail ho gaya: " + (error.message || "Unknown Error") 
    }, { status: 400 });
  }
}

// 2. DELETE Category (With Relationship Safety)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { id } = await params;

    // ✅ INTEGRITY CHECK: Check if any Items exist in this Category
    const itemCount = await prisma.item.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { 
          error: `Is Category ko delete nahi kiya ja sakta! Isme ${itemCount} Items linked hain. Pehle unhe delete ya re-assign karein.` 
        },
        { status: 400 }
      );
    }

    // Process deletion
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "Category successfully system se hata di gayi hai." 
    });

  } catch (error: any) {
    console.error("CATEGORY_DELETE_ERR:", error);
    
    // Prisma error codes handling
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Database Constraint Error: Ye category kahin aur use ho rahi hai." 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Server Error: Category delete nahi ho payi!" 
    }, { status: 500 });
  }
}