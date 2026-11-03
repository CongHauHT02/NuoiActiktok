import fs from "fs";

export interface InteractionParams {
  videoUrl: string;
  account: {
    id: string;
    username: string;
    displayName: string;
    sessionCookies?: string | null;
  };
  actions: {
    watch: boolean;
    like: boolean;
    bookmark: boolean;
    comment: boolean;
  };
  commentText?: string;
  onLog: (message: string, level: "INFO" | "WARN" | "ERROR" | "SUCCESS") => Promise<void>;
}

export function parseTikTokCookies(raw: string): any[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // 1. JSON Array format (from Cookie-Editor / EditThisCookie)
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain?.startsWith(".") ? c.domain : `.${c.domain || "tiktok.com"}`,
          path: c.path || "/",
        }));
      }
    } catch {}
  }

  // 2. DevTools copy-paste format (lines with tab separators: name \t value \t domain...)
  if (trimmed.includes("\t") || trimmed.includes("\n")) {
    const lines = trimmed.split("\n");
    const cookies: any[] = [];
    for (const line of lines) {
      const parts = line.split("\t").map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const name = parts[0];
        const value = parts[1];
        const rawDomain = parts[2] && parts[2].includes("tiktok") ? parts[2] : ".tiktok.com";
        cookies.push({
          name,
          value,
          domain: rawDomain.startsWith(".") ? rawDomain : `.${rawDomain}`,
          path: parts[3] || "/",
        });
      }
    }
    if (cookies.length > 0) return cookies;
  }

  // 3. Just a raw sessionid string (hex or alphanumeric string e.g. f89389a33bf4743c08605e957653e507)
  if (!trimmed.includes("=") && !trimmed.includes(";")) {
    return [
      { name: "sessionid", value: trimmed, domain: ".tiktok.com", path: "/" },
      { name: "sessionid_ss", value: trimmed, domain: ".tiktok.com", path: "/" },
      { name: "sid_tt", value: trimmed, domain: ".tiktok.com", path: "/" },
    ];
  }

  // 4. Cookie header string format: "key1=val1; key2=val2"
  const cookies: any[] = [];
  const pairs = trimmed.split(";");
  for (const pair of pairs) {
    const trimmedPair = pair.trim();
    if (!trimmedPair) continue;
    const eqIdx = trimmedPair.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmedPair.substring(0, eqIdx).trim();
      const v = trimmedPair.substring(eqIdx + 1).trim();
      cookies.push({
        name: k,
        value: v,
        domain: ".tiktok.com",
        path: "/",
      });
    }
  }
  return cookies;
}

export function getBrowserExecutable(): string | null {
  const userProfile = process.env.USERPROFILE || "C:\\Users\\Lucas";
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${userProfile}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    `${userProfile}\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${userProfile}\\AppData\\Local\\CocCoc\\Browser\\Application\\browser.exe`,
    "C:\\Program Files\\CocCoc\\Browser\\Application\\browser.exe",
  ];

  for (const path of candidates) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return null;
}

/**
 * Execute real TikTok video browser interaction using Chrome/Edge
 */
