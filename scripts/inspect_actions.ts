import puppeteer from "puppeteer-core";
import { getBrowserExecutable, parseTikTokCookies } from "../src/lib/browserWorker";
import prisma from "../src/lib/prisma";

async function inspectActions() {
  const executablePath = getBrowserExecutable();
  const account = await prisma.tikTokAccount.findUnique({
    where: { username: "sarah_tech_101" },
  });

  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const page = await browser.newPage();
  const cookies = parseTikTokCookies(account!.sessionCookies!);
  await page.setCookie(...cookies);
  await page.goto("https://www.tiktok.com/@conghau20/video/7695012528576941319", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 4000));

  const actionButtons = await page.evaluate(() => {
    const like = document.querySelector('[data-e2e="like-icon"]');
    if (!like) return [];
    const container = like.parentElement?.parentElement;
    if (!container) return [];
    return Array.from(container.querySelectorAll('button, div[role="button"]')).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      e2e: el.getAttribute('data-e2e'),
      aria: el.getAttribute('aria-label'),
      text: (el as HTMLElement).innerText?.trim(),
    }));
  });
  console.log("Action buttons:", actionButtons);

  await browser.close();
}

inspectActions().catch(console.error).finally(() => prisma.$disconnect());

