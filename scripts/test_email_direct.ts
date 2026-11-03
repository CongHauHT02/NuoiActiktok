import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testEmailDirect() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 3000));

  console.log("Current URL:", page.url());
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/email_direct.png" });

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input, div[data-e2e="select-container"], button')).map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      placeholder: el.getAttribute('placeholder'),
      e2e: el.getAttribute('data-e2e'),
      aria: el.getAttribute('aria-label'),
      text: (el as HTMLElement).innerText?.trim()?.slice(0, 30),
    }));
  });
  console.log("Inputs on email page:", inputs);

  await browser.close();
}

testEmailDirect().catch(console.error);

