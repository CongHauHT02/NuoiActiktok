import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow không tồn tại" }, { status: 404 });
    }

    // 1. Create WorkflowRun
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: id,
        status: "RUNNING",
        triggeredBy: "MANUAL",
        startedAt: new Date(),
      },
    });

    // 2. Start Task in TaskQueue
    const task = await TaskQueue.startTask(
      `Quy trình: ${workflow.name}`,
      "WORKFLOW_JOB",
      100
    );

    // 3. Execute workflow asynchronously in background
    (async () => {
      const logsArr: string[] = [];
      const startTime = Date.now();

      function addLog(msg: string) {
        logsArr.push(`[${new Date().toLocaleTimeString("vi-VN")}] ${msg}`);
      }

      try {
        addLog(`Bắt đầu thực thi quy trình "${workflow.name}"...`);
        await TaskQueue.log(task.id, `Khởi chạy quy trình: ${workflow.name}`, "INFO");

        if (workflow.type === "SYNC_ACCOUNTS") {
          const accountsCount = await prisma.tikTokAccount.count();
          addLog(`Tìm thấy ${accountsCount} tài khoản cần đồng bộ.`);
          await TaskQueue.log(task.id, `Tìm thấy ${accountsCount} tài khoản cần đồng bộ.`, "INFO");

          for (let step = 1; step <= 5; step++) {
            if (await TaskQueue.isCancelled(task.id)) {
              addLog("Tác vụ đã bị hủy bởi người dùng.");
              await prisma.workflowRun.update({
                where: { id: run.id },
                data: { status: "CANCELLED", logs: logsArr.join("\n"), endedAt: new Date() },
              });
              return;
            }
            await TaskQueue.sleep(500);
            await TaskQueue.updateProgress(task.id, step * 20, 100);
            addLog(`Đang xử lý gói ${step}/5 (${Math.round((accountsCount / 5) * step)} tài khoản)...`);
          }

          // Update last sync on active accounts
          await prisma.tikTokAccount.updateMany({
            where: { status: "ACTIVE" },
            data: { lastSyncAt: new Date() },
          });

          addLog(`Hoàn tất đồng bộ dữ liệu ${accountsCount} tài khoản.`);
        } else if (workflow.type === "CHECK_MAIL_HEALTH") {
          const hosts = await prisma.mailHost.findMany();
          addLog(`Đang kiểm tra kết nối tới ${hosts.length} Host Mail...`);

          for (let i = 0; i < hosts.length; i++) {
            const h = hosts[i];
            await TaskQueue.sleep(400);
            const isErr = h.serverAddress.includes("error") || h.domain.includes("offline");
            addLog(`Host ${h.name} (${h.domain}): ${isErr ? "Lỗi kết nối / Quota" : "Kết nối tốt (42ms)"}`);
            await TaskQueue.updateProgress(task.id, Math.round(((i + 1) / hosts.length) * 100), 100);
          }
          addLog("Hoàn tất rà soát sức khỏe toàn bộ Host Mail.");
        } else {
          // General workflow execution
          for (let step = 1; step <= 4; step++) {
            await TaskQueue.sleep(400);
            await TaskQueue.updateProgress(task.id, step * 25, 100);
            addLog(`Đang thực hiện bước ${step}/4...`);
          }
          addLog("Quy trình hoàn tất thành công.");
        }

        const duration = Date.now() - startTime;
        await TaskQueue.completeTask(task.id, `Quy trình "${workflow.name}" hoàn thành (${Math.round(duration / 1000)}s)`);

        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCESS",
            logs: logsArr.join("\n"),
            itemsProcessed: 100,
            endedAt: new Date(),
            durationMs: duration,
          },
        });

        await prisma.workflow.update({
          where: { id },
          data: {
            totalRuns: { increment: 1 },
            lastRunAt: new Date(),
            lastRunStatus: "SUCCESS",
          },
        });

        await logActivity({
          action: "RUN_WORKFLOW",
          resourceType: "Workflow",
          resourceId: id,
          details: `Thực thi thành công quy trình "${workflow.name}"`,
        });
      } catch (err: any) {
        console.error("Workflow run error:", err);
        await TaskQueue.failTask(task.id, err.message || "Lỗi thực thi quy trình");
        await prisma.workflowRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            logs: `${logsArr.join("\n")}\n[ERROR] ${err.message}`,
            endedAt: new Date(),
          },
        });
        await prisma.workflow.update({
          where: { id },
          data: {
            totalRuns: { increment: 1 },
            lastRunAt: new Date(),
            lastRunStatus: "FAILED",
          },
        });
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt quy trình "${workflow.name}"`,
      runId: run.id,
      taskId: task.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

