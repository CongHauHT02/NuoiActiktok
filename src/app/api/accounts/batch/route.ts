import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ids, status, groupId, tagId } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Vui lòng chọn ít nhất một tài khoản" }, { status: 400 });
    }

    let message = "";

    if (action === "CHANGE_STATUS") {
      if (!status) return NextResponse.json({ error: "Trạng thái mới không hợp lệ" }, { status: 400 });
      await prisma.tikTokAccount.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      message = `Đã cập nhật trạng thái ${ids.length} tài khoản thành "${status}"`;
    } else if (action === "CHANGE_GROUP") {
      await prisma.tikTokAccount.updateMany({
        where: { id: { in: ids } },
        data: { groupId: groupId || null },
      });
      message = `Đã chuyển ${ids.length} tài khoản sang nhóm mới`;
    } else if (action === "DELETE") {
      await prisma.tikTokAccount.deleteMany({
        where: { id: { in: ids } },
      });
      message = `Đã xóa vĩnh viễn ${ids.length} tài khoản`;
    } else {
      return NextResponse.json({ error: "Hành động hàng loạt không hợp lệ" }, { status: 400 });
    }

    await logActivity({
      action: `BATCH_${action}`,
      resourceType: "TikTokAccount",
      details: message,
    });

    return NextResponse.json({ message, count: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

