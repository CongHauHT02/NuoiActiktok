import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        runs: {
          take: 5,
          orderBy: { startedAt: "desc" },
        },
        _count: { select: { runs: true } },
      },
    });

    return NextResponse.json({ data: workflows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      type = "SYNC_ACCOUNTS",
      cronExpression = "0 */6 * * *",
      isEnabled = true,
      rateLimitPerMin = 60,
      retryCount = 3,
      timeoutSeconds = 300,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Tên quy trình tự động là bắt buộc" }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        type,
        cronExpression,
        isEnabled,
        rateLimitPerMin: parseInt(rateLimitPerMin) || 60,
        retryCount: parseInt(retryCount) || 3,
        timeoutSeconds: parseInt(timeoutSeconds) || 300,
      },
    });

    await logActivity({
      action: "CREATE_WORKFLOW",
      resourceType: "Workflow",
      resourceId: workflow.id,
      details: `Đã tạo workflow tự động "${workflow.name}"`,
    });

    return NextResponse.json({ data: workflow, message: "Tạo workflow thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

