import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { MailTmService } from "../src/lib/mailTmService";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function diagnoseSignup() {
  console.log("1. Creating fresh Mail.tm mailbox...");
  const mailbox = await MailTmService.createTempMailbox();
  console.log("Mailbox created:", mailbox.email);

  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("register_verify_login") || url.includes("send_code")) {
      console.log(`\n<<< [NET REQUEST] ${req.method()} ${url}`);
      console.log(`<<< [POST DATA]: ${req.postData()}`);
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("register_verify_login") || url.includes("send_code")) {
      try {
        const text = await res.text();
        console.log(`\n>>> [NET RESPONSE] ${res.status()} ${url}`);
        console.log(`>>> [BODY]: ${text}`);
      } catch {}
    }
  });

  console.log("2. Navigating to TikTok...");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // Birthday: Oct 12 1998
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
      const target = items.find((i) => i.textContent?.trim() === "12");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "1998");
      if (target) (target as HTMLElement).click();
    });
  }

  // Email
  console.log("3. Filling email...");
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(mailbox.email, { delay: 30 });
  }

  // Password
  console.log("4. Filling password...");
  const pass = generateStrongPassword();
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type(pass, { delay: 30 });
  }

  await page.click('body');
  await new Promise((r) => setTimeout(r, 1000));

  // Send code
  console.log("5. Clicking Send code...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) await sendCodeBtn.click();

  // Wait for OTP
  console.log("6. Waiting for OTP from Mail.tm...");
  const otp = await MailTmService.waitForTikTokOtp(mailbox.token, 60, (m) => console.log("[Mail.tm]:", m));
  console.log("Received OTP:", otp);

  if (otp) {
    const otpInput = await page.$('input[placeholder*="6-digit code"], input[type="text"]:not([placeholder*="Email"])');
    if (otpInput) {
      await otpInput.click();
      await page.keyboard.type(otp, { delay: 50 });
      await new Promise((r) => setTimeout(r, 1000));

      await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      await new Promise((r) => setTimeout(r, 1000));

      console.log("7. Clicking Next...");
      const nextBtn = await page.$('button[type="submit"]');
      if (nextBtn) await nextBtn.click();
    }
  }

  console.log("8. Waiting 12 seconds to observe network responses...");
  await new Promise((r) => setTimeout(r, 12000));

  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/diagnose_signup_after_next.png" });
  console.log("Screenshot saved.");

  await browser.close();
}

diagnoseSignup().catch(console.error);
