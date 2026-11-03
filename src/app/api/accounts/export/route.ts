import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const groupId = searchParams.get("groupId");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (groupId && groupId !== "ALL") where.groupId = groupId;

    const accounts = await prisma.tikTokAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        group: { select: { name: true } },
      },
    });

    const headers = [
      "STT",
      "Username",
      "Tên hiển thị",
      "Email",
      "Nhóm",
      "Trạng thái",
      "Followers",
      "Likes",
      "Videos",
      "Quốc gia",
      "Ngày thêm",
    ];

    const rows = accounts.map((acc, idx) => [
      idx + 1,
      `@${acc.username}`,
      `"${acc.displayName.replace(/"/g, '""')}"`,
      acc.email || "",
      acc.group?.name || "Chưa phân nhóm",
      acc.status,
      acc.followersCount,
      acc.likesCount,
      acc.videosCount,
      acc.country,
      new Date(acc.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tiktok_accounts_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

