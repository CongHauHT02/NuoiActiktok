import fs from "fs";

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/autoRegWorker.ts";
let content = fs.readFileSync(filePath, "utf-8");

const targetRegex = /\/\/ 7\. Wait for Captcha or Resend countdown[\s\S]*?if \(\(sendCodeSuccess \|\| status\.isCountdown\) && !status\.errorText\) \{[\s\S]*?break;\s*\}/;

const replacement = `// 7. Wait for Captcha or Resend countdown
    let codeSent = false;
    let captchaPrompted = false;

    for (let wait = 0; wait < 35; wait++) {
      await new Promise((r) => setTimeout(r, 1200));

      if (sendCodeAlreadyExists) {
        await onLog(\`❌ [EMAIL ĐÃ TỒN TẠI]: Máy chủ TikTok xác nhận "\${sendCodeErrorMsg}". Email này đã có tài khoản TikTok!\`, "ERROR");
        return {
          success: false,
          email,
          errorMessage: "Email đã tồn tại trên TikTok",
        };
      }

      // Check countdown button & captcha
      const status = await page.evaluate(() => {
        const sendBtn = document.querySelector('button[data-e2e="send-code-button"]');
        const sendBtnText = sendBtn?.textContent?.trim() || "";
        const isCountdown = /resend|\\b\\d{1,2}s\\b|gửi lại/i.test(sendBtnText);

        const hasCaptcha = !!document.querySelector(
          "#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, .captcha_verify_container, iframe[src*='captcha'], iframe[src*='secsdk']"
        );

        // Only inspect visible short leaf elements for genuine rate limits
        let visibleError: string | null = null;
        const candidates = Array.from(
          document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], [class*="toast"], [class*="Toast"], [class*="tooltip"], [class*="Tooltip"]')
        );
        for (const cand of candidates) {
          const el = cand as HTMLElement;
          const isVisible = el.offsetWidth > 0 && el.offsetHeight > 0;
          const text = el.textContent?.trim() || "";
          if (isVisible && text.length > 5 && text.length < 120) {
            if (/too many attempts|maximum number of attempts|quá nhiều lần/i.test(text)) {
              visibleError = text;
              break;
            }
          }
        }

        return { isCountdown, hasCaptcha, visibleError, sendBtnText };
      });

      // Priority 1: Network confirmed success OR countdown active -> OTP sent!
      if (sendCodeSuccess || status.isCountdown) {
        codeSent = true;
        await onLog("✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)", "SUCCESS");
        break;
      }

      // Priority 2: Captcha displayed
      if (status.hasCaptcha) {
        if (!captchaPrompted) {
          captchaPrompted = true;
          await page.bringToFront().catch(() => {});
          await onLog(
            "🧩 [HÀNH ĐỘNG CẦN THIẾT]: TikTok hiện bảng ghép hình (Captcha) trên cửa sổ Chrome, bạn hãy lấy chuột kéo mảnh ghép vào đúng vị trí!",
            "WARN"
          );
        }
        continue;
      }

      // Priority 3: Genuine visible rate limit error after waiting at least 4 turns
      if (status.visibleError && wait > 3) {
        await onLog(\`❌ TikTok từ chối gửi mã OTP: "\${status.visibleError}"\`, "ERROR");
        await onLog(\`👉 [HƯỚNG DẪN XỬ LÝ]: Địa chỉ IP bị TikTok giới hạn tần suất. Hãy phát 4G từ điện thoại (bật tắt chế độ máy bay) để đổi IP mới sạch.\`, "WARN");
        return {
          success: false,
          email,
          errorMessage: \`TikTok rate limit: \${status.visibleError}\`,
        };
      }`;

if (!targetRegex.test(content)) {
  console.error("targetRegex did not match!");
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, "utf-8");
console.log("Patched autoRegWorker.ts successfully!");

