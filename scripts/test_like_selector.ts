import puppeteer from "puppeteer-core";
import { getBrowserExecutable, parseTikTokCookies } from "../src/lib/browserWorker";
import prisma from "../src/lib/prisma";

async function testLike() {
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

  // Inspect like elements
  const elements = await page.evaluate(() => {
    const list: any[] = [];
    document.querySelectorAll('button, span, div').forEach(el => {
      const e2e = el.getAttribute('data-e2e');
      const aria = el.getAttribute('aria-label');
      if (e2e || (aria && aria.toLowerCase().includes('like'))) {
        list.push({ tag: el.tagName, e2e, aria, text: (el as HTMLElement).innerText?.slice(0, 30) });
      }
    });
    return list;
  });
  console.log("Found candidate elements:", elements.filter(e => JSON.stringify(e).toLowerCase().includes('like')));

  // Find the exact like button selector
  const likeSelector = await page.evaluate(() => {
    const selectors = [
      '[data-e2e="like-icon"]',
      '[data-e2e="browse-like-icon"]',
      'button[aria-label*="Like"]',
      'button[aria-label*="thích"]',
      '[data-e2e="feed-like"]',
      'span[data-e2e="like-icon"]',
    ];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el) return { selector: s, html: el.outerHTML.slice(0, 100) };
    }
    // Also look for button containing "Like" text or svg
    return null;
  });
  console.log("Like Selector found:", likeSelector);

  // Attempt click
  if (likeSelector) {
    console.log("Clicking selector:", likeSelector.selector);
    const btn = await page.$(likeSelector.selector);
    if (btn) {
      await btn.click();
      console.log("btn.click() called!");
    }
  } else {
    // Look for button that contains svg with heart
    console.log("Trying to find like button by structure...");
    const clickedBySvg = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg'));
      for (const svg of svgs) {
        const p = svg.closest('button') || svg.closest('div[role="button"]');
        if (p && p.innerText?.toLowerCase().includes('like')) {
          (p as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    console.log("Clicked by SVG:", clickedBySvg);
  }

  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/after_like.png" });
  console.log("Screenshot after like saved!");

  await browser.close();
}

testLike().catch(console.error).finally(() => prisma.$disconnect());

