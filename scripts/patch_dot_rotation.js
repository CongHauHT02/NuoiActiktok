const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/app/api/accounts/auto-reg/route.ts";
let content = fs.readFileSync(filePath, "utf-8");

const target = `      // Check existing accounts in database to exclude already used variations
      const existingAccounts = await prisma.tikTokAccount.findMany({
        where: { email: { in: variations } },
        select: { email: true },
      });
      const existingSet = new Set(existingAccounts.map((a) => a.email?.toLowerCase()));

      const availableVariations = variations.filter((v) => !existingSet.has(v.toLowerCase()));

      if (availableVariations.length === 0) {
        return NextResponse.json(
          { error: "Tất cả các biến thể Gmail Dot Trick của tài khoản này đã được sử dụng trong hệ thống!" },
          { status: 400 }
        );
      }

      const selected = availableVariations.slice(0, requestedCount);
      targetTasks = selected.map((e) => ({ email: e, isFreeCloud: false, isGmailDot: true }));`;

// If target contains mojibake, search with regex
const regex = /\/\/\s*Check existing accounts in database to exclude already used variations[\s\S]*?targetTasks\s*=\s*selected\.map\(\(e\)\s*=>\s*\(\{\s*email:\s*e,\s*isFreeCloud:\s*false,\s*isGmailDot:\s*true\s*\}\)\);/;

const replacement = `      // Clean up old attempts (> 15 minutes)
      const now = Date.now();
      for (const [em, time] of recentlyAttemptedDotEmails.entries()) {
        if (now - time > 15 * 60 * 1000) {
          recentlyAttemptedDotEmails.delete(em);
        }
      }

      // Check existing accounts in database to exclude already used variations
      const existingAccounts = await prisma.tikTokAccount.findMany({
        where: { email: { in: variations } },
        select: { email: true },
      });
      const existingSet = new Set(existingAccounts.map((a) => a.email?.toLowerCase()));

      // Prioritize variations that are NOT in DB AND NOT recently attempted (so retries try next dot positions!)
      let availableVariations = variations.filter(
        (v) => !existingSet.has(v.toLowerCase()) && !recentlyAttemptedDotEmails.has(v.toLowerCase())
      );

      // If all variations were recently attempted, fallback to any unused in database
      if (availableVariations.length === 0) {
        availableVariations = variations.filter((v) => !existingSet.has(v.toLowerCase()));
      }

      if (availableVariations.length === 0) {
        return NextResponse.json(
          { error: "Tất cả các biến thể Gmail Dot Trick của tài khoản này đã được sử dụng trong hệ thống!" },
          { status: 400 }
        );
      }

      const selected = availableVariations.slice(0, requestedCount);
      // Mark as recently attempted so subsequent clicks rotate to next variations
      for (const sel of selected) {
        recentlyAttemptedDotEmails.set(sel.toLowerCase(), Date.now());
      }
      targetTasks = selected.map((e) => ({ email: e, isFreeCloud: false, isGmailDot: true }));`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log("Successfully patched auto-reg route with dot variation rotation!");
} else {
  console.error("Regex did not match!");
  process.exit(1);
}

