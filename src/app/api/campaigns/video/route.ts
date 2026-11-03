import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TaskQueue } from "@/lib/taskQueue";
import { logActivity } from "@/lib/logger";
import { executeRealTikTokInteraction } from "@/lib/browserWorker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      videoUrl,
      campaignName,
      targetActions = { watch: true, like: true, bookmark: true, comment: true },
      comments = [],
      groupId,
      accountCount = 5,
      delaySeconds = 10,
    } = body;

    if (!videoUrl || !videoUrl.includes("tiktok.com")) {
      return NextResponse.json({ error: "Đường dẫn video TikTok không hợp lệ" }, { status: 400 });
    }

    // Extract username & video ID from URL
    // Examples: https://www.tiktok.com/@username/video/7391829102938192837
    const urlMatch = videoUrl.match(/@([a-zA-Z0-9._]+)\/video\/(\d+)/);
    const channelHandle = urlMatch ? `@${urlMatch[1]}` : "Kênh mục tiêu";
    const videoId = urlMatch ? urlMatch[2] : "Video_" + Date.now().toString().slice(-6);

    // Fetch available accounts to participate
    const where: any = { status: { in: ["ACTIVE", "CONFIGURED"] } };
    if (groupId && groupId !== "ALL") {
      where.groupId = groupId;
    }

    const availableAccounts = await prisma.tikTokAccount.findMany({
      where,
      take: Math.min(Math.max(1, parseInt(accountCount) || 5), 50),
      select: { id: true, username: true, displayName: true, sessionCookies: true },
    });

    if (availableAccounts.length === 0) {
      return NextResponse.json({
        error: "Không tìm thấy tài khoản vệ tinh nào ở trạng thái Hoạt động hoặc Đã thiết lập để tham gia",
      }, { status: 400 });
    }

    const totalSteps = availableAccounts.length;
    const finalCampaignName = campaignName || `Mồi tương tác Video #${videoId.slice(-6)} (${channelHandle})`;

    // Start Task in TaskQueue
    const task = await TaskQueue.startTask(
      finalCampaignName,
      "VIDEO_SEEDING_CAMPAIGN",
      totalSteps
    );

    // Asynchronous background execution simulating natural human behavior with real browser
    (async () => {
      try {
        await TaskQueue.log(
          task.id,
          `Khởi động chiến dịch thực tế (Puppeteer & Chrome) cho video: ${videoUrl}`,
          "INFO"
        );
        await TaskQueue.log(
          task.id,
          `Dàn tài khoản vệ tinh tham gia: ${availableAccounts.length} tài khoản. Giãn cách an toàn: ${delaySeconds}s/tài khoản.`,
          "INFO"
        );

        for (let i = 0; i < availableAccounts.length; i++) {
          if (await TaskQueue.isCancelled(task.id)) {
            await TaskQueue.log(task.id, "Chiến dịch đã bị dừng bởi người dùng", "WARN");
            return;
          }

          while (await TaskQueue.isPaused(task.id)) {
            await TaskQueue.sleep(1000);
          }

          const acc = availableAccounts[i];
          const commentText =
            targetActions.comment && comments.length > 0
              ? comments[i % comments.length]
              : undefined;

          await TaskQueue.log(
            task.id,
            `[${i + 1}/${totalSteps}] Đang kích hoạt trình duyệt thực tế cho tài khoản @${acc.username}...`,
            "INFO"
          );

          // Execute real browser interaction
          await executeRealTikTokInteraction({
            videoUrl,
            account: acc,
            actions: targetActions,
            commentText,
            onLog: async (message, level) => {
              await TaskQueue.log(task.id, message, level);
            },
          });

          // Update task progress
          await TaskQueue.updateProgress(task.id, i + 1, totalSteps);

          // Natural delay before next account
          if (i < availableAccounts.length - 1) {
            await TaskQueue.log(
              task.id,
              `Nghỉ giãn cách an toàn ${delaySeconds} giây trước khi tài khoản tiếp theo tham gia...`,
              "INFO"
            );
            await TaskQueue.sleep(Math.min(delaySeconds * 1000, 60000));
          }
        }

        await TaskQueue.completeTask(
          task.id,
          `Hoàn tất chiến dịch tương tác video ${videoId} thành công (${availableAccounts.length} tài khoản)!`
        );

        await logActivity({
          action: "VIDEO_SEEDING_CAMPAIGN",
          resourceType: "TikTokAccount",
          resourceId: videoId,
          details: `Chiến dịch mồi tương tác video ${videoUrl} với ${availableAccounts.length} tài khoản vệ tinh`,
        });
      } catch (err: any) {
        console.error("Seeding execution error:", err);
        await TaskQueue.failTask(task.id, err.message || "Lỗi thực thi chiến dịch video");
      }
    })();

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt chiến dịch mồi tương tác cho video #${videoId}!`,
      taskId: task.id,
      participatingAccounts: availableAccounts.length,
      videoDetails: {
        channelHandle,
        videoId,
        videoUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

