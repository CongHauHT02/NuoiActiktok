import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function inspectButtons() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36");
  await page.goto("https://www.tiktok.com/signup", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 3000));

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => el.textContent?.trim() === 'Use phone or email').map(el => ({
      tag: el.tagName,
      className: el.className,
      href: el.getAttribute('href'),
      outer: el.outerHTML.slice(0, 150),
    }));
  });
  console.log("Use phone or email elements:", items);

  // Also check all <a> links on the page
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.getAttribute('href'),
      text: a.innerText?.trim(),
    }));
  });
  console.log("All links:", allLinks);

  await browser.close();
}

inspectButtons().catch(console.error);

