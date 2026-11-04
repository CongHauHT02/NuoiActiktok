const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/autoRegWorker.ts";
let content = fs.readFileSync(filePath, "utf-8");

const targetRegex = /\/\/ 8\. Wait for Next button to be active[\s\S]*?\/\/ 11\. Extract real session cookies[\s\S]*?const cookiesJson = JSON\.stringify\(cookies\);/;

const replacement = `// 8. Trigger input change and scroll Next button into view
    await onLog("Tự động cuộn trang & kích hoạt nút Tiếp tục (Next)...", "INFO");
    try {
      await page.click('body');
    } catch {}

    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    await new Promise((r) => setTimeout(r, 1000));

    // Wait for Next button to be active (disabled = false)
    try {
      await page.waitForFunction(
        () => {
          const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          return btn && !btn.disabled;
        },
        { timeout: 8000 }
      );
    } catch {}

    const nextBtn = await page.$('button[type="submit"]');
    if (nextBtn) {
      await onLog("Nhấn nút Tiếp tục (Next) để gửi mã xác thực tới TikTok...", "INFO");
      const box = await nextBtn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
        await new Promise((r) => setTimeout(r, 150));
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 80));
        await page.mouse.up();
      } else {
        await nextBtn.click();
      }
    } else {
      await page.keyboard.press("Enter");
    }

    // 9. Wait for account creation & optional Username prompt
    let sessionCookie: any = null;
    let finalUsername = params.targetUsername || generateRandomUsername(email);

    await onLog("Đang đợi TikTok kích hoạt tài khoản & tạo phiên đăng nhập...", "INFO");

    for (let check = 0; check < 15; check++) {
      await new Promise((r) => setTimeout(r, 1200));

      // Check if username setup step appears
      const usernameInput = await page.$('input[placeholder*="Username"], input[placeholder*="tên người dùng"]');
      if (usernameInput) {
        await onLog(\`Thiết lập Username cho tài khoản: @\${finalUsername}...\`, "INFO");
        await usernameInput.click();
        await page.keyboard.type(finalUsername, { delay: 40 });
        await new Promise((r) => setTimeout(r, 600));

        const finishBtn = await page.$('button[type="submit"]');
        if (finishBtn) await finishBtn.click();
      }

      // Check if sessionid cookie is present
      const allCookies = await page.cookies();
      sessionCookie = allCookies.find((c) => c.name === "sessionid" || c.name === "sessionid_ss" || c.name === "sid_tt");
      if (sessionCookie) {
        break;
      }
    }

    // 11. Extract real session cookies & Verify real login
    await onLog("Trích xuất và kiểm tra phiên đăng nhập thật (sessionid) từ TikTok...", "INFO");
    const cookies = await page.cookies();

    if (!sessionCookie) {
      const pageError = await page.evaluate(() => {
        const errorNodes = Array.from(document.querySelectorAll('[role="alert"], [class*="error"], [class*="Error"], span[style*="red"], div[class*="tip"]'));
        return errorNodes.map(n => n.textContent?.trim()).filter(Boolean)[0] || null;
      });

      const err = pageError || "TikTok chưa hoàn tất kích hoạt (chưa cấp sessionid).";
      await onLog(\`❌ Đăng ký chưa hoàn tất: \${err}\`, "ERROR");
      return {
        success: false,
        email,
        errorMessage: err,
      };
    }

    await onLog("🎉 Đăng nhập thành công! Đã trích xuất phiên Cookie sessionid thật từ TikTok!", "SUCCESS");
    const cookiesJson = JSON.stringify(cookies);`;

if (!targetRegex.test(content)) {
  console.error("targetRegex did not match!");
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, "utf-8");
console.log("Patched autoRegWorker.ts next button scroll & sessionid check successfully!");

