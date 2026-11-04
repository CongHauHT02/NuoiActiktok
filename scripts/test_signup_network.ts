import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import fs from "fs";

async function testSignupNetwork() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) {
    console.log("No browser found");
    return;
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=50,50",
      "--window-size=1280,850",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const page = (await browser.pages())[0] || (await browser.newPage());

  // Listen to all network responses
  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("passport") || url.includes("send_code") || url.includes("check_email") || url.includes("signup") || url.includes("user")) {
      try {
        const text = await res.text();
        console.log(`\n[NET RESPONSE] Status: ${res.status()} URL: ${url.split("?")[0]}`);
        console.log(`[NET BODY]: ${text.slice(0, 400)}`);
      } catch (e: any) {
        console.log(`[NET ERROR reading body]: ${e.message}`);
      }
    }
  });

  console.log("1. Navigating to TikTok signup page...");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", {
    waitUntil: "networkidle2",
    timeout: 35000,
  });

  await new Promise((r) => setTimeout(r, 2000));

  // Fill Birthday: 15 August 1998
  console.log("2. Selecting Birthday...");
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "August");
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
      const target = items.find((i) => i.textContent?.trim() === "1998");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // Fill Email
  const testEmail = `do.anco.ngha.ut@gmail.com`;
  console.log(`3. Filling Email: ${testEmail}...`);
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"], input[type="text"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(testEmail, { delay: 30 });
  }

  // Fill Password
  console.log("4. Filling Password (valid 12 chars)...");
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type("Tk#Secure98@2", { delay: 30 });
  }

  // Blur
  await page.click('body');
  await new Promise((r) => setTimeout(r, 2000));

  // Check Send Code Button
  console.log("5. Checking Send Code button...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) {
    const disabled = await page.evaluate((b) => (b as HTMLButtonElement).disabled, sendCodeBtn);
    console.log("Button found. Disabled?", disabled);

    console.log("6. Clicking Send Code with human mouse movement...");
    const box = await sendCodeBtn.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
      await new Promise((r) => setTimeout(r, 200));
      await page.mouse.down();
      await new Promise((r) => setTimeout(r, 80));
      await page.mouse.up();
    }
  } else {
    console.log("Send code button NOT found");
  }

  // Wait 6 seconds and capture screenshot
  await new Promise((r) => setTimeout(r, 6000));

  const screenshotPath = "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/tiktok_send_code_result.png";
  await page.screenshot({ path: screenshotPath });
  console.log(`7. Screenshot saved to ${screenshotPath}`);

  // Inspect page error elements
  const pageErrors = await page.evaluate(() => {
    const errorEls = Array.from(document.querySelectorAll('[class*="error"], [class*="Error"], [role="alert"], span, p, div'))
      .filter((el) => {
        const text = el.textContent?.trim() || "";
        return (
          text.includes("Maximum number") ||
          text.includes("Too many") ||
          text.includes("try again") ||
          text.includes("attempts") ||
          text.includes("error")
        ) && text.length < 150;
      })
      .map((el) => el.textContent?.trim());
    return Array.from(new Set(errorEls));
  });

  console.log("Page Error Messages found:", pageErrors);

  await browser.close();
}

testSignupNetwork().catch(console.error);

