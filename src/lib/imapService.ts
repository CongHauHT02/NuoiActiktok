// Memory set to prevent reusing the same OTP twice
const usedOtpCodes = new Set<string>();
import tls from "tls";

/**
 * Pure Node.js TLS IMAP Client to fetch TikTok OTP from Gmail
 * Uses Gmail IMAP (imap.gmail.com:993) with standard TLS.
 * Requires Gmail App Password (Mật khẩu ứng dụng 16 ký tự).
 * Zero external npm dependencies!
 */
export async function fetchGmailOtpViaImap(
  gmailUser: string,
  appPassword: string,
  timeoutSeconds: number = 90,
  onLog?: (msg: string) => Promise<void>
): Promise<string | null> {
  const cleanUser = gmailUser.trim().toLowerCase();
  const cleanPass = appPassword.replace(/\s+/g, ""); // strip spaces
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  if (onLog) {
    await onLog(`[IMAP] Đang kết nối tới imap.gmail.com:993 cho tài khoản ${cleanUser}...`);
  }

  let attempt = 0;
  while (Date.now() - startTime < timeoutMs) {
    attempt++;
    try {
      const code = await checkImapSession(cleanUser, cleanPass, startTime - 15000, onLog);
      if (code) {
        if (onLog) await onLog(`[IMAP] 🎯 Đã tìm thấy mã OTP TikTok: [${code}] từ hộp thư Gmail!`);
        return code;
      }
    } catch (err: any) {
      if (onLog) {
        await onLog(`[IMAP] ⚠️ ${err.message}`);
      }
      if (err.message.includes("Mật khẩu ứng dụng") || err.message.includes("AUTHENTICATIONFAILED")) {
        return null; // Don't retry if credentials invalid
      }
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, timeoutSeconds - elapsed);
    if (remaining <= 3) break;

    // Sleep 4 seconds between poll cycles
    await new Promise((r) => setTimeout(r, 4000));
  }

  return null;
}

/**
 * Decode RFC 2047 MIME Encoded-Words in email headers
 * e.g. "=?utf-8?B?ODQ5MjAxIGzDoCBtw6MgeMOhYyBtaW5o...==?=" -> "849201 là mã xác minh..."
 */
