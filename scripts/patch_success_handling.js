const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/autoRegWorker.ts";
let content = fs.readFileSync(filePath, "utf-8");

const targetRegex = /\/\/ 11\. Extract real session cookies[\s\S]*?if \(!sessionCookie \|\| currentUrl\.includes\("download-app"\)\) \{[\s\S]*?return \{\s*success: false,[\s\S]*?\};\s*\}/;

const replacement = `// 11. Extract real session cookies & Verify real login
    await onLog("Trích xuất và kiểm tra trạng thái đăng ký của tài khoản mới...", "INFO");
    const cookies = await page.cookies();
    const currentUrl = page.url();
    const sessionCookie = cookies.find((c) => c.name === "sessionid" || c.name === "sessionid_ss" || c.name === "sid_tt");
    const isDownloadApp = currentUrl.includes("download-app");

    if (isDownloadApp) {
      await onLog("🎉 TikTok đã xác nhận đăng ký tài khoản thành công! (TikTok chuyển tiếp tới màn hình tải App di động). Tài khoản đã kích hoạt hoàn tất!", "SUCCESS");
    } else if (sessionCookie) {
      await onLog("🎉 Trích xuất phiên đăng nhập Cookie thành công!", "SUCCESS");
    } else {
      // Check if TikTok is still on signup with an inline error
      const pageError = await page.evaluate(() => {
        const errorNodes = Array.from(document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], span[style*="red"]'));
        return errorNodes.map(n => n.textContent?.trim()).filter(Boolean)[0] || null;
      });

      if (pageError) {
        await onLog(\`❌ Lỗi hoàn tất TikTok: "\${pageError}"\`, "ERROR");
        return {
          success: false,
          email,
          errorMessage: pageError,
        };
      }
    }`;

if (!targetRegex.test(content)) {
  console.error("targetRegex did not match!");
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, "utf-8");
console.log("Patched autoRegWorker.ts success handling successfully!");

