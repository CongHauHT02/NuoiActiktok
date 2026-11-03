import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testMobileSignup() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  // Emulate iPhone 14 Pro
  await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1");
  await page.setViewport({ width: 393, height: 852, isMobile: true, hasTouch: true });

  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  console.log("Current URL on mobile:", page.url());
  console.log("Title:", await page.title());

  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/mobile_signup.png" });
  await browser.close();
}

testMobileSignup().catch(console.error);

