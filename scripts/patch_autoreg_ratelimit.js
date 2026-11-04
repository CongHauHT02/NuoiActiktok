const fs = require("fs");
const file = "src/lib/autoRegWorker.ts";
let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// Look for the sendCodeSuccess break condition
const oldBreak = `      if (sendCodeSuccess || status.isCountdown) {
        codeSent = true;
        await onLog("✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)", "SUCCESS");
        break;
      }`;

const newBreak = `      if (status.errorText) {
        const isRateLimit = status.errorText.includes("Maximum number of attempts") || status.errorText.includes("Too many attempts") || status.errorText.includes("try again later");
        if (isRateLimit) {
          await onLog(\`❌ TikTok từ chối gửi mã OTP: "Maximum number of attempts reached. Try again later."\`, "ERROR");
          await onLog(\`💡 [HƯỚNG DẪN XỬ LÝ]: Địa chỉ IP của bạn đã bị TikTok tạm khóa do gửi mã quá nhiều lần liên tiếp. Để tiếp tục ngay lập tức:\`, "WARN");
          await onLog(\`👉 1. Hãy bật Cloudflare WARP 1.1.1.1 (Miễn phí) hoặc phát Wi-Fi từ 4G điện thoại (bật tắt chế độ máy bay để đổi IP mới sạch).\`, "WARN");
          await onLog(\`👉 2. Hoặc đợi 15-30 phút để TikTok tự động mở khóa IP rồi thử lại.\`, "WARN");
          return {
            success: false,
            email,
            errorMessage: "TikTok rate limit: Maximum number of attempts reached. Cần đổi IP hoặc đợi 15 phút.",
          };
        }
      }

      if ((sendCodeSuccess || status.isCountdown) && !status.errorText) {
        codeSent = true;
        await onLog("✅ TikTok đã xác nhận gửi mã OTP! (Đang gửi về hộp thư Gmail)", "SUCCESS");
        break;
      }`;

if (content.includes(oldBreak)) {
  content = content.replace(oldBreak, newBreak);
  fs.writeFileSync(file, content, "utf8");
  console.log("Successfully replaced break logic in autoRegWorker.ts!");
} else {
  console.log("Could not find oldBreak in autoRegWorker.ts");
}

