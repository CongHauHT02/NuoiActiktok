import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testFillForm() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: false, // Run VISIBLE to see it in action!
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Select Month
  console.log("Selecting Month...");
  const monthContainers = await page.$$('div[data-e2e="select-container"]');
  if (monthContainers.length >= 3) {
    // Month
    await monthContainers[0].click();
    await new Promise(r => setTimeout(r, 800));
    // Click option e.g. "May"
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === 'May');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Day
    console.log("Selecting Day...");
    await monthContainers[1].click();
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '15');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Year
    console.log("Selecting Year...");
    await monthContainers[2].click();
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '1998');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 600));
  }

  // 2. Type Email
  console.log("Typing Email...");
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type("testaccount99@creatorhost.net", { delay: 50 });
  }

  // 3. Type Password
  console.log("Typing Password...");
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type("TikTokSecure@2026!", { delay: 50 });
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/form_filled.png" });
  console.log("Screenshot form_filled saved!");

  // Keep open for 4 seconds then close
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
}

testFillForm().catch(console.error);

