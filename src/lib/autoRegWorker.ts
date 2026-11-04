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
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=50,50",
        "--window-size=1280,850",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Advanced Stealth evasion for ByteDance MSSDK
    await page.evaluateOnNewDocument(() => {
      const newProto = Object.getPrototypeOf(navigator);
      delete (newProto as any).webdriver;
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["vi-VN", "vi", "en-US", "en"] });
      (window as any).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };
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

    // 5. Check if email is already registered on TikTok
    await new Promise((r) => setTimeout(r, 1200));

    const emailCheckError = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], span, p, div'))
        .map((e) => e.textContent?.trim() || "")
        .filter((t) => t.length > 0 && t.length < 150);

      const alreadySignedUp = texts.find(
        (t) =>
          t.includes("already signed up") ||
          t.includes("đã được sử dụng") ||
          t.includes("đã đăng ký") ||
          t.includes("linked to another account") ||
          t.includes("Email is linked")
      );
      return alreadySignedUp || null;
    });

    if (emailCheckError) {
      await onLog(
        `❌ [EMAIL ĐÃ TỒN TẠI]: TikTok thông báo "${emailCheckError}". Email này đã được đăng ký tài khoản TikTok từ trước rồi!`,
        "ERROR"
      );
      await onLog(
        `💡 TikTok tự động phát hiện và nhận diện Gmail gốc (kể cả khi dùng Mẹo dấu chấm). Hãy nhập một tài khoản Gmail CHƯA TỪNG đăng ký TikTok để nhận mã OTP!`,
        "WARN"
      );
      return {
        success: false,
        email,
        errorMessage: `Email đã đăng ký TikTok từ trước: ${emailCheckError}`,
      };
    }

    // 6. Wait for "Send code" button to become active (disabled = false)
    await onLog("Đang kiểm tra form mật khẩu & nút 'Send code'...", "INFO");
    let sendCodeDisabled = false;
    try {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 5000 }
      );
    } catch {
      sendCodeDisabled = true;
    }

    if (sendCodeDisabled) {
      // Re-verify if TikTok threw an inline error under email/password
      const inlineErrors = await page.evaluate(() => {
        const errorNodes = Array.from(document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], span[style*="red"]'));
        return errorNodes.map(n => n.textContent?.trim()).filter(Boolean);
      });

      if (inlineErrors.length > 0) {
        await onLog(`❌ TikTok phát hiện lỗi trên form đăng ký: "${inlineErrors.join(", ")}"`, "ERROR");
        return {
          success: false,
          email,
          errorMessage: `Lỗi form đăng ký TikTok: ${inlineErrors.join(", ")}`,
        };
      }
    }

    // Setup network response listener for send_code API
    let sendCodeSuccess = false;
    let sendCodeErrorMsg = "";
    let sendCodeAlreadyExists = false;
    const onResponse = async (res: any) => {
      try {
        if (res.url().includes("send_code") || res.url().includes("check_email")) {
          const json = await res.json().catch(() => null);
          if (json) {
            if (json.message === "success") {
              sendCodeSuccess = true;
            } else if (json.data?.error_code === 1023 || json.data?.description?.includes("linked to another account")) {
              sendCodeAlreadyExists = true;
              sendCodeErrorMsg = json.data?.description || "Email is linked to another account";
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
      const box = await sendCodeBtn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2 + (Math.random() * 8 - 4), box.y + box.height / 2 + (Math.random() * 4 - 2), { steps: 18 });
        await new Promise((r) => setTimeout(r, 200));
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 80));
        await page.mouse.up();
      } else {
        await sendCodeBtn.click();
      }
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.includes("Send code") || b.textContent?.includes("Gửi mã"));
        if (btn) (btn as HTMLElement).click();
      });
    }

    // 7. Wait for Captcha or Resend countdown
    let codeSent = false;
    let captchaPrompted = false;

    for (let wait = 0; wait < 35; wait++) {
      await new Promise((r) => setTimeout(r, 1200));

      if (sendCodeAlreadyExists) {
        await onLog(`❌ [EMAIL ĐÃ TỒN TẠI]: Máy chủ TikTok xác nhận "${sendCodeErrorMsg}". Email này đã có tài khoản TikTok!`, "ERROR");
        return {
          success: false,
          email,
          errorMessage: "Email đã tồn tại trên TikTok",
        };
      }

      // Check countdown button & captcha
      const status = await page.evaluate(() => {
        const sendBtn = document.querySelector('button[data-e2e="send-code-button"]');
        const sendBtnText = sendBtn?.textContent?.trim() || "";
        const isCountdown = /resend|\b\d{1,2}s\b|gửi lại/i.test(sendBtnText);

        const hasCaptcha = !!document.querySelector(
          "#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, .captcha_verify_container, iframe[src*='captcha'], iframe[src*='secsdk']"
        );

        // Only inspect visible short leaf elements for genuine rate limits
        let visibleError: string | null = null;
        const candidates = Array.from(
          document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], [class*="toast"], [class*="Toast"], [class*="tooltip"], [class*="Tooltip"]')
        );
        for (const cand of candidates) {
          const el = cand as HTMLElement;
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
          const text = el.textContent?.trim() || "";
          if (isVisible && text.length > 5 && text.length < 120) {
            if (/too many attempts|maximum number of attempts|quá nhiều lần/i.test(text)) {
              visibleError = text;
              break;
            }
          }
        }

        return { isCountdown, hasCaptcha, visibleError, sendBtnText };
      });

      // Priority 1: Network confirmed success OR countdown active -> OTP sent!
      if (sendCodeSuccess || status.isCountdown) {
        codeSent = true;
        await onLog("✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)", "SUCCESS");
        break;
      }

      // Priority 2: Captcha displayed
      if (status.hasCaptcha) {
        if (!captchaPrompted) {
          captchaPrompted = true;
          await page.bringToFront().catch(() => {});
          await onLog(
            "🧩 [HÀNH ĐỘNG CẦN THIẾT]: TikTok hiện bảng ghép hình (Captcha) trên cửa sổ Chrome, bạn hãy lấy chuột kéo mảnh ghép vào đúng vị trí!",
            "WARN"
          );
        }
        continue;
      }

      // Priority 3: Genuine visible rate limit error after waiting at least 4 turns
      if (status.visibleError && wait > 3) {
        await onLog(`❌ TikTok từ chối gửi mã OTP: "${status.visibleError}"`, "ERROR");
        await onLog(`👉 [HƯỚNG DẪN XỬ LÝ]: Địa chỉ IP bị TikTok giới hạn tần suất. Hãy phát 4G từ điện thoại (bật tắt chế độ máy bay) để đổi IP mới sạch.`, "WARN");
        return {
          success: false,
          email,
          errorMessage: `TikTok rate limit: ${status.visibleError}`,
        };
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

