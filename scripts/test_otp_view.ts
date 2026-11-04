import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testFillOtpAndCheckNext() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) return;

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,900",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());

  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", {
    waitUntil: "networkidle2",
    timeout: 35000,
  });

  await new Promise((r) => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const t = items.find((i) => i.textContent?.trim() === "October");
      if (t) (t as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    await selectContainers[1].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const t = items.find((i) => i.textContent?.trim() === "15");
      if (t) (t as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 300));

    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 300));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const t = items.find((i) => i.textContent?.trim() === "1998");
      if (t) (t as HTMLElement).click();
    });
  }

  // Email
  const emailInput = await page.$('input[placeholder*="Email"], input[name="email"]');
  if (emailInput) {
    await emailInput.type("doanconghaut@gmail.com", { delay: 30 });
  }

  // Password
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.type("Tk#Secure98@2", { delay: 30 });
  }
  await page.click("body");
  await new Promise((r) => setTimeout(r, 1000));

  // Fill Code input with 123456 to see what button appears / activates
  const codeInput = await page.$('input[placeholder*="code"], input[placeholder*="6-digit"]');
  console.log("Code input found?", !!codeInput);
  if (codeInput) {
    await codeInput.click();
    await codeInput.type("123456", { delay: 40 });
  }

  await new Promise((r) => setTimeout(r, 1000));

  // Take screenshot
  const shotPath = "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/tiktok_otp_typed_view.png";
  await page.screenshot({ path: shotPath, fullPage: true });
  console.log("Screenshot saved to", shotPath);

  // Check all buttons now
  const buttonsInfo = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a")).map((b) => ({
      tag: b.tagName,
      type: b.getAttribute("type"),
      text: b.textContent?.trim(),
      disabled: (b as HTMLButtonElement).disabled,
      visible: (b as HTMLElement).offsetWidth > 0 && (b as HTMLElement).offsetHeight > 0,
      rect: (b as HTMLElement).getBoundingClientRect(),
    })).filter(b => b.text && b.text.length < 50);
  });
  console.log("Buttons after typing OTP:", JSON.stringify(buttonsInfo, null, 2));

  await browser.close();
}

testFillOtpAndCheckNext().catch(console.error);

