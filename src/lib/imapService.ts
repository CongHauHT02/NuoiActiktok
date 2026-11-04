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
  timeoutSeconds: number = 60,
  onLog?: (msg: string) => Promise<void>
): Promise<string | null> {
  const cleanUser = gmailUser.trim().toLowerCase();
  const cleanPass = appPassword.replace(/\s+/g, ""); // strip any spaces in app password
  const startTime = Date.now();
  const timeoutMs = timeoutSeconds * 1000;

  if (onLog) {
    await onLog(`[IMAP] Đang kết nối tới imap.gmail.com:993 cho tài khoản ${cleanUser}...`);
  }

  while (Date.now() - startTime < timeoutMs) {
    try {
      const code = await checkImapOnce(cleanUser, cleanPass, startTime - 30000);
      if (code) {
        if (onLog) await onLog(`[IMAP] 🎯 Đã tìm thấy mã OTP TikTok: [${code}] từ hộp thư Gmail!`);
        return code;
      }
    } catch (err: any) {
      if (onLog) await onLog(`[IMAP] Đang kiểm tra hộp thư... (${err.message})`);
    }

    // Wait 3.5 seconds before next poll
    await new Promise((r) => setTimeout(r, 3500));
  }

  return null;
}

export function extractTikTokOtpFromImap(buffer: string, minTimestamp?: number): string | null {
  // Check Date or INTERNALDATE to avoid picking up old emails from hours/days ago
  const dateMatch = buffer.match(/Date:\s*([^\r\n]+)/i) || buffer.match(/INTERNALDATE\s+"([^"]+)"/i);
  if (dateMatch && minTimestamp) {
    const msgDate = new Date(dateMatch[1]).getTime();
    if (!isNaN(msgDate) && msgDate < minTimestamp) {
      return null; // Old email, wait for fresh incoming email
    }
  }

  // 1. Subject pattern: "048260 is your verification code" or "048260 là mã xác minh"
  const subjMatch = buffer.match(/\b(\d{6})\b\s*(?:is your verification code|là mã xác minh|is your TikTok code)/i);
  if (subjMatch) return subjMatch[1];

  // 2. Specific TikTok phrase in body: "enter this code in TikTok: 048260" or "Verification Code ... 048260"
  const phraseMatch = buffer.match(/(?:enter this code in TikTok|nhập mã này|Verification Code|Mã xác minh)[^0-9]{1,60}(\d{6})\b/i);
  if (phraseMatch && phraseMatch[1] !== "000000" && phraseMatch[1] !== "111111") {
    return phraseMatch[1];
  }

  // 3. Fallback: Any 6-digit number NOT preceded by '#' (not hex color like #000000) and NOT 000000
  const matches = Array.from(buffer.matchAll(/(?<![#&a-zA-Z0-9])(\d{6})(?![a-zA-Z0-9])/g))
    .map((m) => m[1])
    .filter((digits) => digits !== "000000" && digits !== "111111" && !digits.startsWith("0000"));

  return matches[0] || null;
}

function checkImapOnce(user: string, pass: string, minTimestamp?: number): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: "imap.gmail.com",
        port: 993,
        servername: "imap.gmail.com",
        timeout: 10000,
      },
      () => {
        let tagCounter = 1;
        let buffer = "";
        let stage: "CONNECTED" | "LOGGED_IN" | "SELECTED" | "SEARCHED" | "FETCHED" = "CONNECTED";
        let latestMsgSeq: string | null = null;
        let foundOtp: string | null = null;

        const send = (cmd: string) => {
          const tag = `A${tagCounter++}`;
          socket.write(`${tag} ${cmd}\r\n`);
          return tag;
        };

        socket.on("data", (data) => {
          buffer += data.toString("utf8");

          if (stage === "CONNECTED" && buffer.includes("* OK")) {
            buffer = "";
            stage = "LOGGED_IN";
            send(`LOGIN "${user}" "${pass}"`);
          } else if (stage === "LOGGED_IN") {
            if (buffer.includes("NO") || buffer.includes("BAD")) {
              socket.destroy();
              reject(new Error("Đăng nhập Gmail IMAP thất bại. Vui lòng kiểm tra lại Mật khẩu ứng dụng"));
              return;
            }
            if (buffer.includes("OK")) {
              buffer = "";
              stage = "SELECTED";
              send("SELECT INBOX");
            }
          } else if (stage === "SELECTED") {
            if (buffer.includes("OK [READ-WRITE]") || buffer.includes("OK [READ-ONLY]")) {
              buffer = "";
              stage = "SEARCHED";
              send('SEARCH (OR FROM "tiktok" SUBJECT "verification")');
            }
          } else if (stage === "SEARCHED") {
            if (buffer.includes("* SEARCH")) {
              const match = buffer.match(/\* SEARCH ([\d\s]+)/);
              if (match && match[1].trim()) {
                const seqs = match[1].trim().split(/\s+/).filter(Boolean);
                if (seqs.length > 0) {
                  latestMsgSeq = seqs[seqs.length - 1]; // newest message
                  buffer = "";
                  stage = "FETCHED";
                  send(`FETCH ${latestMsgSeq} (INTERNALDATE BODY[HEADER.FIELDS (SUBJECT DATE)] BODY[TEXT])`);
                  return;
                }
              }
              // No matching messages yet
              socket.end();
              resolve(null);
            }
          } else if (stage === "FETCHED") {
            const otp = extractTikTokOtpFromImap(buffer, minTimestamp);
            if (otp) {
              foundOtp = otp;
            }

            if (buffer.includes("OK Fetch completed") || buffer.includes("OK Success") || foundOtp) {
              socket.end();
              resolve(foundOtp);
            }
          }
        });

        socket.on("error", (err) => {
          socket.destroy();
          reject(err);
        });

        socket.on("timeout", () => {
          socket.destroy();
          resolve(null);
        });

        socket.on("end", () => {
          resolve(foundOtp);
        });
      }
    );
  });
}
