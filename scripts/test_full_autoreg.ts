import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { MailTmService } from "../src/lib/mailTmService";
import { generateStrongPassword, generateRandomUsername } from "../src/lib/autoRegWorker";

async function runFullTest() {
  console.log("=== BẮT ĐẦU TEST AUTO-REG HOÀN CHỈNH ===");

  // 1. Create temporary Mail.tm mailbox
  console.log("1. Đang tạo hộp thư Mail.tm...");
  const mailbox = await MailTmService.createTempMailbox();
  console.log("   Hộp thư:", mailbox.email);

  // 2. Launch browser
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true, // test in headless
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

  let sendCodeSuccess = false;
  page.on("response", async (res) => {
    if (res.url().includes("send_code") && res.status() === 200) {
      try {
        const text = await res.text();
        if (text.includes("email_ticket") || text.includes("success")) {
          sendCodeSuccess = true;
          console.log("   [NETWORK] TikTok API send_code thành công!");
        }
      } catch {}
    }
  });

  console.log("2. Truy cập TikTok signup...");
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 2000));

  // 3. Fill Birthday
  console.log("3. Điền ngày sinh...");
  const selectContainers = await page.$$('div[data-e2e="select-container"]');
  if (selectContainers.length >= 3) {
    await selectContainers[0].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "June");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[1].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "18");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await selectContainers[2].click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('div[role="option"], li, span'));
      const target = items.find((i) => i.textContent?.trim() === "2002");
      if (target) (target as HTMLElement).click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  // 4. Fill Email
  console.log("4. Điền email:", mailbox.email);
  const emailInput = await page.$('input[placeholder*="Email address"], input[name="email"]');
  if (emailInput) {
    await emailInput.click();
    await page.keyboard.type(mailbox.email, { delay: 30 });
  }

  // 5. Fill Password
  const password = generateStrongPassword();
  console.log("5. Điền password:", password);
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click();
    await page.keyboard.type(password, { delay: 30 });
  }

  // Click outside to trigger blur / validate
  await page.click('div[data-e2e="select-container"]');
  await new Promise((r) => setTimeout(r, 1200));

  // 6. Wait for Send code button to become active
  console.log("6. Chờ nút 'Send code' kích hoạt (disabled = false)...");
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
      return btn && !btn.disabled;
    },
    { timeout: 8000 }
  );

  console.log("   Nút Send code đã sẵn sàng! Bấm nút Send code...");
  const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
  if (sendCodeBtn) {
    await sendCodeBtn.click();
  }

  // 7. Check for Captcha or Resend countdown
  console.log("7. Theo dõi Captcha / Resend countdown...");
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const status = await page.evaluate(() => {
      const btn = document.querySelector('button[data-e2e="send-code-button"]') as HTMLButtonElement;
      const text = btn ? btn.innerText : "";
      const hasCaptcha = !!document.querySelector(
        "#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper"
      );
      return { text, hasCaptcha };
    });

    if (sendCodeSuccess || status.text.includes("Resend") || /\d+s/.test(status.text)) {
      console.log(`   ✅ Send code thành công (Button text: '${status.text}')! Không cần kéo captcha.`);
      break;
    }

    if (status.hasCaptcha) {
      console.log("   [CAPTCHA DETECTED] Cần kéo captcha!");
      break;
    }
  }

  // 8. Poll Mail.tm for OTP
  console.log("8. Đang chờ mã OTP từ Mail.tm...");
  let otp: string | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 2500));
    const msgRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${mailbox.token}` },
    });
    const msgData = await msgRes.json();
    const items = msgData["hydra:member"] || [];
    console.log(`   Attempt ${attempt + 1}: ${items.length} emails in inbox`);
    if (items.length > 0) {
      const text = `${items[0].subject || ""} ${items[0].intro || ""}`;
      const match = text.match(/\b(\d{6})\b/);
      if (match) {
        otp = match[1];
        console.log(`   🎉 ĐÃ NHẬN MÃ OTP TIKTOK: [${otp}]`);
        break;
      }
    }
  }

  if (otp) {
    // 9. Type OTP into 6-digit input
    console.log("9. Nhập mã OTP vào ô trên TikTok...");
    const otpInput = await page.$('input[placeholder*="6-digit code"], input[type="text"]:not([placeholder*="Email"])');
    if (otpInput) {
      await otpInput.click();
      await page.keyboard.type(otp, { delay: 50 });
      await new Promise((r) => setTimeout(r, 1500));

      const nextBtnInfo = await page.evaluate(() => {
        const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        return {
          exists: !!btn,
          disabled: btn ? btn.disabled : true,
          text: btn ? btn.innerText : "",
        };
      });
      console.log("   Trạng thái nút Tiếp tục (Next) sau khi nhập OTP:", nextBtnInfo);
    }
  }

  await page.screenshot({
    path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/test_full_autoreg.png",
  });

  await browser.close();
  console.log("=== HOÀN TẤT TEST ===");
}

runFullTest().catch(console.error);

