/**
 * Mail.tm Free Cloud Email Service for Automated TikTok OTP Retrieval
 * 100% Free, No credentials needed, Accepted by TikTok outgoing mail servers
 */

export interface MailTmAccount {
  email: string;
  password: string;
  token: string;
  accountId: string;
}

export class MailTmService {
  private static BASE_URL = "https://api.mail.tm";

  /**
   * Get the primary active free domain from Mail.tm
   */
  static async getActiveDomain(): Promise<string> {
    try {
      const res = await fetch(`${this.BASE_URL}/domains`);
      const data = await res.json();
      const domains = data["hydra:member"] || [];
      const active = domains.find((d: any) => d.isActive) || domains[0];
      return active?.domain || "fldubai.com";
    } catch {
      return "fldubai.com";
    }
  }

  /**
   * Create a free instant mailbox and return authentication token
   */
  static async createTempMailbox(): Promise<MailTmAccount> {
    const domain = await this.getActiveDomain();
    const randomPrefix = `tt_${Math.random().toString(36).substring(2, 9)}`;
    const email = `${randomPrefix}@${domain}`;
    const password = `TkPro#${Math.random().toString(36).substring(2, 8)}@26`;

    // 1. Create account
    const createRes = await fetch(`${this.BASE_URL}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });
    const createData = await createRes.json();

    if (!createData.id) {
      throw new Error(`Không thể tạo hộp thư Mail.tm: ${JSON.stringify(createData)}`);
    }

    // 2. Obtain JWT Token
    const tokenRes = await fetch(`${this.BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.token) {
      throw new Error("Không thể lấy token xác thực Mail.tm");
    }

    return {
      email,
      password,
      token: tokenData.token,
      accountId: createData.id,
    };
  }

  /**
   * Poll Mail.tm inbox for incoming TikTok verification email and extract 6-digit OTP
   */
  static async waitForTikTokOtp(
    token: string,
    timeoutSeconds = 60,
    onProgress?: (message: string) => Promise<void>
  ): Promise<string | null> {
    const pollInterval = 3000;
    const maxAttempts = Math.ceil((timeoutSeconds * 1000) / pollInterval);

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, pollInterval));

      try {
        const res = await fetch(`${this.BASE_URL}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const messages = data["hydra:member"] || [];

        if (messages.length > 0) {
          // Find message from TikTok
          const ttMsg = messages.find(
            (m: any) =>
              m.from?.address?.toLowerCase().includes("tiktok") ||
              m.subject?.toLowerCase().includes("verification") ||
              m.subject?.toLowerCase().includes("mã")
          ) || messages[0];

          if (ttMsg) {
            // Extract from subject or intro
            const textToScan = `${ttMsg.subject || ""} ${ttMsg.intro || ""}`;
            const match = textToScan.match(/\b(\d{6})\b/);
            if (match) {
              return match[1];
            }

            // Otherwise fetch full message body
            const fullRes = await fetch(`${this.BASE_URL}/messages/${ttMsg.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const fullData = await fullRes.json();
            const fullText = `${fullData.text || ""} ${fullData.html || ""}`;
            const fullMatch = fullText.match(/\b(\d{6})\b/);
            if (fullMatch) {
              return fullMatch[1];
            }
          }
        } else if (onProgress && i % 3 === 0) {
          await onProgress(`Đang lắng nghe hộp thư... (${(i + 1) * 3}s)`);
        }
      } catch (err: any) {
        console.error("Mail.tm poll error:", err.message);
      }
    }

    return null;
  }
}

