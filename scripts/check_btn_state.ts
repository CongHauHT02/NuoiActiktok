import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function checkButtonState() {
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
      const target = items.find(i => i.textContent?.trim() === 'March');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
    await selectContainers[1].click();
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '10');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
    await selectContainers[2].click();
    await new Promise(r => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find(i => i.textContent?.trim() === '2000');
      if (target) (target as HTMLElement).click();
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // Type Email
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type("tt_test123@fldubai.com", { delay: 40 });
  }

  // Type Password
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    const pass = generateStrongPassword();
    console.log("Using generated password:", pass);
    await page.keyboard.type(pass, { delay: 40 });
  }

  await new Promise(r => setTimeout(r, 1500));

  // Inspect Send code button state
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('button[data-e2e="send-code-button"]');
    if (!btn) return { exists: false };
    return {
      exists: true,
      disabled: (btn as HTMLButtonElement).disabled,
      className: btn.className,
      outerHTML: btn.outerHTML,
      text: (btn as HTMLElement).innerText,
    };
  });
  console.log("Send code button info before click:", btnInfo);

  // If disabled, why? Check if password criteria are met
  const passwordCriteria = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('li, div, span')).filter(el => 
      el.textContent?.includes('characters') || el.textContent?.includes('Letters, numbers')
    ).map(el => ({ text: el.textContent?.trim(), className: el.className }));
    return list;
  });
  console.log("Password criteria:", passwordCriteria);

  // Take screenshot
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/btn_state.png" });

  await browser.close();
}

checkButtonState().catch(console.error);

