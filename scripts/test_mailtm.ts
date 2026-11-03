import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function testMailTm() {
  // 1. Create a free account on Mail.tm
  const randomUser = `tt_${Math.random().toString(36).substring(2, 8)}`;
  const email = `${randomUser}@fldubai.com`;
  const password = "Password@123456";

  console.log("Creating Mail.tm account:", email);
  const createRes = await fetch("https://api.mail.tm/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });
  const createJson = await createRes.json();
  console.log("Mail.tm create response:", createJson);

  // Get token
  const tokenRes = await fetch("https://api.mail.tm/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: email, password }),
  });
  const tokenJson = await tokenRes.json();
  const token = tokenJson.token;
  console.log("Got Mail.tm token:", !!token);

  // 2. Open Puppeteer and submit to TikTok
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
    await page.keyboard.type(email, { delay: 40 });
  }

  // Type Password
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type("Tk#Secure@2026!", { delay: 40 });
  }

  await new Promise(r => setTimeout(r, 1000));

  // Click Send Code
  console.log("Clicking Send code on TikTok...");
  const sendBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendBtn) await sendBtn.click();

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/mailtm_tiktok.png" });

  // 3. Poll Mail.tm inbox for 25 seconds
  console.log("Polling Mail.tm inbox for incoming email from TikTok...");
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const msgJson = await msgRes.json();
    console.log(`Poll ${i + 1}: Messages count =`, msgJson["hydra:totalItems"]);
    if (msgJson["hydra:totalItems"] > 0) {
      console.log("RECEIVED EMAIL ON MAIL.TM! Details:", msgJson["hydra:member"]);
      break;
    }
  }

  await browser.close();
}

testMailTm().catch(console.error);

