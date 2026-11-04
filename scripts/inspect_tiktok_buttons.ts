import puppeteer from "puppeteer-core";

async function inspectButtons() {
  const executablePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });
  
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("button, a")).map((b) => ({
      tag: b.tagName,
      type: b.getAttribute("type"),
      text: b.textContent?.trim(),
      href: b.getAttribute("href"),
      dataE2e: b.getAttribute("data-e2e"),
      disabled: (b as HTMLButtonElement).disabled,
    })).filter(b => b.text && b.text.length < 50);
  });

  console.log("Buttons found on page:", JSON.stringify(buttons, null, 2));
  await browser.close();
}

inspectButtons().catch(console.error);

