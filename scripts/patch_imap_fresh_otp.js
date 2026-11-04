import fs from "fs";

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/lib/imapService.ts";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Maintain a set of used OTP codes in memory
if (!content.includes("usedOtpCodes")) {
  content = `// Memory set to prevent reusing the same OTP twice\nconst usedOtpCodes = new Set<string>();\n` + content;
}

// 2. Fix extractTikTokOtpFromRaw timestamp comparison
// Replace: if (!isNaN(msgDate) && msgDate < minTimestamp - 600000) {
content = content.replace(
  /if\s*\(!isNaN\(msgDate\)\s*&&\s*msgDate\s*<\s*minTimestamp\s*-\s*600000\)\s*\{\s*return null;\s*\}/,
  `if (!isNaN(msgDate) && minTimestamp && msgDate < minTimestamp) {
      return null; // Ignore any email received BEFORE the send-code button was clicked
    }`
);

// 3. Reject already used OTPs
const validateTarget = /if \(subjOtpMatch && isValidOtp\(subjOtpMatch\[1\]\)\) \{\s*return subjOtpMatch\[1\];\s*\}/;
content = content.replace(
  validateTarget,
  `if (subjOtpMatch && isValidOtp(subjOtpMatch[1]) && !usedOtpCodes.has(subjOtpMatch[1])) {
    usedOtpCodes.add(subjOtpMatch[1]);
    return subjOtpMatch[1];
  }`
);

// Also for body regex
content = content.replace(
  /if \(m && isValidOtp\(m\[1\]\)\) \{\s*return m\[1\];\s*\}/,
  `if (m && isValidOtp(m[1]) && !usedOtpCodes.has(m[1])) {
      usedOtpCodes.add(m[1]);
      return m[1];
    }`
);

// 4. In fetchGmailOtpViaImap, start with exact request timestamp (not - 120000)
content = content.replace(
  /const code = await checkImapSession\(cleanUser, cleanPass, startTime - 120000, onLog\);/,
  `const code = await checkImapSession(cleanUser, cleanPass, startTime - 15000, onLog);`
);

fs.writeFileSync(filePath, content, "utf-8");
console.log("Patched imapService.ts to strictly fetch FRESH OTPs only!");

