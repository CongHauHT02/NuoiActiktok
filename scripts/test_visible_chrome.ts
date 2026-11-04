import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";
import { exec } from "child_process";

async function main() {
  const exe = getBrowserExecutable();
  console.log("Using executable:", exe);

  const browser = await puppeteer.launch({
    executablePath: exe!,
    headless: false,
    defaultViewport: null,
    ignoreDefaultArgs: ["--enable-automation"],
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--start-maximized",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  console.log("Browser opened successfully!");
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  console.log("Page opened: ", await page.title());

  // Use PowerShell to bring Chrome to foreground
  exec('powershell -Command "(New-Object -ComObject WScript.Shell).AppActivate(\'TikTok\')"', (err, stdout) => {
    console.log("AppActivate executed:", err ? err.message : "Success");
  });

  await new Promise((r) => setTimeout(r, 5000));
  await browser.close();
  console.log("Done.");
}

main().catch(console.error);