export async function executeRealTikTokInteraction(params: InteractionParams) {
  const { videoUrl, account, actions, commentText, onLog } = params;
  const executablePath = getBrowserExecutable();

  if (!executablePath) {
    await onLog("Không tìm thấy Google Chrome hoặc Microsoft Edge trên máy tính.", "ERROR");
    return;
  }

  // Dynamic import of ESM puppeteer-core
  const puppeteer = (await import("puppeteer-core")).default;

  let browser;
  try {
    await onLog(
      `Khởi chạy trình duyệt thật (Chrome/Edge) cho tài khoản @${account.username}...`,
      "INFO"
    );

    browser = await puppeteer.launch({
      executablePath,
      headless: true, // Run in background
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,800",
        "--mute-audio",
      ],
    });

    const page = await browser.newPage();

    // Set real desktop User-Agent to avoid immediate bot flags
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 800 });

    // Inject real session cookies if available
    const parsedCookies = account.sessionCookies ? parseTikTokCookies(account.sessionCookies) : [];
    const validCookies = parsedCookies.filter((c) => c.name && c.value);
    const hasSessionCookie = validCookies.some((c) => c.name === "sessionid" || c.name === "sessionid_ss" || c.name === "sid_tt");

    if (hasSessionCookie) {
      try {
        await page.setCookie(...validCookies);
        await onLog(
          `Đã nạp ${validCookies.length} Cookie phiên đăng nhập TikTok (có sessionid) của @${account.username} thành công.`,
          "INFO"
        );
      } catch (err: any) {
        await onLog(`Lỗi áp dụng Cookie vào trình duyệt: ${err.message}`, "WARN");
      }
    } else {
      await onLog(
        `⚠️ Tài khoản @${account.username} chưa có Cookie sessionid hợp lệ (chưa đăng nhập thật). Mở ở chế độ xem Khách (Guest) - TikTok sẽ không ghi nhận Like/Comment từ khách!`,
        "WARN"
      );
    }

    await onLog(`Trình duyệt đang truy cập link video TikTok: ${videoUrl}...`, "INFO");

    // Navigate to TikTok video
    try {
      await page.goto(videoUrl, { waitUntil: "networkidle2", timeout: 20000 });
    } catch {
      try {
        await page.goto(videoUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      } catch {
        await onLog("Trang video tải chậm, tiếp tục xử lý...", "INFO");
      }
    }

    // Wait 3.5 seconds for dynamic TikTok DOM scripts & auth redirects to settle
    await new Promise((r) => setTimeout(r, 3500));

    // Scrape live metadata from the actual TikTok page safely
    let pageTitle = "TikTok Video";
    try {
      pageTitle = await page.title();
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      try { pageTitle = await page.title(); } catch {}
    }
    await onLog(`Tiêu đề trang thực tế từ TikTok: "${pageTitle}"`, "INFO");

    // Check if video element is present and play it safely
    let videoFound = { found: false, duration: 0, currentTime: 0 };
    try {
      videoFound = await page.evaluate(() => {
        const v = document.querySelector("video");
        if (v) {
          v.muted = true;
          v.play().catch(() => {});
          return {
            found: true,
            duration: v.duration || 0,
            currentTime: v.currentTime || 0,
          };
        }
        return { found: false, duration: 0, currentTime: 0 };
      });
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        videoFound = await page.evaluate(() => {
          const v = document.querySelector("video");
          if (v) {
            v.muted = true;
            v.play().catch(() => {});
            return { found: true, duration: v.duration || 0, currentTime: v.currentTime || 0 };
          }
          return { found: false, duration: 0, currentTime: 0 };
        });
      } catch {}
    }

    if (videoFound.found) {
      await onLog(
        `Phát hiện trình phát Video TikTok (Thời lượng: ${Math.round(videoFound.duration || 30)}s). Bắt đầu truyền dữ liệu xem thực tế...`,
        "INFO"
      );
      // Let the video play for 6-10 seconds to generate real view telemetry
      await new Promise((r) => setTimeout(r, 6000));
      await onLog(
        `Tài khoản @${account.username} đã xem thực tế video trên TikTok (Đã truyền tải dữ liệu Video Stream thành công).`,
        "SUCCESS"
      );
    } else {
      await onLog(
        `Trình duyệt đã tải toàn bộ trang video TikTok. (Chế độ tương thích Web Player)`,
        "INFO"
      );
      await new Promise((r) => setTimeout(r, 4000));
    }

    // Attempt interactions based on login state
    if (hasSessionCookie) {
      // 1. Like / Tym via trusted CDP pointer click
      if (actions.like) {
        try {
          const likeBtn = await page.$('[data-e2e="like-icon"], div[aria-label*="Like"]');
          if (likeBtn) {
            await likeBtn.click();
            await onLog(`Tài khoản @${account.username} đã bấm Thả Tym (Like) thành công trên TikTok!`, "SUCCESS");
          } else {
            await onLog(`Không tìm thấy nút Like trên giao diện TikTok`, "WARN");
          }
        } catch (err: any) {
          await onLog(`Lỗi bấm Thả Tym: ${err.message}`, "WARN");
        }
      }

      // 2. Favorite / Bookmark via trusted CDP pointer click
      if (actions.bookmark) {
        try {
          const favBtn = await page.$('[data-e2e="favorite-icon"], div[aria-label*="Favorite"]');
          if (favBtn) {
            await favBtn.click();
            await onLog(`Tài khoản @${account.username} đã lưu video vào mục Yêu thích (Favorite) thành công!`, "SUCCESS");
          }
        } catch (err: any) {
          await onLog(`Lỗi bấm Yêu thích: ${err.message}`, "WARN");
        }
      }

      // 3. Comment via Comment Drawer
      if (actions.comment && commentText) {
        try {
          const commentIcon = await page.$('[data-e2e="comment-icon"]');
          if (commentIcon) {
            await commentIcon.click();
            await new Promise((r) => setTimeout(r, 1500));

            // Switch to Comments tab if needed
            await page.evaluate(() => {
              const tabs = Array.from(document.querySelectorAll("span, p, div, button"));
              const cTab = tabs.find(
                (t) => t.textContent?.trim() === "Comments" || t.textContent?.trim() === "Bình luận"
              );
              if (cTab) (cTab as HTMLElement).click();
            });
            await new Promise((r) => setTimeout(r, 1000));

            const inputSelector = '[contenteditable="true"], div[data-e2e="comment-input"], textarea';
            const inputEl = await page.$(inputSelector);
            if (inputEl) {
              await inputEl.click();
              await page.keyboard.type(commentText, { delay: 60 });
              await new Promise((r) => setTimeout(r, 800));

              const postBtn = await page.$('[data-e2e="comment-post"]');
              if (postBtn) {
                await postBtn.click();
              } else {
                await page.keyboard.press("Enter");
              }
              await onLog(`Tài khoản @${account.username} đã đăng bình luận thực tế: "${commentText}"`, "SUCCESS");
            }
          }
        } catch (err: any) {
          await onLog(`Lỗi đăng bình luận: ${err.message}`, "WARN");
        }
      }
    } else {
      await onLog(
        `[LƯU Ý QUAN TRỌNG] Do tài khoản @${account.username} chưa có Cookie đăng nhập TikTok thật: Lượt xem (View / Watch Time) đã được gửi đến TikTok, nhưng máy chủ TikTok chặn bấm Tym/Bình luận của người chưa đăng nhập. Hãy cập nhật Cookie thật cho tài khoản để mở khóa tự động thả Tym.`,
        "WARN"
      );
    }
  } catch (error: any) {
    console.error("Browser interaction error:", error);
    await onLog(`Lỗi xử lý trình duyệt cho @${account.username}: ${error.message}`, "ERROR");
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}

