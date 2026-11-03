import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function inspectSignup() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) {
    console.log("No browser found");
    return;
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true, // We can run headless for inspection
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

  console.log("Navigating to TikTok signup...");
  await page.goto("https://www.tiktok.com/signup", {
    waitUntil: "networkidle2",
    timeout: 30000,
  }).catch(console.error);

  await new Promise((r) => setTimeout(r, 3000));

  // Find and click "Use phone or email"
  console.log("Looking for 'Use phone or email' button...");
  const clickedPhoneOrEmail = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("a, div, button, p"));
    const target = els.find((el) => el.textContent?.trim() === "Use phone or email");
    if (target) {
      (target as HTMLElement).click();
      return true;
    }
    return false;
  });
  console.log("Clicked 'Use phone or email':", clickedPhoneOrEmail);

  await new Promise((r) => setTimeout(r, 4000));
  console.log("Current URL after click:", page.url());

  // Screenshot step 2
  await page.screenshot({
    path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/signup_step2.png",
  });
  console.log("Screenshot step 2 saved!");

  // Inspect inputs, dropdowns, buttons
  const formElements = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input, select, [role='combobox']")).map((el) => ({
      tag: el.tagName,
      type: el.getAttribute("type"),
      name: el.getAttribute("name"),
      placeholder: el.getAttribute("placeholder"),
      e2e: el.getAttribute("data-e2e"),
      aria: el.getAttribute("aria-label"),
    }));

    const buttons = Array.from(document.querySelectorAll("button, div[role='button']")).map((el) => ({
      tag: el.tagName,
      type: el.getAttribute("type"),
      e2e: el.getAttribute("data-e2e"),
      aria: el.getAttribute("aria-label"),
      text: (el as HTMLElement).innerText?.trim()?.slice(0, 30),
    }));

    return { inputs, buttons: buttons.filter((b) => b.text || b.e2e) };
  });

  console.log("Form Elements:", JSON.stringify(formElements, null, 2));

  await browser.close();
}

inspectSignup().catch(console.error);
