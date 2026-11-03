import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";
import { executeAutoRegisterTikTokAccount, generateRandomUsername } from "@/lib/autoRegWorker";
import { MailTmService } from "@/lib/mailTmService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = "free_cloud", // "free_cloud" | "domain" | "paste"
      emails = [],          // array of email strings
      domain,              // custom domain
      count = 1,
      delaySeconds = 10,
    } = body;

    const requestedCount = Math.min(Math.max(1, parseInt(count) || 1), 20);
    let targetTasks: Array<{ email?: string; isFreeCloud: boolean }> = [];

    if (mode === "free_cloud") {
      for (let i = 0; i < requestedCount; i++) {
        targetTasks.push({ isFreeCloud: true });
      }
    } else if (Array.isArray(emails) && emails.length > 0) {
      const valid = emails.map((e) => e.trim()).filter((e) => e.includes("@"));
      targetTasks = valid.map((e) => ({ email: e, isFreeCloud: false }));
    } else if (domain) {
      const cleanDomain = domain.replace(/^@/, "").trim();
      for (let i = 0; i < requestedCount; i++) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        targetTasks.push({ email: `tt_${randomStr}@${cleanDomain}`, isFreeCloud: false });
      }
    }

    if (targetTasks.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn chế độ tạo tài khoản hợp lệ" },
        { status: 400 }
      );
    }

    const totalSteps = targetTasks.length;
    const task = await TaskQueue.startTask(
      `Đăng ký ${totalSteps} tài khoản TikTok thật (Auto-Reg Bán tự động)`,
      "TIKTOK_ACCOUNT_REGISTRATION",
      totalSteps
    );

    // Run execution in background
    (async () => {
      try {
        await TaskQueue.log(
          task.id,
          `Khởi động quy trình Auto-Reg (${mode === "free_cloud" ? "Cloud Mail Miễn Phí" : "Email tùy chọn"}) cho ${totalSteps} tài khoản. Giãn cách: ${delaySeconds}s...`,
          "INFO"
        );

        let successCount = 0;

        for (let i = 0; i < targetTasks.length; i++) {
          if (await TaskQueue.isCancelled(task.id)) {
            await TaskQueue.log(task.id, "Tiến trình Auto-Reg đã bị hủy bởi người dùng", "WARN");
            return;
          }

          while (await TaskQueue.isPaused(task.id)) {
            await TaskQueue.sleep(1000);
          }

          const currentTask = targetTasks[i];
          let emailToUse = currentTask.email || "";
          let mailTmAccount: any = null;

          // If Free Cloud mode, create a fresh Mail.tm mailbox on clean domain
          if (currentTask.isFreeCloud) {
            await TaskQueue.log(
              task.id,
              `[${i + 1}/${totalSteps}] Đang khởi tạo hộp thư Cloud Mail miễn phí (được TikTok chấp nhận)...`,
              "INFO"
            );
            try {
              mailTmAccount = await MailTmService.createTempMailbox();
              emailToUse = mailTmAccount.email;
              await TaskQueue.log(
                task.id,
                `[${i + 1}/${totalSteps}] Đã tạo hộp thư thành công: ${emailToUse}`,
                "SUCCESS"
              );
            } catch (err: any) {
              await TaskQueue.log(task.id, `Lỗi tạo hộp thư Cloud Mail: ${err.message}`, "ERROR");
              continue;
            }
          }

          const startTime = new Date(Date.now() - 10000);

          await TaskQueue.log(
            task.id,
            `[${i + 1}/${totalSteps}] Bắt đầu mở trình duyệt đăng ký cho Email: ${emailToUse}...`,
            "INFO"
          );

          // Function to poll OTP
          const fetchOtp = async (targetEmail: string, timeoutSec = 60): Promise<string | null> => {
            // A. If Mail.tm account, poll via Mail.tm API
            if (mailTmAccount) {
              return await MailTmService.waitForTikTokOtp(
                mailTmAccount.token,
                timeoutSec,
                async (msg) => {
                  await TaskQueue.log(task.id, msg, "INFO");
                }
              );
            }

            // B. If custom Host Mail, poll from database
            const pollInterval = 3000;
            const maxAttempts = Math.ceil((timeoutSec * 1000) / pollInterval);

            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              await new Promise((r) => setTimeout(r, pollInterval));

              const msg = await prisma.emailMessage.findFirst({
                where: {
                  recipient: { contains: targetEmail.toLowerCase() },
                  receivedAt: { gte: startTime },
                },
                orderBy: { receivedAt: "desc" },
              });

              if (msg) {
                if (msg.verificationCode) return msg.verificationCode;
                const match = (msg.bodyText || msg.bodyHtml || msg.subject).match(/\b(\d{6})\b/);
                if (match) return match[1];
              }
            }
            return null;
          };

          const result = await executeAutoRegisterTikTokAccount({
            email: emailToUse,
            onLog: async (message, level) => {
              await TaskQueue.log(task.id, message, level);
            },
            fetchOtpFromEmail: fetchOtp,
          });

          if (result.success) {
            successCount++;
            await TaskQueue.log(
              task.id,
              `[${i + 1}/${totalSteps}] 🎉 Đăng ký THÀNH CÔNG tài khoản @${result.username} (${emailToUse})!`,
              "SUCCESS"
            );
          } else {
            await TaskQueue.log(
              task.id,
              `[${i + 1}/${totalSteps}] Đăng ký thất bại cho ${emailToUse}: ${result.errorMessage || "Không xác định"}`,
              "ERROR"
            );
          }

          await TaskQueue.updateProgress(task.id, i + 1, totalSteps);

          if (i < targetTasks.length - 1) {
            await TaskQueue.log(
              task.id,
              `Nghỉ giãn cách an toàn ${delaySeconds}s trước khi đăng ký tài khoản tiếp theo...`,
              "INFO"
            );
            await TaskQueue.sleep(Math.min(delaySeconds * 1000, 60000));
          }
        }

        await TaskQueue.completeTask(
          task.id,
          `Hoàn tất tiến trình đăng ký: Thành công ${successCount}/${totalSteps} tài khoản thật!`
        );

        await logActivity({
          action: "AUTO_REG_CAMPAIGN",
          resourceType: "TikTokAccount",
          resourceId: task.id,
          details: `Hoàn tất đăng ký ${successCount}/${totalSteps} tài khoản TikTok thật`,
        });
      } catch (err: any) {
        console.error("AutoReg execution error:", err);
        await TaskQueue.failTask(task.id, err.message || "Lỗi tiến trình Auto-Reg");
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt tiến trình tạo tự động ${totalSteps} tài khoản TikTok!`,
      taskId: task.id,
      totalAccounts: totalSteps,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

