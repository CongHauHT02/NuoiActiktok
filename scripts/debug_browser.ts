import puppeteer from "puppeteer-core";
import { getBrowserExecutable, parseTikTokCookies } from "../src/lib/browserWorker";
import prisma from "../src/lib/prisma";

async function test() {
  const executablePath = getBrowserExecutable();
  if (!executablePath) {
    console.log("No browser found");
    return;
  }

  const account = await prisma.tikTokAccount.findUnique({
    where: { username: "sarah_tech_101" },
  });

  const browser = await puppeteer.launch({
    executablePath,
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

  if (account?.sessionCookies) {
    const cookies = parseTikTokCookies(account.sessionCookies);
    console.log("Setting cookies:", cookies.length);
    await page.setCookie(...cookies);
  }

  const url = "https://vt.tiktok.com/ZSpe21JSt/";
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 }).catch(console.error);
  
  await new Promise(r => setTimeout(r, 4000));
  
  const finalUrl = page.url();
  const title = await page.title();
  console.log("Final URL:", finalUrl);
  console.log("Title:", title);

  // Take screenshot to see what is on screen
  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/tiktok_screen.png" });
  console.log("Screenshot saved!");

  // Check login state: is profile avatar or login button present?
  const loginState = await page.evaluate(() => {
    const loginBtn = document.querySelector('[data-e2e="top-login-button"], #header-login-button');
    const profileIcon = document.querySelector('[data-e2e="profile-icon"]');
    const likeBtn = document.querySelector('[data-e2e="like-icon"], [data-e2e="browse-like-icon"]');
    const captcha = document.querySelector('#captcha-verify-image, .captcha-disable-scroll');
    return {
      hasLoginButton: !!loginBtn,
      hasProfileIcon: !!profileIcon,
      hasLikeButton: !!likeBtn,
      hasCaptcha: !!captcha,
    };
  });
  console.log("DOM State:", loginState);

  await browser.close();
}

test().catch(console.error).finally(() => prisma.$disconnect());
