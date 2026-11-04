import fs from "fs";
import { getBrowserExecutable } from "./browserWorker";
import prisma from "./prisma";
import { encrypt } from "./crypto";

export interface AutoRegParams {
  email: string;
  password?: string;
  displayName?: string;
  targetUsername?: string;
  onLog: (message: string, level: "INFO" | "WARN" | "ERROR" | "SUCCESS") => Promise<void>;
  // Function to poll database or IMAP for incoming OTP sent to this email
  fetchOtpFromEmail: (email: string, timeoutSeconds?: number) => Promise<string | null>;
}

export interface AutoRegResult {
  success: boolean;
  username?: string;
  email: string;
  password?: string;
  cookiesJson?: string;
  errorMessage?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getRandomBirthday() {
  const month = MONTHS[Math.floor(Math.random() * MONTHS.length)];
  const day = (Math.floor(Math.random() * 28) + 1).toString();
  // Ensure age >= 18 (e.g. 1996 - 2004)
  const year = (Math.floor(Math.random() * 8) + 1996).toString();
  return { month, day, year };
}

export function generateStrongPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pass = "";
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Tk#${pass}@26`;
}

export function generateRandomUsername(email: string) {
  const prefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${randomSuffix}`.toLowerCase();
}

/**
 * Execute semi-automated TikTok account registration:
 * Opens Chrome VISIBLE so the user can complete the puzzle piece captcha in 2 seconds.
 * Then automatically enters OTP from Host Mail, sets password, finishes signup and grabs cookies.
 */
export async function executeAutoRegisterTikTokAccount(
  params: AutoRegParams
): Promise<AutoRegResult> {
  const { email, onLog, fetchOtpFromEmail } = params;
  const password = params.password || generateStrongPassword();
  const birthday = getRandomBirthday();
  const executablePath = getBrowserExecutable();

  if (!executablePath) {
    await onLog("Không tìm thấy Google Chrome hoặc Microsoft Edge trên máy tính.", "ERROR");
    return { success: false, email, errorMessage: "Browser not found" };
  }

  const puppeteer = (await import("puppeteer-core")).default;
  let browser;

  try {
    await onLog(`Mở cửa sổ Chrome trực quan để bắt đầu đăng ký cho: ${email}...`, "INFO");

    // Launch visible browser (headed mode) with real window size
    browser = await puppeteer.launch({
      executablePath,
      headless: false, // Visible so user can drag puzzle piece if TikTok requires it
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,850",
      ],
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Stealth evasion
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );

    await page.bringToFront().catch(() => {});

    // 1. Navigate to direct email registration
    await onLog("Truy cập trang đăng ký TikTok (chế độ Email)...", "INFO");
    await page.goto("https://www.tiktok.com/signup/phone-or-email/email", {
      waitUntil: "networkidle2",
      timeout: 35000,
    });

    await new Promise((r) => setTimeout(r, 2500));

    // 2. Fill Birthday
    await onLog(`Tự động điền ngày sinh: ${birthday.day} ${birthday.month} ${birthday.year} (Đủ điều kiện >18 tuổi)...`, "INFO");

    const selectContainers = await page.$$('div[data-e2e="select-container"]');
    if (selectContainers.length >= 3) {
      // Month
      await selectContainers[0].click();
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate((targetMonth) => {
        const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
        const target = items.find((i) => i.textContent?.trim() === targetMonth);
        if (target) (target as HTMLElement).click();
      }, birthday.month);
      await new Promise((r) => setTimeout(r, 500));

      // Day
      await selectContainers[1].click();
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate((targetDay) => {
        const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
        const target = items.find((i) => i.textContent?.trim() === targetDay);
        if (target) (target as HTMLElement).click();
      }, birthday.day);
      await new Promise((r) => setTimeout(r, 500));

      // Year
      await selectContainers[2].click();
      await new Promise((r) => setTimeout(r, 600));
      await page.evaluate((targetYear) => {
        const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
        const target = items.find((i) => i.textContent?.trim() === targetYear);
        if (target) (target as HTMLElement).click();
      }, birthday.year);
      await new Promise((r) => setTimeout(r, 600));
    }

    // 3. Fill Email
    await onLog(`Tự động điền Email đăng ký: ${email}...`, "INFO");
    const emailInput = await page.$(
      'input[placeholder*="Email address"], input[name="email"], input[type="text"]'
    );
    if (!emailInput) {
      throw new Error("Không tìm thấy ô nhập Email trên TikTok");
    }
    await emailInput.click();
    await page.keyboard.type(email, { delay: 40 });
    await new Promise((r) => setTimeout(r, 500));

    // 4. Fill Password
    await onLog("Tự động điền mật khẩu bảo mật chuẩn TikTok...", "INFO");
    const passInput = await page.$('input[type="password"]');
    if (passInput) {
      await passInput.click();
      await page.keyboard.type(password, { delay: 35 });
    }

    // Blur / Click outside to trigger React validation on password
    try {
      const selectHeader = await page.$('div[data-e2e="select-container"]');
      if (selectHeader) await selectHeader.click();
    } catch {}

    await new Promise((r) => setTimeout(r, 1000));

    // 5. Wait for "Send code" button to become active (disabled = false)
    await onLog("Đang đợi form kiểm tra mật khẩu & kích hoạt nút 'Send code'...", "INFO");
    try {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 8000 }
      );
    } catch {
      await onLog("Nút 'Send code' chưa sẵn sàng hoặc cần tương tác thêm...", "WARN");
    }

    // Setup network response listener for send_code API
    let sendCodeSuccess = false;
    let sendCodeErrorMsg = "";
    const onResponse = async (res: any) => {
      try {
        if (res.url().includes("send_code")) {
          const json = await res.json().catch(() => null);
          if (json) {
            if (json.message === "success") {
              sendCodeSuccess = true;
            } else if (json.data?.description || json.message) {
              sendCodeErrorMsg = json.data?.description || json.message;
            }
          } else if (res.status() === 200) {
            sendCodeSuccess = true;
          }
        }
      } catch {}
    };
    page.on("response", onResponse);

    // Click "Send code" (Gửi mã OTP)
    await onLog("Nhấn nút 'Send code' (Gửi mã xác minh về email)...", "INFO");
    const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
    if (sendCodeBtn) {
      await sendCodeBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.includes("Send code") || b.textContent?.includes("Gửi mã"));
        if (btn) (btn as HTMLElement).click();
      });
    }

    // 6. Wait for Captcha or Resend countdown
    let codeSent = false;
    let captchaPrompted = false;

    for (let wait = 0; wait < 45; wait++) {
      await new Promise((r) => setTimeout(r, 1200));

      const status = await page.evaluate(() => {
        const texts = Array.from(document.querySelectorAll("button, span, div, p")).map((e) => e.textContent || "");
        const isCountdown = texts.some((t) => t.includes("Resend code") || t.includes("Resend") || t.includes("Gửi lại") || /\b\d{1,2}s\b/.test(t));
        const hasCaptcha = !!document.querySelector(
          "#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, .captcha_verify_container, iframe[src*='captcha'], iframe[src*='secsdk']"
        );
        const errorText = texts.find((t) =>
          t.includes("Too many attempts") ||
          t.includes("Maximum number of attempts") ||
          t.includes("quá nhiều lần") ||
          t.includes("try again later")
        );
        return { isCountdown, hasCaptcha, errorText };
      });

      if (status.errorText) {
        await onLog(`⚠️ TikTok cảnh báo: "${status.errorText}"`, "WARN");
      }

      if (status.hasCaptcha) {
        if (!captchaPrompted) {
          captchaPrompted = true;
          await page.bringToFront().catch(() => {});
          await onLog(
            "👉 [HÀNH ĐỘNG CẦN THIẾT]: TikTok hiện bảng ghép hình (Captcha) trên cửa sổ Chrome, bạn hãy lấy chuột kéo mảnh ghép vào đúng vị trí!",
            "WARN"
          );
        }
        continue;
      }

      if (status.errorText) {
        const isRateLimit = status.errorText.includes("Maximum number of attempts") || status.errorText.includes("Too many attempts") || status.errorText.includes("try again later");
        if (isRateLimit) {
          await onLog(`❌ TikTok từ chối gửi mã OTP: "Maximum number of attempts reached. Try again later."`, "ERROR");
          await onLog(`💡 [HƯỚNG DẪN XỬ LÝ]: Địa chỉ IP của bạn đã bị TikTok tạm khóa do gửi mã quá nhiều lần liên tiếp. Để tiếp tục ngay lập tức:`, "WARN");
          await onLog(`👉 1. Hãy bật Cloudflare WARP 1.1.1.1 (Miễn phí) hoặc phát Wi-Fi từ 4G điện thoại (bật tắt chế độ máy bay để đổi IP mới sạch).`, "WARN");
          await onLog(`👉 2. Hoặc đợi 15-30 phút để TikTok tự động mở khóa IP rồi thử lại.`, "WARN");
          return {
            success: false,
            email,
            errorMessage: "TikTok rate limit: Maximum number of attempts reached. Cần đổi IP hoặc đợi 15 phút.",
          };
        }
      }

      if ((sendCodeSuccess || status.isCountdown) && !status.errorText) {
        codeSent = true;
        await onLog("✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)", "SUCCESS");
        break;
      }

      if (sendCodeErrorMsg && !captchaPrompted && wait > 5) {
        await onLog(`⚠️ Phản hồi từ TikTok: "${sendCodeErrorMsg}". Vui lòng kiểm tra cửa sổ Chrome!`, "WARN");
      }
    }

    // Bring browser to front so user sees it clearly
    await page.bringToFront().catch(() => {});

    await onLog(
      `👉 [MỞ GMAIL XEM MÃ]: Mã OTP đã gửi về hộp thư của ${email}. Hãy mở Gmail, lấy mã 6 số và gõ trực tiếp vào ô trên cửa sổ Chrome!`,
      "WARN"
    );

    let finalOtp: string | null = null;
    const maxWaitSec = 120; // 2 minutes
    const startPoll = Date.now();

    // Start background OTP polling via fetchOtpFromEmail
    const otpPromise = fetchOtpFromEmail(email, maxWaitSec);

    let lastLogReminder = Date.now();

    while ((Date.now() - startPoll) < maxWaitSec * 1000) {
      // A. Check if 6 digits are already typed in ANY input field on the page
      const userEnteredCode = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll("input"));
        for (const input of inputs) {
          const val = input.value?.trim() || "";
          if (/^\d{6}$/.test(val) && input.getAttribute("type") !== "password") {
            return val;
          }
        }
        return null;
      });

      if (userEnteredCode) {
        finalOtp = userEnteredCode;
        await onLog(`🎯 Phát hiện mã OTP [${finalOtp}] đã được điền vào ô! Đang xác nhận...`, "SUCCESS");
        break;
      }

      // Log reminder every 25 seconds
      if (Date.now() - lastLogReminder > 25000) {
        const remaining = Math.max(0, Math.round((maxWaitSec * 1000 - (Date.now() - startPoll)) / 1000));
        await onLog(`⏳ [Còn ${remaining}s]: Đang chờ mã OTP... Hãy mở Gmail xem mã và gõ vào ô trên cửa sổ Chrome.`, "INFO");
        lastLogReminder = Date.now();
      }

      // B. Check if background email fetch completed (e.g. via IMAP)
      const bgOtp = await Promise.race([
        otpPromise,
        new Promise<null>((r) => setTimeout(() => r(null), 1500)),
      ]);

      if (bgOtp) {
        finalOtp = bgOtp;
        await onLog(`🎯 Đã nhận mã OTP tự động từ hộp thư: [${finalOtp}]! Đang điền vào TikTok...`, "SUCCESS");
        const otpInput = await page.$(
          'input[placeholder*="6-digit code"], input[placeholder*="Enter 6-digit code"], input[placeholder*="mã"], input[type="text"]:not([placeholder*="Email"])'
        );
        if (otpInput) {
          await otpInput.click();
          await page.keyboard.type(finalOtp, { delay: 50 });
        }
        break;
      }
    }

    if (!finalOtp) {
      await onLog(`Hết thời gian chờ (120s) nhận mã OTP cho ${email}.`, "ERROR");
      return { success: false, email, errorMessage: "OTP timeout" };
    }

    // 8. Wait for Next button to be active
    await onLog("Nhấn nút Tiếp tục (Next) để hoàn tất đăng ký...", "INFO");
    try {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 5000 }
      );
    } catch {}

    const nextBtn = await page.$('button[type="submit"]');
    if (nextBtn) {
      await nextBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }

    await new Promise((r) => setTimeout(r, 4000));

    // 9. Check if username setup step appears
    const usernameInput = await page.$('input[placeholder*="Username"], input[placeholder*="tên người dùng"]');
    let finalUsername = params.targetUsername || generateRandomUsername(email);
    if (usernameInput) {
      await onLog(`Thiết lập Username cho tài khoản: @${finalUsername}...`, "INFO");
      await usernameInput.click();
      await page.keyboard.type(finalUsername, { delay: 50 });
      await new Promise((r) => setTimeout(r, 800));

      const finishBtn = await page.$('button[type="submit"]');
      if (finishBtn) await finishBtn.click();
      await new Promise((r) => setTimeout(r, 3000));
    }

    // 11. Extract real session cookies & Verify real login
    await onLog("Trích xuất và kiểm tra phiên Cookie đăng nhập của tài khoản mới...", "INFO");
    const cookies = await page.cookies();
    const currentUrl = page.url();
    const sessionCookie = cookies.find((c) => c.name === "sessionid" || c.name === "sessionid_ss" || c.name === "sid_tt");

    // Check if TikTok redirected to QR download page or failed with error 1340
    if (!sessionCookie || currentUrl.includes("download-app")) {
      const errorDetail = currentUrl.includes("download-app")
        ? "TikTok từ chối đăng ký qua trình duyệt Web (Chuyển hướng: 'Continue on the TikTok app'). TikTok yêu cầu đăng ký qua thiết bị di động (Mobile App) để chống bot."
        : "TikTok không cấp sessionid phiên đăng nhập. Đăng ký chưa hoàn tất.";
      await onLog(`❌ ${errorDetail}`, "ERROR");
      return {
        success: false,
        email,
        errorMessage: errorDetail,
      };
    }

    const cookiesJson = JSON.stringify(cookies);

    // 12. Save to Database
    const newAccount = await prisma.tikTokAccount.create({
      data: {
        username: finalUsername,
        displayName: params.displayName || finalUsername,
        email: email.toLowerCase(),
        passwordEncrypted: encrypt(password),
        tiktokUid: `tt_${Date.now()}`,
        status: "ACTIVE",
        sessionCookies: cookiesJson,
        notes: "Được tạo tự động qua Auto-Reg Worker (Host Mail)",
        lastSyncAt: new Date(),
      },
    });

    await onLog(
      `🎉 CHÚC MỪNG! Tài khoản TikTok thật @${finalUsername} (${email}) đã được tạo và kích hoạt thành công!`,
      "SUCCESS"
    );

    await new Promise((r) => setTimeout(r, 3000));

    return {
      success: true,
      username: finalUsername,
      email,
      password,
      cookiesJson,
    };
  } catch (error: any) {
    console.error("AutoReg error:", error);
    await onLog(`Lỗi trong quá trình đăng ký: ${error.message}`, "ERROR");
    return { success: false, email, errorMessage: error.message };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}

