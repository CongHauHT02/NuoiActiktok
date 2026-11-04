const fs = require("fs");
const file = "src/lib/autoRegWorker.ts";
let content = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// 1. Update puppeteer.launch args and stealth
const oldLaunch = `    // Launch visible browser (headed mode) with real window size
    browser = await puppeteer.launch({
      executablePath,
      headless: false, // Visible so user can drag puzzle piece if TikTok requires it
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,850",
      ],
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Stealth evasion
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });`;

const newLaunch = `    // Launch visible browser (headed mode) with real window size
    browser = await puppeteer.launch({
      executablePath,
      headless: false, // Visible so user can drag puzzle piece if TikTok requires it
      defaultViewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-infobars",
        "--window-position=50,50",
        "--window-size=1280,850",
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    // Advanced Stealth evasion for ByteDance MSSDK
    await page.evaluateOnNewDocument(() => {
      const newProto = Object.getPrototypeOf(navigator);
      delete (newProto as any).webdriver;
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, "languages", { get: () => ["vi-VN", "vi", "en-US", "en"] });
      (window as any).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };
    });`;

if (content.includes(oldLaunch)) {
  content = content.replace(oldLaunch, newLaunch);
  console.log("Updated launch & stealth");
} else {
  console.log("Could not find oldLaunch");
}

// 2. Update sendCode click to realistic mouse movement
const oldSendClick = `    const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
    if (sendCodeBtn) {
      await sendCodeBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.includes("Send code") || b.textContent?.includes("Gửi mã"));
        if (btn) (btn as HTMLElement).click();
      });
    }`;

const newSendClick = `    const sendCodeBtn = await page.$('button[data-e2e="send-code-button"]');
    if (sendCodeBtn) {
      const box = await sendCodeBtn.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2 + (Math.random() * 8 - 4), box.y + box.height / 2 + (Math.random() * 4 - 2), { steps: 18 });
        await new Promise((r) => setTimeout(r, 200));
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 80));
        await page.mouse.up();
      } else {
        await sendCodeBtn.click();
      }
    } else {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find((b) => b.textContent?.includes("Send code") || b.textContent?.includes("Gửi mã"));
        if (btn) (btn as HTMLElement).click();
      });
    }`;

if (content.includes(oldSendClick)) {
  content = content.replace(oldSendClick, newSendClick);
  console.log("Updated sendClick to natural mouse");
} else {
  console.log("Could not find oldSendClick");
}

fs.writeFileSync(file, content, "utf8");

