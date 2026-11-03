import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, description, cronExpression, isEnabled, rateLimitPerMin, retryCount, timeoutSeconds } = body;

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      return NextResponse.json({ error: "Workflow không tồn tại" }, { status: 404 });
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : workflow.name,
        description: description !== undefined ? description : workflow.description,
        cronExpression: cronExpression !== undefined ? cronExpression : workflow.cronExpression,
        isEnabled: isEnabled !== undefined ? isEnabled : workflow.isEnabled,
        rateLimitPerMin: rateLimitPerMin !== undefined ? parseInt(rateLimitPerMin) : workflow.rateLimitPerMin,
        retryCount: retryCount !== undefined ? parseInt(retryCount) : workflow.retryCount,
        timeoutSeconds: timeoutSeconds !== undefined ? parseInt(timeoutSeconds) : workflow.timeoutSeconds,
      },
    });

    await logActivity({
      action: "UPDATE_WORKFLOW",
      resourceType: "Workflow",
      resourceId: id,
      details: `Cập nhật workflow "${updated.name}" (Kích hoạt: ${updated.isEnabled})`,
    });

    return NextResponse.json({ data: updated, message: "Cập nhật workflow thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      return NextResponse.json({ error: "Workflow không tồn tại" }, { status: 404 });
    }

    await prisma.workflow.delete({ where: { id } });

    await logActivity({
      action: "DELETE_WORKFLOW",
      resourceType: "Workflow",
      resourceId: id,
      details: `Đã xóa workflow "${workflow.name}"`,
    });

    return NextResponse.json({ message: "Xóa workflow thành công" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

