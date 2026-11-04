import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testScrollNext() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) return;

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,950",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 1500));

  // Scroll button into view
  await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (btn) btn.scrollIntoView({ block: "center" });
  });

  const shotPath = "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/tiktok_next_button_scrolled.png";
  await page.screenshot({ path: shotPath });
  console.log("Screenshot with Next scrolled into view saved to:", shotPath);

  await browser.close();
}

testScrollNext().catch(console.error);

