const fs = require("fs");

const filePath = "d:/FEPV-IT/OutSource/NuoiACtt/src/app/api/accounts/auto-reg/route.ts";
let content = fs.readFileSync(filePath, "utf-8");

// 1. Add import
if (!content.includes("attemptedEmails")) {
  content = content.replace(
    'import { fetchGmailOtpViaImap } from "@/lib/imapService";',
    'import { fetchGmailOtpViaImap } from "@/lib/imapService";\nimport { getAttemptedEmails, recordAttemptedEmails } from "@/lib/attemptedEmails";'
  );
}

// 2. Remove recentlyAttemptedDotEmails
content = content.replace(
  /\/\/ Global in-memory cache to prevent re-trying the exact same dot variation within 15 minutes\r?\nconst recentlyAttemptedDotEmails = new Map<string, number>\(\);\r?\n/,
  ""
);

// 3. Replace variation selection logic with persistent storage + random shuffle
const targetRegex = /\/\/ Clean up old attempts[\s\S]*?targetTasks = selected\.map\(\(e\) => \(\{ email: e, isFreeCloud: false, isGmailDot: true \}\)\);/;

const replacement = `// Persistent attempted emails check
      const attemptedSet = getAttemptedEmails();

      // Check existing accounts in database to exclude already used variations
      const existingAccounts = await prisma.tikTokAccount.findMany({
        where: { email: { in: variations } },
        select: { email: true },
      });
      const existingSet = new Set(existingAccounts.map((a) => a.email?.toLowerCase()));

      // Prioritize variations that are NOT in DB AND NOT previously attempted
      let availableVariations = variations.filter(
        (v) => !existingSet.has(v.toLowerCase()) && !attemptedSet.has(v.toLowerCase())
      );

      // If all variations were attempted, fallback to any unused in database
      if (availableVariations.length === 0) {
        availableVariations = variations.filter((v) => !existingSet.has(v.toLowerCase()));
      }

      if (availableVariations.length === 0) {
        return NextResponse.json(
          { error: "Tất cả các biến thể Gmail Dot Trick của tài khoản này đã được sử dụng trong hệ thống!" },
          { status: 400 }
        );
      }

      // Shuffle available variations so every single run picks a completely fresh, randomized dot position
      availableVariations.sort(() => Math.random() - 0.5);

      const selected = availableVariations.slice(0, requestedCount);
      // Persistently record selected emails so they are NEVER repeated even across server restarts
      recordAttemptedEmails(selected);

      targetTasks = selected.map((e) => ({ email: e, isFreeCloud: false, isGmailDot: true }));`;

if (!targetRegex.test(content)) {
  console.error("targetRegex did not match!");
  process.exit(1);
}

content = content.replace(targetRegex, replacement);
fs.writeFileSync(filePath, content, "utf-8");
console.log("Patched auto-reg route with persistent attempted emails & shuffle successfully!");

