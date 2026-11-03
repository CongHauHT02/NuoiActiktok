import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function testSendCodeClick() {
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
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );

  // Monitor network responses related to passport or send_code
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("send_code") || url.includes("passport") || url.includes("verification")) {
      try {
        const status = res.status();
        const text = await res.text();
        console.log(`[NETWORK RESP] ${status} ${url.slice(0, 100)} => ${text.slice(0, 300)}`);
      } catch (e) {}
    }
  });

  console.log("Navigating to TikTok signup...");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", {
    waitUntil: "networkidle2",
  });
  await new Promise((r) => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "July");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[1].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "15");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "2001");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // Type Email
  const testEmail = "tt_6jswot6@fldubai.com";
  const emailInput = await page.$(
    'input[placeholder*="Email address"], input[name="email"], input[type="text"]'
  );
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(testEmail, { delay: 40 });
  }

  // Type Password
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    const pass = generateStrongPassword();
    console.log("Using generated password:", pass);
    await page.keyboard.type(pass, { delay: 40 });
  }

  await new Promise((r) => setTimeout(r, 1500));

  const btnState = await page.evaluate(() => {
    const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
    return {
      exists: !!btn,
      disabled: btn ? btn.disabled : true,
      text: btn ? btn.innerText : "",
    };
  });
  console.log("Button state before click:", btnState);

  // Click Send code
  console.log("Clicking Send code button...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) {
    await sendCodeBtn.click();
  }

  await new Promise((r) => setTimeout(r, 3000));

  // Check state after click
  const afterClickState = await page.evaluate(() => {
    const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
    const hasCaptcha = !!document.querySelector(
      "#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, .captcha_verify_container"
    );
    const errorMsg = Array.from(document.querySelectorAll('div[role="alert"], .error, span, p'))
      .map((el) => el.textContent?.trim())
      .filter((t) => t && (t.includes("error") || t.includes("attempt") || t.includes("Too many") || t.includes("limit") || t.includes("thử lại")));
    return {
      btnText: btn ? btn.innerText : "",
      btnDisabled: btn ? btn.disabled : true,
      hasCaptcha,
      errorMsg,
    };
  });
  console.log("State after click:", afterClickState);

  await page.screenshot({
    path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/after_send_code_debug.png",
  });

  await browser.close();
}

testSendCodeClick().catch(console.error);

