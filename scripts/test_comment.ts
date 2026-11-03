import puppeteer from "puppeteer-core";
import { getBrowserExecutable, parseTikTokCookies } from "../src/lib/browserWorker";
import prisma from "../src/lib/prisma";

async function testComment() {
  const executablePath = getBrowserExecutable();
  const account = await prisma.tikTokAccount.findUnique({
    where: { username: "sarah_tech_101" },
  });

  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
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

  const cookies = parseTikTokCookies(account!.sessionCookies!);
  await page.setCookie(...cookies);

  const url = "https://www.tiktok.com/@conghau20/video/7695012528576941319";
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
  await new Promise(r => setTimeout(r, 4000));

  // Inspect comment elements
  const commentElements = await page.evaluate(() => {
    const list: any[] = [];
    document.querySelectorAll('div, button, span, textarea, [contenteditable="true"]').forEach(el => {
      const e2e = el.getAttribute('data-e2e');
      const aria = el.getAttribute('aria-label');
      if (e2e || aria) {
        if (JSON.stringify({ e2e, aria }).toLowerCase().includes('comment')) {
          list.push({ tag: el.tagName, e2e, aria, isEditable: (el as HTMLElement).isContentEditable });
        }
      }
    });
    return list;
  });
  console.log("Comment elements:", commentElements);

  await browser.close();
}

testComment().catch(console.error).finally(() => prisma.$disconnect());

