import puppeteer from "puppeteer-core";
import { getBrowserExecutable } from "../src/lib/browserWorker";

async function inspectForm() {
  const executablePath = getBrowserExecutable();
  const browser = await puppeteer.launch({
    executablePath: executablePath!,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const page = await browser.newPage();
  await page.goto("https://www.tiktok.com/signup/phone-or-email/email", { waitUntil: "networkidle2" });

  const elements = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button")).map((b) => ({
      text: b.innerText,
      type: b.type,
      dataE2e: b.getAttribute("data-e2e"),
      className: b.className,
      disabled: b.disabled,
    }));
    const inputs = Array.from(document.querySelectorAll("input")).map((i) => ({
      name: i.name,
      type: i.type,
      placeholder: i.placeholder,
      dataE2e: i.getAttribute("data-e2e"),
    }));
    return { btns, inputs };
  });

  console.log("Buttons:", JSON.stringify(elements.btns, null, 2));
  console.log("Inputs:", JSON.stringify(elements.inputs, null, 2));

  await browser.close();
}

inspectForm().catch(console.error);

