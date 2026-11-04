import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function checkDOM() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) return;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", {
    waitUntil: "networkidle2",
    timeout: 30000,
  });

  const result = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const matching = all
      .filter((el) => {
        const text = el.textContent || "";
        return text.includes("Maximum number of attempts");
      })
      .map((el) => ({
        tag: el.tagName,
        className: el.className,
        visible: (el as HTMLElement).offsetWidth > 0 && (el as HTMLElement).offsetHeight > 0,
        textLength: el.textContent?.length || 0,
        textPreview: el.textContent?.slice(0, 100),
      }));

    return matching;
  });

  console.log("Matching elements on fresh page load:", JSON.stringify(result, null, 2));
  await browser.close();
}

checkDOM().catch(console.error);

