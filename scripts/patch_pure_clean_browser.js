const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/autoRegWorker.ts";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Remove evaluateOnNewDocument & setUserAgent
const stealthBlockRegex = /\/\/\s*Advanced Stealth evasion for ByteDance MSSDK[\s\S]*?await page\.setUserAgent\([^)]+\);\r?\n/;
if (stealthBlockRegex.test(content)) {
  content = content.replace(stealthBlockRegex, "");
  console.log("Removed fake stealth block (which was triggering ByteDance MSSDK detection)!");
} else {
  console.log("Stealth block regex did not match!");
}

// 2. Change blur from select-container click to body click
const blurRegex = /\/\/ Blur \/ Click outside to trigger React validation on password[\s\S]*?await new Promise\(\(r\) => setTimeout\(r, 1000\)\);/;
const blurReplacement = `// Blur / Click outside cleanly
    try {
      await page.click('body');
    } catch {}
    await new Promise((r) => setTimeout(r, 1500));`;

if (blurRegex.test(content)) {
  content = content.replace(blurRegex, blurReplacement);
  console.log("Updated blur to clean body click!");
} else {
  console.log("Blur regex did not match!");
}

fs.writeFileSync(filePath, content, "utf-8");
console.log("Applied pure clean browser patch successfully!");

