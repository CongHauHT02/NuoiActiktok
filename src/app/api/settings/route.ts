import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ data: settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { settings } = body; // Array of { key, value }

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Cấu hình không hợp lệ" }, { status: 400 });
    }

    for (const item of settings) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value.toString() },
        create: {
          key: item.key,
          value: item.value.toString(),
          description: item.description || null,
        },
      });
    }

    await logActivity({
      action: "UPDATE_SETTINGS",
      resourceType: "SystemSetting",
      details: "Đã cập nhật các thông số cài đặt hệ thống",
    });

    return NextResponse.json({ message: "Cập nhật cài đặt thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

