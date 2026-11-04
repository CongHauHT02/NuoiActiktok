import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";
import { executeAutoRegisterTikTokAccount, generateRandomUsername } from "@/lib/autoRegWorker";
import { MailTmService } from "@/lib/mailTmService";
import { generateGmailDotVariations, normalizeGmail } from "@/lib/gmailDotTrick";
import { fetchGmailOtpViaImap } from "@/lib/imapService";
import { getAttemptedEmails, recordAttemptedEmails } from "@/lib/attemptedEmails";

export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = "free_cloud", // "free_cloud" | "gmail_dot" | "domain" | "paste"
      emails = [],          // array of email strings
      domain,              // custom domain
      baseGmail = "",       // Base Gmail for Dot Trick
      gmailAppPassword = "", // Optional IMAP App Password
      count = 1,
      delaySeconds = 10,
    } = body;

    const requestedCount = Math.min(Math.max(1, parseInt(count) || 1), 30);
    let targetTasks: Array<{ email?: string; isFreeCloud: boolean; isGmailDot?: boolean }> = [];

    if (mode === "gmail_dot") {
      const cleanBase = baseGmail.trim().toLowerCase();
      if (!cleanBase || !cleanBase.includes("@")) {
        return NextResponse.json(
          { error: "Vui lòng nhập địa chỉ Gmail thật của bạn (vd: conghau20@gmail.com)" },
          { status: 400 }
        );
      }

      // Generate up to 200 variations
      const variations = generateGmailDotVariations(cleanBase, 200);

            // Persistent attempted emails check
      const attemptedSet = getAttemptedEmails();

      // Check existing accounts in database to exclude already used variations
      const existingAccounts = await prisma.tikTokAccount.findMany({
        where: { email: { in: variations } },
        select: { email: true },
      });
      const existingSet = new Set(existingAccounts.map((a) => a.email?.toLowerCase()));

      // Prioritize variations that are NOT in DB AND NOT previously attempted
      let availableVariations = variations.filter(
        (v) => !existingSet.has(v.toLowerCase()) && !attemptedSet.has(v.toLowerCase())
      );

      // If all variations were attempted, fallback to any unused in database
      if (availableVariations.length === 0) {
        availableVariations = variations.filter((v) => !existingSet.has(v.toLowerCase()));
      }

      if (availableVariations.length === 0) {
        return NextResponse.json(
          { error: "Tất cả các biến thể Gmail Dot Trick của tài khoản này đã được sử dụng trong hệ thống!" },
          { status: 400 }
        );
      }

      // Shuffle available variations so every single run picks a completely fresh, randomized dot position
      availableVariations.sort(() => Math.random() - 0.5);

      const selected = availableVariations.slice(0, requestedCount);
      // Persistently record selected emails so they are NEVER repeated even across server restarts
      recordAttemptedEmails(selected);

      targetTasks = selected.map((e) => ({ email: e, isFreeCloud: false, isGmailDot: true }));
    } else if (mode === "free_cloud") {
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
    const taskTitle =
      mode === "gmail_dot"
        ? `Đăng ký ${totalSteps} nick TikTok qua Mẹo 0đ (Gmail Dot Trick: ${baseGmail})`
        : `Đăng ký ${totalSteps} tài khoản TikTok thật (Auto-Reg Bán tự động)`;

    const task = await TaskQueue.startTask(taskTitle, "TIKTOK_ACCOUNT_REGISTRATION", totalSteps);

    // Run execution in background
    (async () => {
      try {
        const modeDesc =
          mode === "gmail_dot"
            ? `Mẹo 0đ Gmail Dot Trick (${baseGmail})`
            : mode === "free_cloud"
            ? "Cloud Mail Miễn Phí"
            : "Email tùy chọn";

        await TaskQueue.log(
          task.id,
          `Khởi động quy trình Auto-Reg (${modeDesc}) cho ${totalSteps} tài khoản. Giãn cách: ${delaySeconds}s...`,
          "INFO"
        );

        if (mode === "gmail_dot") {
          await TaskQueue.log(
            task.id,
            `💡 [Mẹo 0đ]: Tất cả ${totalSteps} email đăng ký sẽ nhận mã OTP chung về hộp thư Gmail [${baseGmail}]. Đuôi @gmail.com uy tín giúp TikTok bỏ qua bắt số điện thoại!`,
            "SUCCESS"
          );
        }

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
          const fetchOtp = async (targetEmail: string, timeoutSec = 120): Promise<string | null> => {
            // In Gmail Dot mode without app password, remind user immediately
            if (currentTask.isGmailDot && !gmailAppPassword) {
              await TaskQueue.log(
                task.id,
                `👉 [HÃY MỞ GMAIL]: Mã xác minh OTP 6 số đã được TikTok gửi về [${baseGmail}]. Bạn hãy mở tab Gmail, copy/nhớ mã 6 số và gõ ngay vào ô trên cửa sổ Chrome!`,
                "WARN"
              );
            }

            // A. If Gmail Dot Trick with App Password, connect IMAP directly
            if (currentTask.isGmailDot && gmailAppPassword) {
              try {
                return await fetchGmailOtpViaImap(
                  baseGmail,
                  gmailAppPassword,
                  timeoutSec,
                  async (msg) => {
                    await TaskQueue.log(task.id, msg, "INFO");
                  }
                );
              } catch (err: any) {
                await TaskQueue.log(task.id, `Lỗi kiểm tra IMAP Gmail: ${err.message}`, "WARN");
              }
            }

            // B. If Mail.tm account, poll via Mail.tm API
            if (mailTmAccount) {
              return await MailTmService.waitForTikTokOtp(
                mailTmAccount.token,
                timeoutSec,
                async (msg) => {
                  await TaskQueue.log(task.id, msg, "INFO");
                }
              );
            }

            // C. If custom Host Mail or manual, poll from database
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
          details: `Hoàn tất đăng ký ${successCount}/${totalSteps} tài khoản TikTok thật (${modeDesc})`,
        });
      } catch (err: any) {
        console.error("AutoReg execution error:", err);
        await TaskQueue.failTask(task.id, err.message || "Lỗi tiến trình Auto-Reg");
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt tiến trình tạo tự động ${totalSteps} tài khoản TikTok (${modeTitle(mode)})!`,
      taskId: task.id,
      totalAccounts: totalSteps,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function modeTitle(mode: string): string {
  switch (mode) {
    case "gmail_dot":
      return "Mẹo 0đ Gmail Dot Trick";
    case "free_cloud":
      return "Cloud Mail Miễn Phí";
    case "domain":
      return "Host Mail Riêng";
    default:
      return "Email Sẵn Có";
  }
}
