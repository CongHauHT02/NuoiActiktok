import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { MailTmService } from "../src/lib/mailTmService";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function testStealthSignup() {
  console.log("=== BẮT ĐẦU TEST STEALTH ANTI-DETECT ===");
  const mailbox = await MailTmService.createTempMailbox();
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1280,800",
    ],
  });

  const page = await browser.newPage();
  
  // Inject comprehensive stealth evasion scripts BEFORE page loads
  await page.evaluateOnNewDocument(() => {
    // 1. Remove navigator.webdriver
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });

    // 2. Mock window.chrome
    // @ts-ignore
    window.chrome = {
      app: { isInstalled: false },
      webstore: { onInstallStageChanged: {}, onDownloadProgress: {} },
      runtime: { PlatformOs: { MAC: "mac", WIN: "win", ANDROID: "android", CROS: "cros", LINUX: "linux", OPENBSD: "openbsd" } },
    };

    // 3. Mock plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" },
        { name: "Native Client", filename: "internal-nacl-plugin" },
      ],
    });

    // 4. Mock languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["vi-VN", "vi", "en-US", "en"],
    });

    // 5. Mock WebGL vendor/renderer to NVIDIA
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter: number) {
      if (parameter === 37445) return "Google Inc. (NVIDIA)";
      if (parameter === 37446) return "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)";
      return getParameter.apply(this, [parameter]);
    };
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );

  let registerResponse: any = null;
  page.on("response", async (res) => {
    if (res.url().includes("register_verify_login")) {
      try {
        registerResponse = await res.json();
        console.log("=== REGISTER RESPONSE IN STEALTH ===", JSON.stringify(registerResponse));
      } catch {}
    }
  });

  console.log("Truy cập trang đăng ký TikTok...");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "October");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await selectContainers[1].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "15");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 300));
    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "2000");
      if (target) (target as HTMLElement).click();
    });
  }

  // Email
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(mailbox.email, { delay: 30 });
  }

  // Password
  const pass = generateStrongPassword();
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type(pass, { delay: 30 });
  }

  // Natural mouse moves & blur
  await page.mouse.move(200, 300);
  await page.mouse.move(400, 500);
  await page.click('div[data-e2e="select-container"]');
  await new Promise((r) => setTimeout(r, 1200));

  // Click Send code
  console.log("Bấm Send code...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) await sendCodeBtn.click();

  // Wait OTP
  console.log("Chờ OTP từ Mail.tm...");
  let otp: string | null = null;
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
    const msgData = await msgRes.json();
    const items = msgData["hydra:member"] || [];
    if (items.length > 0) {
      const text = `${items[0].subject || ""} ${items[0].intro || ""}`;
      const match = text.match(/\b(\d{6})\b/);
      if (match) {
        otp = match[1];
        console.log(`Đã nhận OTP: [${otp}]`);
        break;
      }
    }
  }

  if (otp) {
    const otpInput = await page.$('input[placeholder*="6-digit code"], input[type="text"]:not([placeholder*="Email"])');
    if (otpInput) {
      await otpInput.click();
      await page.keyboard.type(otp, { delay: 60 });
      await new Promise((r) => setTimeout(r, 1500));

      // Realistic mouse move to Next button
      const nextBtn = await page.$('button[type="submit"]');
      if (nextBtn) {
        const box = await nextBtn.boundingBox();
        if (box) {
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
          await new Promise((r) => setTimeout(r, 400));
          await page.mouse.down();
          await new Promise((r) => setTimeout(r, 80));
          await page.mouse.up();
        }
      }
    }
  }

  await new Promise((r) => setTimeout(r, 6000));

  const cookies = await page.cookies();
  const sessionCookie = cookies.find((c) => c.name === "sessionid");
  console.log("Current URL:", page.url());
  console.log("Has sessionid?", !!sessionCookie);

  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/stealth_result.png" });
  await browser.close();
}

testStealthSignup().catch(console.error);

