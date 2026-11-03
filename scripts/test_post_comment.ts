import puppeteer from "puppeteer-core";
import { getBrowserExecutable, parseTikTokCookies } from "../src/lib/browserWorker";
import prisma from "../src/lib/prisma";

async function testPostComment() {
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

  // Click Comment Icon to open drawer
  const commentBtn = await page.$('[data-e2e="comment-icon"]');
  if (commentBtn) {
    console.log("Clicking comment icon...");
    await commentBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    // Find comment input
    const inputSelector = '[contenteditable="true"], div[data-e2e="comment-input"], textarea';
    const inputEl = await page.$(inputSelector);
    if (inputEl) {
      console.log("Found comment input! Typing comment...");
      await inputEl.click();
      await page.keyboard.type("Cảnh hoàng hôn đẹp quá bạn ơi!", { delay: 60 });
      await new Promise(r => setTimeout(r, 1000));

      // Look for post button
      const postBtn = await page.$('[data-e2e="comment-post"]');
      if (postBtn) {
        console.log("Found post button! Submitting comment...");
        await postBtn.click();
      } else {
        console.log("Pressing Enter to submit...");
        await page.keyboard.press("Enter");
      }
      await new Promise(r => setTimeout(r, 3000));
      console.log("Comment submission attempted!");
    } else {
      console.log("Could not find comment input box");
    }
  }

  await page.screenshot({ path: "C:/Users/dchau/.gemini/antigravity/brain/f9d66041-0457-4288-94ea-a71210172c2e/scratch/after_comment.png" });
  console.log("Screenshot after comment saved!");

  await browser.close();
}

testPostComment().catch(console.error).finally(() => prisma.$disconnect());

