import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testTempMail() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === 'June');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
    await selectContainers[1].click();
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '20');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
    await selectContainers[2].click();
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '1999');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // Type disposable email
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type("checkmail991@emailkeep.com", { delay: 40 });
  }

  // Type password
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type("TkSecure#9928@Pass", { delay: 40 });
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click Send code
  console.log("Clicking Send code...");
  const sendBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendBtn) await sendBtn.click();

  await new Promise(r => setTimeout(r, 3000));

  // Screenshot what happens after clicking Send code
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/after_send_code.png" });
  console.log("Screenshot after send code saved!");

  // Check errors or captcha
  const domState = await page.evaluate(() => {
    const errorText = Array.from(document.querySelectorAll('span, div, p')).map(e => e.textContent?.trim()).filter(t => 
      t && (t.toLowerCase().includes('error') || t.toLowerCase().includes('not supported') || t.toLowerCase().includes('invalid') || t.toLowerCase().includes('too many') || t.toLowerCase().includes('try again'))
    );
    const hasCaptcha = !!document.querySelector('#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, iframe[src*="captcha"]');
    return { errorText, hasCaptcha };
  });
  console.log("DOM State after send code:", domState);

  await browser.close();
}

testTempMail().catch(console.error);

