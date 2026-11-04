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
  const cleanPass = appPassword.replace(/\s+/g, ""); // strip any spaces in app password
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  if (onLog) {
    await onLog(`[IMAP] Đang kết nối tới imap.gmail.com:993 cho tài khoản ${cleanUser}...`);
  }

  let attemptCount = 0;
  let lastReminder = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    attemptCount++;
    try {
      const code = await checkImapSession(cleanUser, cleanPass, startTime - 60000, async (detail) => {
        if (onLog && Date.now() - lastReminder > 15000) {
          lastReminder = Date.now();
          await onLog(detail);
        }
      });

      if (code) {
        if (onLog) await onLog(`[IMAP] 🎯 Đã tìm thấy mã OTP TikTok: [${code}] từ hộp thư Gmail!`);
        return code;
      }
    } catch (err: any) {
      if (onLog) {
        await onLog(`[IMAP] ⚠️ ${err.message}`);
      }
      // If authentication failed permanently, fail early
      if (err.message.includes("Mật khẩu ứng dụng") || err.message.includes("AUTHENTICATIONFAILED")) {
        return null;
      }
    }

    // Wait 3 seconds before next cycle if still within timeout
    const remaining = Math.max(0, Math.round((timeoutMs - (Date.now() - startTime)) / 1000));
    if (remaining <= 3) break;
    await new Promise((r) => setTimeout(r, 3000));
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

  // 1. Extract Base64 parts
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

  // 2. Decode Quoted-Printable if present
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
    // Allow up to 10 minutes clock drift, but reject emails older than 10 mins
    if (!isNaN(msgDate) && msgDate < minTimestamp - 600000) {
      return null;
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

  // 1. Check Subject specifically (Most reliable - TikTok puts code directly in Subject)
  const subjLine = decodedHeaders.match(/Subject:\s*([^\r\n]+)/i)?.[1] || "";
  const subjOtpMatch =
    subjLine.match(/\b(\d{6})\b\s*(?:là mã|is your|mã xác)/i) ||
    subjLine.match(/(?:code|mã)[:\s]*\b(\d{6})\b/i) ||
    subjLine.match(/\b(\d{6})\b/);

  if (subjOtpMatch && isValidOtp(subjOtpMatch[1])) {
    return subjOtpMatch[1];
  }

  // 2. Check Body phrases
  const bodyPhrases = [
    /(?:enter this code|nhập mã|mã xác minh|mã xác nhận|verification code|TikTok code)[^0-9]{1,50}\b(\d{6})\b/i,
    /\b(\d{6})\b[^0-9]{1,50}(?:is your verification code|là mã xác minh|là mã xác nhận)/i,
  ];

  for (const regex of bodyPhrases) {
    const m = decodedBody.match(regex);
    if (m && isValidOtp(m[1])) {
      return m[1];
    }
  }

  // 3. Fallback: Any standalone 6-digit number not part of CSS hex color (#000000)
  const matches = Array.from(decodedBody.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
    .map((m) => m[1])
    .filter(isValidOtp);

  return matches[0] || null;
}

/**
 * Execute a single IMAP polling cycle with robust state machine
 */
function checkImapSession(
  user: string,
  pass: string,
  minTimestamp?: number,
  onProgress?: (msg: string) => Promise<void>
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const finish = (result: string | null) => {
      if (!resolved) {
        resolved = true;
        try {
          socket.destroy();
        } catch {}
        resolve(result);
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
        timeout: 12000,
      },
      () => {
        let tagCounter = 1;
        let buffer = "";
        let stage: "GREETING" | "LOGIN" | "SELECT" | "SEARCH" | "FETCH" = "GREETING";
        let candidateSeqs: string[] = [];
        let fetchIndex = 0;

        const send = (cmd: string) => {
          const tag = `A${tagCounter++}`;
          socket.write(`${tag} ${cmd}\r\n`);
          return tag;
        };

        socket.on("data", async (data) => {
          buffer += data.toString("utf8");

          // 1. Initial Greeting
          if (stage === "GREETING" && buffer.includes("* OK")) {
            buffer = "";
            stage = "LOGIN";
            send(`LOGIN "${user}" "${pass}"`);
          }

          // 2. Login Response
          else if (stage === "LOGIN") {
            if (buffer.includes("NO") || buffer.includes("BAD")) {
              fail(
                new Error(
                  "Đăng nhập Gmail IMAP thất bại: Vui lòng kiểm tra lại Mật khẩu ứng dụng (16 chữ cái) hoặc Bật IMAP trong Cài đặt Gmail (Settings > Forwarding & POP/IMAP > Enable IMAP)"
                )
              );
              return;
            }
            if (buffer.includes("OK")) {
              buffer = "";
              stage = "SELECT";
              send("SELECT INBOX");
            }
          }

          // 3. Select INBOX Response
          else if (stage === "SELECT") {
            if (buffer.includes("OK [READ-WRITE]") || buffer.includes("OK [READ-ONLY]") || buffer.includes("OK Success")) {
              buffer = "";
              stage = "SEARCH";
              // RFC standard search: Search unseen or from tiktok
              send('SEARCH OR UNSEEN FROM "tiktok"');
            }
          }

          // 4. Search Response
          else if (stage === "SEARCH") {
            if (buffer.includes("* SEARCH")) {
              const match = buffer.match(/\* SEARCH ([\d\s]+)/);
              if (match && match[1].trim()) {
                candidateSeqs = match[1].trim().split(/\s+/).filter(Boolean);
              }

              // If OR search returned nothing, fallback to checking newest 3 messages in INBOX
              if (candidateSeqs.length === 0) {
                // Check if buffer has total EXISTS count
                const existsMatch = buffer.match(/\* (\d+) EXISTS/);
                if (existsMatch) {
                  const total = parseInt(existsMatch[1], 10);
                  if (total > 0) {
                    const startSeq = Math.max(1, total - 2);
                    for (let s = startSeq; s <= total; s++) {
                      candidateSeqs.push(s.toString());
                    }
                  }
                }
              }

              if (candidateSeqs.length > 0) {
                buffer = "";
                stage = "FETCH";
                fetchIndex = candidateSeqs.length - 1; // Start from newest message
                const seq = candidateSeqs[fetchIndex];
                send(`FETCH ${seq} (INTERNALDATE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY[TEXT])`);
              } else {
                if (onProgress) {
                  await onProgress(`[IMAP] Đã kết nối Gmail [${user}]. Đang đợi email mã xác minh từ TikTok...`);
                }
                finish(null);
              }
            } else if (buffer.includes("BAD") || buffer.includes("NO")) {
              // If search failed, try SEARCH ALL as fallback
              buffer = "";
              send("SEARCH ALL");
            }
          }

          // 5. Fetch Message Content Response
          else if (stage === "FETCH") {
            if (buffer.includes("OK Fetch completed") || buffer.includes("OK Success") || buffer.includes(")\r\n")) {
              // Parse headers & body
              const headers = buffer;
              const body = buffer;
              const otp = extractTikTokOtpFromRaw(headers, body, minTimestamp);

              if (otp) {
                finish(otp);
                return;
              }

              // If not found in this message, try previous candidate if available
              fetchIndex--;
              if (fetchIndex >= 0 && fetchIndex >= candidateSeqs.length - 3) {
                buffer = "";
                const nextSeq = candidateSeqs[fetchIndex];
                send(`FETCH ${nextSeq} (INTERNALDATE BODY[HEADER.FIELDS (FROM TO SUBJECT DATE)] BODY[TEXT])`);
              } else {
                // Done checking candidates for this cycle
                finish(null);
              }
            }
          }
        });

        socket.on("error", (err) => {
          fail(err);
        });

        socket.on("timeout", () => {
          finish(null);
        });

        socket.on("end", () => {
          finish(null);
        });
      }
    );
  });
}
