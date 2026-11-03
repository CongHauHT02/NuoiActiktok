import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { MailTmService } from "../src/lib/mailTmService";
import { generateStrongPassword } from "../src/lib/autoRegWorker";

async function testWhatHappensAfterNext() {
  console.log("=== BẮT ĐẦU TEST XEM BƯỚC SAU KHI BẤM NEXT ===");

  const mailbox = await MailTmService.createTempMailbox();
  console.log("Mailbox:", mailbox.email);

  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
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

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("register") || url.includes("signup") || url.includes("passport")) {
      try {
        const text = await res.text();
        console.log(`[NETWORK] ${res.status()} ${url.slice(0, 80)} => ${text.slice(0, 200)}`);
      } catch {}
    }
  });

  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // Birthday
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "April");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[1].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "22");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "2000");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // Email
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(mailbox.email, { delay: 30 });
  }

  // Password
  const password = generateStrongPassword();
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type(password, { delay: 30 });
  }

  // Blur
  await page.click('div[data-e2e="select-container"]');
  await new Promise((r) => setTimeout(r, 1200));

  // Wait for Send code
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 8000 }
  );

  console.log("Clicking Send code...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) await sendCodeBtn.click();

  // Wait for OTP from Mail.tm
  console.log("Waiting for OTP from Mail.tm...");
  let otp: string | null = null;
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
    const msgData = await msgRes.json();
    const items = msgData["hydra:member"] || [];
    if (items.length > 0) {
      const text = `${items[0].subject || ""} ${items[0].intro || ""}`;
      const match = text.match(/\b(\d{6})\b/);
      if (match) {
        otp = match[1];
        console.log(`Received OTP: [${otp}]`);
        break;
      }
    }
  }

  if (!otp) {
    console.error("Did not get OTP!");
    await browser.close();
    return;
  }

  // Type OTP
  const otpInput = await page.$('input[placeholder*="6-digit code"], input[type="text"]:not([placeholder*="Email"])');
  if (otpInput) {
    await otpInput.click();
    await page.keyboard.type(otp, { delay: 50 });
  }

  await new Promise((r) => setTimeout(r, 1500));

  // Screenshot before clicking Next
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/before_next.png" });

  // Check Next button
  const nextBtnState = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
    return {
      exists: !!btn,
      disabled: btn ? btn.disabled : true,
      text: btn ? btn.innerText : "",
      outerHTML: btn ? btn.outerHTML : "",
    };
  });
  console.log("Next button state before click:", nextBtnState);

  // Click Next
  console.log("Clicking Next (Submit)...");
  const nextBtn = await page.$('button[type="submit"]');
  if (nextBtn) {
    await nextBtn.click();
  }

  // Wait and inspect what happens over 10 seconds
  for (let s = 1; s <= 5; s++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pageState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        inputs: Array.from(document.querySelectorAll("input")).map((i) => ({
          name: i.name,
          placeholder: i.placeholder,
          type: i.type,
          value: i.value,
        })),
        buttons: Array.from(document.querySelectorAll("button")).map((b) => ({
          text: b.innerText,
          disabled: b.disabled,
        })),
        errors: Array.from(document.querySelectorAll('div[role="alert"], .error, span, p'))
          .map((el) => el.textContent?.trim())
          .filter(
            (t) =>
              t &&
              (t.includes("error") ||
                t.includes("Something went wrong") ||
                t.includes("lỗi") ||
                t.includes("try again") ||
                t.includes("Maximum") ||
                t.includes("too many") ||
                t.includes("Verification code"))
          ),
      };
    });

    const cookies = await page.cookies();
    const sessionCookie = cookies.find((c) => c.name === "sessionid");
    console.log(`[After ${s * 2}s] URL: ${pageState.url}`);
    console.log(`[After ${s * 2}s] Inputs:`, pageState.inputs);
    console.log(`[After ${s * 2}s] Buttons:`, pageState.buttons);
    console.log(`[After ${s * 2}s] Errors:`, pageState.errors);
    console.log(`[After ${s * 2}s] Has sessionid?`, !!sessionCookie);

    if (sessionCookie) {
      console.log("🎉 FOUND SESSIONID! VALUE:", sessionCookie.value.slice(0, 10) + "...");
      break;
    }
  }

  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/after_next.png" });

  await browser.close();
  console.log("=== DONE ===");
}

testWhatHappensAfterNext().catch(console.error);

