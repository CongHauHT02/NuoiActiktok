import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get("hostId");
    const category = searchParams.get("category");
    const search = searchParams.get("q");
    const isReadParam = searchParams.get("isRead");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {};
    if (hostId && hostId !== "ALL") where.mailHostId = hostId;
    if (category && category !== "ALL") where.category = category;
    if (isReadParam !== null && isReadParam !== undefined && isReadParam !== "") {
      where.isRead = isReadParam === "true";
    }

    if (search) {
      where.OR = [
        { subject: { contains: search } },
        { sender: { contains: search } },
        { recipient: { contains: search } },
        { bodyText: { contains: search } },
        { verificationCode: { contains: search } },
      ];
    }

    const [total, messages, mailHosts] = await Promise.all([
      prisma.emailMessage.count({ where }),
      prisma.emailMessage.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          mailHost: {
            select: { id: true, name: true, domain: true },
          },
        },
      }),
      prisma.mailHost.findMany({
        select: {
          id: true,
          name: true,
          domain: true,
          _count: { select: { emailMessages: true } },
        },
      }),
    ]);

    return NextResponse.json({
      data: messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      hosts: mailHosts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

