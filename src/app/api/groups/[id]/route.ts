import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, description, color } = body;

    const group = await prisma.accountGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    const updated = await prisma.accountGroup.update({
      where: { id },
      data: {
        name: name ? name.trim() : group.name,
        description: description !== undefined ? description : group.description,
        color: color || group.color,
      },
    });

    await logActivity({
      action: "UPDATE_GROUP",
      resourceType: "AccountGroup",
      resourceId: id,
      details: `Cập nhật thông tin nhóm "${updated.name}"`,
    });

    return NextResponse.json({ data: updated, message: "Cập nhật nhóm thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const group = await prisma.accountGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    // Set accounts group to null before deleting
    await prisma.tikTokAccount.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await prisma.accountGroup.delete({ where: { id } });

    await logActivity({
      action: "DELETE_GROUP",
      resourceType: "AccountGroup",
      resourceId: id,
      details: `Đã xóa nhóm tài khoản "${group.name}"`,
    });

    return NextResponse.json({ message: "Xóa nhóm thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

