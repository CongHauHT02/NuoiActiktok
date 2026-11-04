function decodeMimeWords(str) {
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        return Buffer.from(text, "base64").toString("utf8");
      } else if (encoding.toUpperCase() === "Q") {
        const clean = text.replace(/_/g, " ").replace(/=\r?\n/g, "");
        const bytes = [];
        for (let i = 0; i < clean.length; i++) {
          if (clean[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(clean.substring(i + 1, i + 3))) {
            bytes.push(parseInt(clean.substring(i + 1, i + 3), 16));
            i += 2;
          } else {
            bytes.push(clean.charCodeAt(i));
          }
        }
        return Buffer.from(bytes).toString("utf8");
      }
    } catch {
      return text;
    }
    return text;
  });
}

function decodeQuotedPrintable(str) {
  const clean = str.replace(/=\r?\n/g, "");
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === "=" && /^[0-9A-Fa-f]{2}$/.test(clean.substring(i + 1, i + 3))) {
      bytes.push(parseInt(clean.substring(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(clean.charCodeAt(i));
    }
  }
  return Buffer.from(bytes).toString("utf8");
}

function decodeBody(str) {
  // Decode base64 blocks and quoted-printable in MIME body
  let text = str;
  // If base64 parts exist
  const b64Regex = /Content-Transfer-Encoding:\s*base64[\r\n]+([\s\S]*?)(?:--|\r?\n\r?\n[A-Z]|$)/gi;
  let match;
  while ((match = b64Regex.exec(str)) !== null) {
    try {
      const cleanB64 = match[1].replace(/\r?\n/g, "").trim();
      const decoded = Buffer.from(cleanB64, "base64").toString("utf8");
      text += "\n" + decoded;
    } catch {}
  }

  // If quoted-printable exists
  if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(str)) {
    try {
      text += "\n" + decodeQuotedPrintable(str);
    } catch {}
  }

  return text;
}

function isValidOtp(code) {
  if (!code || code.length !== 6) return false;
  if (/^(\d)\1{5}$/.test(code)) return false;
  if (code.startsWith("0000")) return false;
  return true;
}

function extractTikTokOtpFromRaw(rawHeaders, rawBody, minTimestamp) {
  const decodedHeaders = decodeMimeWords(rawHeaders);
  const decodedBody = decodeBody(rawBody);
  const fullText = `${decodedHeaders}\n${decodedBody}`;

  const isTikTokRelated =
    /tiktok/i.test(fullText) ||
    /mã xác minh/i.test(fullText) ||
    /verification code/i.test(fullText);

  if (!isTikTokRelated) {
    return null;
  }

  const subjLine = decodedHeaders.match(/Subject:\s*([^\r\n]+)/i)?.[1] || "";
  const subjOtpMatch =
    subjLine.match(/\b(\d{6})\b\s*(?:là mã|is your|mã xác)/i) ||
    subjLine.match(/(?:code|mã)[:\s]*\b(\d{6})\b/i) ||
    subjLine.match(/\b(\d{6})\b/);

  if (subjOtpMatch && isValidOtp(subjOtpMatch[1])) {
    return subjOtpMatch[1];
  }

  const bodyPhrases = [
    /(?:enter this code|nhập mã|mã xác minh|verification code|TikTok code)[^0-9]{1,50}\b(\d{6})\b/i,
    /\b(\d{6})\b[^0-9]{1,50}(?:is your verification code|là mã xác minh)/i,
  ];

  for (const regex of bodyPhrases) {
    const m = decodedBody.match(regex);
    if (m && isValidOtp(m[1])) {
      return m[1];
    }
  }

  const matches = Array.from(decodedBody.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
    .map((m) => m[1])
    .filter(isValidOtp);

  return matches[0] || null;
}

// Test case 1: Raw MIME Base64 Subject from TikTok Vietnam
const headers1 = `From: "TikTok" <no-reply@account.tiktok.com>
Subject: =?utf-8?B?ODQ5MjAxIGzDoCBtw6MgeMOhYyBtaW5oIHTDoGkga2hv4bqjbiBUaWtUb2sgY+G7p2EgYuG6oW4=?=
Date: Wed, 4 Nov 2026 01:52:19 +0000`;
const body1 = `--boundary\nContent-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: base64\n\nTWEgeGFjIG1pbmg6IDg0OTIwMQ==`;

console.log("Test 1 Result:", extractTikTokOtpFromRaw(headers1, body1));

// Test case 2: English Subject
const headers2 = `From: TikTok <no-reply@tiktok.com>\nSubject: 492018 is your TikTok verification code`;
const body2 = `Hi, enter this code: 492018`;
console.log("Test 2 Result:", extractTikTokOtpFromRaw(headers2, body2));

// Test case 3: HTML body with black hex color #000000
const headers3 = `From: TikTok <no-reply@tiktok.com>\nSubject: [TikTok] Verification Code`;
const body3 = `<div style="color: #000000; background: #ffffff;">Your code is 738291. Do not share.</div>`;
console.log("Test 3 Result (avoid #000000):", extractTikTokOtpFromRaw(headers3, body3));