export function decodeMimeWords(str: string): string {
  if (!str) return "";
  return str.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        return Buffer.from(text, "base64").toString("utf8");
      } else if (encoding.toUpperCase() === "Q") {
        const clean = text.replace(/_/g, " ").replace(/=\r?\n/g, "");
        const bytes: number[] = [];
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

/**
 * Decode Quoted-Printable transfer encoding
 */
export function decodeQuotedPrintable(str: string): string {
  if (!str) return "";
  const clean = str.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
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

/**
 * Extract and decode Base64 & Quoted-Printable blocks from MIME message body
 */
export function decodeMimeBody(rawBody: string): string {
  if (!rawBody) return "";
  let fullDecoded = rawBody;

  // Extract Base64 parts
  const b64Regex = /Content-Transfer-Encoding:\s*base64[\r\n]+([\s\S]*?)(?:--|\r?\n\r?\n[A-Z]|$)/gi;
  let match;
  while ((match = b64Regex.exec(rawBody)) !== null) {
    try {
      const cleanB64 = match[1].replace(/\r?\n/g, "").trim();
      if (cleanB64.length > 8) {
        const decoded = Buffer.from(cleanB64, "base64").toString("utf8");
        fullDecoded += "\n" + decoded;
      }
    } catch {}
  }

  // Decode Quoted-Printable
  if (/Content-Transfer-Encoding:\s*quoted-printable/i.test(rawBody)) {
    try {
      fullDecoded += "\n" + decodeQuotedPrintable(rawBody);
    } catch {}
  }

  return fullDecoded;
}

export function isValidOtp(code: string): boolean {
  if (!code || code.length !== 6) return false;
  if (/^(\d)\1{5}$/.test(code)) return false; // reject 000000, 111111, etc.
  if (code.startsWith("0000")) return false;
  return true;
}

/**
 * Parse TikTok 6-digit OTP from raw IMAP email data
 */
export function extractTikTokOtpFromRaw(
  rawHeaders: string,
  rawBody: string,
  minTimestamp?: number
): string | null {
  // Check Date header if present
  const dateMatch = rawHeaders.match(/Date:\s*([^\r\n]+)/i) || rawHeaders.match(/INTERNALDATE\s+"([^"]+)"/i);
  if (dateMatch && minTimestamp) {
    const msgDate = new Date(dateMatch[1]).getTime();
    if (!isNaN(msgDate) && msgDate < minTimestamp - 600000) {
      return null; // Ignore emails older than 10 mins
    }
  }

  const decodedHeaders = decodeMimeWords(rawHeaders);
  const decodedBody = decodeMimeBody(rawBody);
  const fullText = `${decodedHeaders}\n${decodedBody}`;

  const isTikTokRelated =
    /tiktok/i.test(fullText) ||
    /mã xác minh/i.test(fullText) ||
    /mã xác nhận/i.test(fullText) ||
    /verification code/i.test(fullText);

  if (!isTikTokRelated) {
    return null;
  }

  // 1. Check Subject specifically (TikTok puts code directly in Subject)
  const subjLine = decodedHeaders.match(/Subject:\s*([^\r\n]+)/i)?.[1] || "";
  const subjOtpMatch =
    subjLine.match(/\b(\d{6})\b\s*(?:là mã|is your|mã xác)/i) ||
    subjLine.match(/(?:code|mã)[:\s]*\b(\d{6})\b/i) ||
    subjLine.match(/\b(\d{6})\b/);

  if (subjOtpMatch && isValidOtp(subjOtpMatch[1]) && !usedOtpCodes.has(subjOtpMatch[1])) {
    usedOtpCodes.add(subjOtpMatch[1]);
    return subjOtpMatch[1];
  }

  // 2. Check Body phrases
  const bodyPhrases = [
    /(?:enter this code|nhập mã|mã xác minh|mã xác nhận|verification code|TikTok code)[^0-9]{1,50}\b(\d{6})\b/i,
    /\b(\d{6})\b[^0-9]{1,50}(?:is your verification code|là mã xác minh|là mã xác nhận)/i,
  ];

  for (const regex of bodyPhrases) {
    const m = decodedBody.match(regex);
    if (m && isValidOtp(m[1]) && !usedOtpCodes.has(m[1])) {
      usedOtpCodes.add(m[1]);
      return m[1];
    }
  }

  // 3. Fallback: Any standalone 6-digit number not preceded by #
  const matches = Array.from(decodedBody.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
    .map((m) => m[1])
    .filter(isValidOtp);

  return matches[0] || null;
}

/**
 * Execute IMAP command flow using deterministic tagged response parser
 */
function checkImapSession(
  user: string,
  pass: string,
  minTimestamp?: number,
  onLog?: (msg: string) => Promise<void>
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const cleanup = (res: string | null) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.destroy();
        } catch {}
        resolve(res);
      }
    };

    const fail = (err: Error) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.destroy();
        } catch {}
        reject(err);
      }
    };

    const socket = tls.connect(
      {
        host: "imap.gmail.com",
        port: 993,
        servername: "imap.gmail.com",
        rejectUnauthorized: false, // Essential for Windows corporate/firewall/antivirus SSL proxies
        timeout: 10000,
      },
      () => {
        let tagCount = 1;
        let currentTag = "";
        let buffer = "";
        let step = "WAIT_GREETING";
        let candidateSeqs: string[] = [];
        let fetchIndex = 0;

        const sendCmd = (cmd: string) => {
          currentTag = `A${tagCount++}`;
          buffer = "";
          socket.write(`${currentTag} ${cmd}\r\n`);
          return currentTag;
        };

        socket.on("data", async (chunk) => {
          buffer += chunk.toString("utf8");

          // Step 1: Wait for greeting
          if (step === "WAIT_GREETING") {
            if (buffer.includes("* OK")) {
              step = "LOGGING_IN";
              sendCmd(`LOGIN "${user}" "${pass}"`);
            }
          }

          // Step 2: Login response
          else if (step === "LOGGING_IN") {
            if (buffer.includes(`${currentTag} OK`)) {
              if (onLog) await onLog(`[IMAP] ✅ Đăng nhập thành công vào Gmail [${user}]!`);
              step = "SELECTING_INBOX";
              sendCmd("SELECT INBOX");
            } else if (buffer.includes(`${currentTag} NO`) || buffer.includes(`${currentTag} BAD`)) {
              fail(
                new Error(
                  "Đăng nhập Gmail thất bại. Vui lòng kiểm tra lại Mật khẩu ứng dụng (16 chữ cái) trong Google Account"
                )
              );
            }
          }

          // Step 3: Select INBOX response
          else if (step === "SELECTING_INBOX") {
            if (buffer.includes(`${currentTag} OK`)) {
              // Extract total message count from INBOX
              const existsMatch = buffer.match(/\* (\d+) EXISTS/);
              const totalExists = existsMatch ? parseInt(existsMatch[1], 10) : 0;
              if (onLog) await onLog(`[IMAP] Đã mở INBOX (${totalExists} thư). Đang quét thư từ TikTok...`);

              // Step 4: Search for messages from TikTok
              step = "SEARCHING";
              sendCmd('SEARCH FROM "tiktok"');
            } else if (buffer.includes(`${currentTag} NO`) || buffer.includes(`${currentTag} BAD`)) {
              fail(new Error("Không thể mở hộp thư INBOX Gmail"));
            }
          }

          // Step 4: Search response
          else if (step === "SEARCHING") {
            if (buffer.includes(`${currentTag} OK`)) {
              const searchMatch = buffer.match(/\* SEARCH ([\d\s]+)/);
              if (searchMatch && searchMatch[1].trim()) {
                candidateSeqs = searchMatch[1].trim().split(/\s+/).filter(Boolean);
              }

              // If FROM "tiktok" didn't find any message, try searching ALL
              if (candidateSeqs.length === 0) {
                step = "SEARCHING_ALL";
                sendCmd("SEARCH ALL");
                return;
              }

              if (onLog) await onLog(`[IMAP] Tìm thấy ${candidateSeqs.length} thư TikTok trong INBOX. Đang đọc thư mới nhất...`);
              step = "FETCHING";
              fetchIndex = candidateSeqs.length - 1;
              const seq = candidateSeqs[fetchIndex];
              sendCmd(`FETCH ${seq} (INTERNALDATE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY[TEXT])`);
            } else if (buffer.includes(`${currentTag} NO`) || buffer.includes(`${currentTag} BAD`)) {
              step = "SEARCHING_ALL";
              sendCmd("SEARCH ALL");
            }
          }

          // Fallback: Search all messages
          else if (step === "SEARCHING_ALL") {
            if (buffer.includes(`${currentTag} OK`)) {
              const searchMatch = buffer.match(/\* SEARCH ([\d\s]+)/);
              if (searchMatch && searchMatch[1].trim()) {
                const all = searchMatch[1].trim().split(/\s+/).filter(Boolean);
                // Take only the last 3 messages (most recent)
                candidateSeqs = all.slice(-3);
              }

              if (candidateSeqs.length > 0) {
                step = "FETCHING";
                fetchIndex = candidateSeqs.length - 1;
                const seq = candidateSeqs[fetchIndex];
                sendCmd(`FETCH ${seq} (INTERNALDATE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY[TEXT])`);
              } else {
                cleanup(null);
              }
            }
          }

          // Step 5: Fetch response
          else if (step === "FETCHING") {
            if (buffer.includes(`${currentTag} OK`)) {
              const otp = extractTikTokOtpFromRaw(buffer, buffer, minTimestamp);
              if (otp) {
                cleanup(otp);
                return;
              }

              // If not found in this message, try the previous candidate (up to 3 recent)
              fetchIndex--;
              if (fetchIndex >= 0 && fetchIndex >= candidateSeqs.length - 3) {
                const prevSeq = candidateSeqs[fetchIndex];
                sendCmd(`FETCH ${prevSeq} (INTERNALDATE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY[TEXT])`);
              } else {
                // Done checking candidates for this cycle
                cleanup(null);
              }
            }
          }
        });

        socket.on("error", (err) => {
          fail(err);
        });

        socket.on("timeout", () => {
          cleanup(null);
        });

        socket.on("end", () => {
          cleanup(null);
        });
      }
    );
  });
}
