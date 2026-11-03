import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const groups = await prisma.accountGroup.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { accounts: true } },
      },
    });

    const tags = await prisma.accountTag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { accounts: true } },
      },
    });

    return NextResponse.json({
      data: groups.map((g) => ({
        ...g,
        accountsCount: g._count.accounts,
      })),
      tags: tags.map((t) => ({
        ...t,
        accountsCount: t._count.accounts,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, color = "#4F8CFF" } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên nhóm là bắt buộc" }, { status: 400 });
    }

    const group = await prisma.accountGroup.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        color,
      },
    });

    await logActivity({
      action: "CREATE_GROUP",
      resourceType: "AccountGroup",
      resourceId: group.id,
      details: `Đã tạo nhóm tài khoản "${group.name}"`,
    });

    return NextResponse.json({ data: group, message: "Tạo nhóm thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

