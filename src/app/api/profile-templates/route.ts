import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await prisma.profileTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { profiles: true } },
      },
    });
    return NextResponse.json({ data: templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, bioSample, country, language, avatarUrl } = body;

    if (!name || !bioSample) {
      return NextResponse.json({ error: "Tên mẫu và Bio mẫu là bắt buộc" }, { status: 400 });
    }

    const template = await prisma.profileTemplate.create({
      data: {
        name,
        category: category || "Creator",
        bioSample,
        country: country || "VN",
        language: language || "vi",
        avatarUrl,
      },
    });

    return NextResponse.json({ data: template, message: "Tạo mẫu hồ sơ thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

