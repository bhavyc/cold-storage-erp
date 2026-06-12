import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRole } from "@/lib/auth-guard";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;
       
    const { id } = await params;
    const body = await req.json();
    const { name, role, status, password } = body;
       
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
           
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });
      
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, status: updatedUser.status },
    });
  } catch (error: any) {
    console.error("PATCH_USER_ERR:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}



export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const guard = await verifyRole(["ADMIN"]);
    if (guard.response) return guard.response as Response;

    const { id } = await params;

    // Optional: prevent admin from deleting themselves
    // In next-auth session we can get current user, but to keep it simple, just delete.
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE_USER_ERR:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
