const sampleRealTikTokEmail = `
Date: Wed, 4 Nov 2026 08:44:02 +0000
Subject: 048260 is your verification code
From: "TikTok" <noreply@account.tiktok.com>
To: <doanconghau231020@gmail.com>

<!DOCTYPE html>
<html>
<head>
<style>
body { color: #000000; background: #ffffff; }
.code { font-size: 32px; font-weight: bold; color: #222222; }
</style>
</head>
<body>
<p style="color: #000000;">Verification Code</p>
<p style="color: #222222;">To verify your account, enter this code in TikTok: 048260</p>
<div style="font-size: 32px; letter-spacing: 4px; color: #fe2c55;">048260</div>
<p style="color: #000000;">Verification codes expire after 48 hours.</p>
</body>
</html>
`;

export function extractTikTokOtp(rawText: string): string | null {
  // 1. Subject pattern: "048260 is your verification code" or "048260 là mã xác minh"
  const subj = rawText.match(/\b(\d{6})\b\s*(?:is your verification code|là mã xác minh)/i);
  if (subj) return subj[1];

  // 2. Specific TikTok phrase: "enter this code in TikTok: 048260" or "nhập mã này vào TikTok: 048260"
  const phrase = rawText.match(/(?:enter this code in TikTok|nhập mã này|Verification Code)[^0-9]{1,60}(\d{6})\b/i);
  if (phrase) return phrase[1];

  // 3. Fallback: Search for 6-digit number that is NOT preceded by '#' (not hex color) and NOT 000000
  const matches = Array.from(rawText.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
    .map((m) => m[1])
    .filter((digits) => digits !== "000000" && digits !== "111111" && !digits.startsWith("0000"));

  if (matches.length > 0) return matches[0];
  return null;
}

console.log("Extracted OTP:", extractTikTokOtp(sampleRealTikTokEmail));
