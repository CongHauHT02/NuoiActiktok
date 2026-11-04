import { executeAutoRegisterTikTokOnLdPlayer } from "../src/lib/ldplayerWorker";
import { MailTmService } from "../src/lib/mailTmService";

async function main() {
  console.log("=== BẮT ĐẦU TEST AUTO-REG QUA LDPLAYER 9 ===");
  const mailbox = await MailTmService.createTempMailbox();
  console.log("Mailbox:", mailbox.email);

  const result = await executeAutoRegisterTikTokOnLdPlayer({
    email: mailbox.email,
    onLog: async (msg, level) => {
      console.log(`[${level}] ${msg}`);
    },
    fetchOtp: async (email, timeoutSec) => {
      return await MailTmService.waitForTikTokOtp(mailbox.token, timeoutSec);
    },
  });

  console.log("=== KẾT QUẢ ===", result);
}

main().catch(console.error);

