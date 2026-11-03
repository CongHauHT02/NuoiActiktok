import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        logs: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tác vụ không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

