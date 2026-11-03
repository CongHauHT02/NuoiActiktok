import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { MailTmService } from "../src/lib/mailTmService";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function inspectRegisterRequest() {
  const mailbox = await MailTmService.createTempMailbox();
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );

  page.on("request", (req) => {
    if (req.url().includes("register_verify_login")) {
      console.log("=== REQUEST URL ===", req.url());
      console.log("=== REQUEST METHOD ===", req.method());
      console.log("=== REQUEST POST DATA ===", req.postData());
      console.log("=== REQUEST HEADERS ===", JSON.stringify(req.headers(), null, 2));
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("register_verify_login")) {
      console.log("=== RESPONSE STATUS ===", res.status());
      try {
        console.log("=== RESPONSE BODY ===", await res.text());
      } catch {}
    }
  });

  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "May");
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
      const target = items.find((i) => i.textContent?.trim() === "1999");
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

  // Blur
  await page.click('div[data-e2e="select-container"]');
  await new Promise((r) => setTimeout(r, 1200));

  // Send code
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) await sendCodeBtn.click();

  // Wait OTP
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
        break;
      }
    }
  }

  if (otp) {
    const otpInput = await page.$('input[placeholder*="6-digit code"], input[type="text"]:not([placeholder*="Email"])');
    if (otpInput) {
      await otpInput.click();
      await page.keyboard.type(otp, { delay: 50 });
      await new Promise((r) => setTimeout(r, 1200));

      const nextBtn = await page.$('button[type="submit"]');
      if (nextBtn) await nextBtn.click();
    }
  }

  await new Promise((r) => setTimeout(r, 5000));
  await browser.close();
}

inspectRegisterRequest().catch(console.error);

