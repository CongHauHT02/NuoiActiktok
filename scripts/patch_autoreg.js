const fs = require("fs");
const file = "src/lib/autoRegWorker.ts";
let lines = fs.readFileSync(file, "utf8").split(/\r?\n/);

const startIdx = lines.findIndex((l) => l.includes("// 6. Wait for Captcha or Resend countdown"));
const endIdx = lines.findIndex((l) => l.includes("// Bring browser to front so user sees it clearly"));

console.log("Indexes:", startIdx, endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = [
    "    // 6. Wait for Captcha or Resend countdown",
    "    let codeSent = false;",
    "    let captchaPrompted = false;",
    "",
    "    for (let wait = 0; wait < 45; wait++) {",
    "      await new Promise((r) => setTimeout(r, 1200));",
    "",
    "      const status = await page.evaluate(() => {",
    "        const texts = Array.from(document.querySelectorAll(\"button, span, div, p\")).map((e) => e.textContent || \"\");",
    "        const isCountdown = texts.some((t) => t.includes(\"Resend code\") || t.includes(\"Resend\") || t.includes(\"Gửi lại\") || /\\b\\d{1,2}s\\b/.test(t));",
    "        const hasCaptcha = !!document.querySelector(",
    "          \"#captcha-verify-image, .captcha-disable-scroll, #secsdk-captcha-drag-wrapper, .captcha_verify_container, iframe[src*='captcha'], iframe[src*='secsdk']\"",
    "        );",
    "        const errorText = texts.find((t) =>",
    "          t.includes(\"Too many attempts\") ||",
    "          t.includes(\"Maximum number of attempts\") ||",
    "          t.includes(\"quá nhiều lần\") ||",
    "          t.includes(\"try again later\")",
    "        );",
    "        return { isCountdown, hasCaptcha, errorText };",
    "      });",
    "",
    "      if (status.errorText) {",
    "        await onLog(`⚠️ TikTok cảnh báo: \"${status.errorText}\"`, \"WARN\");",
    "      }",
    "",
    "      if (status.hasCaptcha) {",
    "        if (!captchaPrompted) {",
    "          captchaPrompted = true;",
    "          await page.bringToFront().catch(() => {});",
    "          await onLog(",
    "            \"👉 [HÀNH ĐỘNG CẦN THIẾT]: TikTok hiện bảng ghép hình (Captcha) trên cửa sổ Chrome, bạn hãy lấy chuột kéo mảnh ghép vào đúng vị trí!\",",
    "            \"WARN\"",
    "          );",
    "        }",
    "        continue;",
    "      }",
    "",
    "      if (sendCodeSuccess || status.isCountdown) {",
    "        codeSent = true;",
    "        await onLog(\"✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)\", \"SUCCESS\");",
    "        break;",
    "      }",
    "",
    "      if (sendCodeErrorMsg && !captchaPrompted && wait > 5) {",
    "        await onLog(`⚠️ Phản hồi từ TikTok: \"${sendCodeErrorMsg}\". Vui lòng kiểm tra cửa sổ Chrome!`, \"WARN\");",
    "      }",
    "    }",
    ""
  ];

  lines.splice(startIdx, endIdx - startIdx, ...replacement);
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log("Successfully replaced lines!");
}
