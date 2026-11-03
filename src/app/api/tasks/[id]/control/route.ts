import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { action } = body; // PAUSE, RESUME, CANCEL, RETRY

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Tác vụ không tồn tại" }, { status: 404 });
    }

    if (action === "PAUSE") {
      TaskQueue.pause(id);
      await prisma.task.update({ where: { id }, data: { status: "PAUSED" } });
      await TaskQueue.log(id, "Tác vụ đã tạm dừng bởi người dùng", "WARN");
      return NextResponse.json({ message: "Đã tạm dừng tác vụ" });
    }

    if (action === "RESUME") {
      TaskQueue.resume(id);
      await prisma.task.update({ where: { id }, data: { status: "RUNNING" } });
      await TaskQueue.log(id, "Tác vụ đã được tiếp tục thực thi", "INFO");
      return NextResponse.json({ message: "Đã tiếp tục tác vụ" });
    }

    if (action === "CANCEL") {
      TaskQueue.cancel(id);
      await prisma.task.update({ where: { id }, data: { status: "CANCELLED" } });
      await TaskQueue.log(id, "Tác vụ đã bị hủy bỏ", "WARN");
      return NextResponse.json({ message: "Đã hủy tác vụ" });
    }

    if (action === "RETRY") {
      await prisma.task.update({
        where: { id },
        data: {
          status: "RUNNING",
          progressPercent: 0,
          processedItems: 0,
          errorDetail: null,
          startedAt: new Date(),
          completedAt: null,
        },
      });
      await TaskQueue.log(id, "Khởi động lại tác vụ...", "INFO");

      // Simulate execution in background
      (async () => {
        for (let i = 1; i <= 5; i++) {
          await TaskQueue.sleep(400);
          await TaskQueue.updateProgress(id, i * 20, 100);
          await TaskQueue.log(id, `Đang xử lý gói ${i}/5...`, "INFO");
        }
        await TaskQueue.completeTask(id, "Đã hoàn thành tác vụ sau khi thử lại");
      })();

      return NextResponse.json({ message: "Đang chạy lại tác vụ" });
    }

    return NextResponse.json({ error: "Hành động điều khiển không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

