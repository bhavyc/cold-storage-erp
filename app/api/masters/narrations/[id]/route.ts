import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";

// 1. PATCH: Update existing Narration Record
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const guard = await verifyRole(["ADMIN"]);
  if (guard.response) return guard.response as Response;

  const params = await props.params;
  try {
    const { id } = await params; // Next.js 15+ safety
    const body = await req.json();

    const updatedNarration = await prisma.narrationMaster.update({
      where: { id },
      data: {
        code: body.code,
        group: body.group,
        vocType: body.vocType,
        description: body.description,
      }
    });

    return NextResponse.json({ 
      message: "Narration updated successfully!", 
      data: updatedNarration 
    });

  } catch (error: any) {
    console.error("NARRATION_PATCH_ERR:", error);

    // Agar code duplicate ho jaye (Unique Constraint)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Ye Narration Code pehle se maujood hai!" 
      }, { status: 400 });
    }

    return NextResponse.json({ error: "Update failed: " + error.message }, { status: 400 });
  }
}

// 2. DELETE: Remove Narration from system
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const guard = await verifyRole(["ADMIN"]);
  if (guard.response) return guard.response as Response;

  const params = await props.params;
  try {
    const { id } = await params;

    await prisma.narrationMaster.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: "Narration record deleted successfully" 
    });

  } catch (error: any) {
    console.error("NARRATION_DELETE_ERR:", error);
    
    return NextResponse.json({ 
      error: "Bhai, record uda nahi paye! Shayad server issue hai." 
    }, { status: 500 });
  }
}